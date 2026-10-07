#!/usr/bin/env python3
"""Generate the 682 non-alphabet production clips with pinned Kokoro models.

The script deliberately writes outside public/audio.  Review and validate the
staging output before copying it into the application.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import platform
import re
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path

import numpy as np
import soundfile as sf
import torch
from kokoro import KModel, KPipeline


SAMPLE_RATE = 24_000
BIT_RATE = "48k"
TARGET_LUFS = -22.3
ENCODE_TRUE_PEAK = -3.5
MAX_FINAL_TRUE_PEAK = -3.0
LRA = 5.0
LEAD_SECONDS = 0.08
TAIL_SECONDS = 0.12
CHUNK_GAP_SECONDS = 0.12

MODEL_SPECS = {
    "v1.0": {
        "repo_id": "hexgrad/Kokoro-82M",
        "revision": "f3ff3571791e39611d31c381e3a41a3af07b4987",
        "weight": "kokoro-v1_0.pth",
        "weight_sha256": "496dba118d1a58f5f3db2efc88dbdc216e0483fc89fe6e47ee1f2c53f18ad1e4",
    },
    "v1.1-zh": {
        "repo_id": "hexgrad/Kokoro-82M-v1.1-zh",
        "revision": "8913be6a3a2d1b410c83c24fb7b8821a8843b0c5",
        "weight": "kokoro-v1_1-zh.pth",
        "weight_sha256": "b1d8410fa44dfb5c15471fd6c4225ea6b4e9ac7fa03c98e8bea47a9928476e2b",
    },
}

VOICE_SPECS = {
    "reader-en": {
        "model": "v1.0",
        "lang_code": "a",
        "voice": "am_fenrir",
        "speed": 0.8,
        "sha256": "98e507eca1db08230ae3b6232d59c10aec9630022d19accac4f5d12fcec3c37a",
    },
    "explainer-en": {
        "model": "v1.0",
        "lang_code": "a",
        "voice": "am_puck",
        "speed": 0.8,
        "sha256": "dd1d8973f4ce4b7d8ae407c77a435f485dabc052081b80ea75c4f30b84f36223",
    },
    "librarian-en": {
        "model": "v1.1-zh",
        "lang_code": "a",
        "voice": "af_maple",
        "speed": 0.8,
        "sha256": None,
    },
    "chinese": {
        "model": "v1.1-zh",
        "lang_code": "z",
        "voice": "zm_010",
        "speed": 0.9,
        "sha256": None,
    },
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def run(command: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, check=True, capture_output=True, text=True, encoding="utf-8", errors="replace")


def parse_loudnorm(stderr: str) -> dict[str, float]:
    matches = re.findall(r"\{\s*\"input_i\".*?\}", stderr, flags=re.DOTALL)
    if not matches:
        raise RuntimeError(f"Unable to parse loudnorm output:\n{stderr[-2000:]}")
    data = json.loads(matches[-1])
    return {
        "integrated_lufs": float(data["input_i"]),
        "true_peak_dbfs": float(data["input_tp"]),
        "lra_lu": float(data["input_lra"]),
        "threshold_lufs": float(data["input_thresh"]),
    }


def measure(path: Path) -> dict[str, float]:
    result = run([
        "ffmpeg", "-hide_banner", "-nostats", "-i", str(path),
        "-af", "loudnorm=I=-22.3:TP=-3.0:LRA=5:print_format=json",
        "-f", "null", "-",
    ])
    return parse_loudnorm(result.stderr)


def probe(path: Path) -> dict[str, object]:
    result = run([
        "ffprobe", "-v", "error", "-select_streams", "a:0",
        "-show_entries", "stream=codec_name,sample_rate,channels,bit_rate:format=duration",
        "-of", "json", str(path),
    ])
    data = json.loads(result.stdout)
    stream = data["streams"][0]
    return {
        "codec": stream.get("codec_name"),
        "sample_rate": int(stream.get("sample_rate", 0)),
        "channels": int(stream.get("channels", 0)),
        "bit_rate": int(stream.get("bit_rate", 0)),
        "duration_seconds": round(float(data["format"]["duration"]), 3),
    }


def audio_duration(path: Path) -> float:
    result = run([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(path),
    ])
    return float(result.stdout.strip())


def pace_english_long(raw_wav: Path, paced_wav: Path, text: str) -> tuple[float, int]:
    words = len(re.findall(r"\b[\w']+\b", text))
    source_duration = audio_duration(raw_wav)
    speech_duration = max(0.05, source_duration - LEAD_SECONDS - TAIL_SECONDS)
    target_speech_duration = words / 120.0 * 60.0
    tempo = speech_duration / target_speech_duration
    trim_end = source_duration - TAIL_SECONDS
    paced_wav.parent.mkdir(parents=True, exist_ok=True)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(raw_wav),
        "-af", (
            f"atrim=start={LEAD_SECONDS}:end={trim_end:.6f},asetpts=PTS-STARTPTS,"
            f"atempo={tempo:.8f},adelay={int(LEAD_SECONDS * 1000)},"
            f"apad=pad_dur={TAIL_SECONDS}"
        ),
        "-ar", str(SAMPLE_RATE), "-ac", "1", "-c:a", "pcm_s16le", str(paced_wav),
    ])
    return tempo, words

def normalize(raw_wav: Path, output_mp3: Path) -> tuple[dict[str, float], float]:
    applied_target = TARGET_LUFS
    output_mp3.parent.mkdir(parents=True, exist_ok=True)
    for _ in range(5):
        run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(raw_wav),
            "-af", f"loudnorm=I={applied_target:.2f}:TP={ENCODE_TRUE_PEAK}:LRA={LRA}:linear=false",
            "-ar", str(SAMPLE_RATE), "-ac", "1", "-b:a", BIT_RATE, str(output_mp3),
        ])
        loudness = measure(output_mp3)
        if abs(loudness["integrated_lufs"] - TARGET_LUFS) <= 1.0 and loudness["true_peak_dbfs"] <= MAX_FINAL_TRUE_PEAK:
            return loudness, applied_target
        if loudness["true_peak_dbfs"] > MAX_FINAL_TRUE_PEAK:
            applied_target -= loudness["true_peak_dbfs"] - MAX_FINAL_TRUE_PEAK + 0.15
        else:
            applied_target += TARGET_LUFS - loudness["integrated_lufs"]
        applied_target = min(-18.0, max(-29.0, applied_target))
    # A few short, peaky phrases cannot meet both rules through loudnorm alone.
    # Use mild compression only for this fallback, then re-run the same checks.
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(raw_wav),
        "-af", (
            "acompressor=threshold=-18dB:ratio=3:attack=5:release=50:makeup=3,"
            f"loudnorm=I={TARGET_LUFS}:TP={ENCODE_TRUE_PEAK}:LRA={LRA}:linear=false"
        ),
        "-ar", str(SAMPLE_RATE), "-ac", "1", "-b:a", BIT_RATE, str(output_mp3),
    ])
    compressed_loudness = measure(output_mp3)
    if (
        abs(compressed_loudness["integrated_lufs"] - TARGET_LUFS) <= 1.0
        and compressed_loudness["true_peak_dbfs"] <= MAX_FINAL_TRUE_PEAK
    ):
        return compressed_loudness, TARGET_LUFS
    # Very short words can make loudnorm alternate between the integrated and
    # true-peak constraints. Apply one bounded final gain without relaxing the
    # acceptance thresholds.
    desired_gain = TARGET_LUFS - loudness["integrated_lufs"]
    peak_safe_gain = MAX_FINAL_TRUE_PEAK - 0.05 - loudness["true_peak_dbfs"]
    gain = min(desired_gain, peak_safe_gain)
    if gain > 0:
        refined = output_mp3.with_name(f"{output_mp3.stem}.refined.mp3")
        run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(output_mp3),
            "-af", f"volume={gain:.3f}dB", "-ar", str(SAMPLE_RATE), "-ac", "1",
            "-b:a", BIT_RATE, str(refined),
        ])
        refined_loudness = measure(refined)
        if (
            abs(refined_loudness["integrated_lufs"] - TARGET_LUFS) <= 1.0
            and refined_loudness["true_peak_dbfs"] <= MAX_FINAL_TRUE_PEAK
        ):
            os.replace(refined, output_mp3)
            return refined_loudness, applied_target
        refined.unlink(missing_ok=True)
    raise RuntimeError(f"Loudness target not reached for {output_mp3.name}: {loudness}")


def boundary_peaks(path: Path) -> dict[str, float]:
    data, rate = sf.read(path, dtype="float32")
    if data.ndim > 1:
        data = data[:, 0]
    lead = data[: max(1, int(rate * 0.04))]
    tail = data[-max(1, int(rate * 0.06)) :]
    return {
        "leading_40ms": round(float(np.max(np.abs(lead))), 8),
        "trailing_60ms": round(float(np.max(np.abs(tail))), 8),
    }


def select_voice(entry: dict[str, object]) -> str:
    if entry["language"] == "zh":
        return "chinese"
    if entry["role"] == "reader":
        return "reader-en"
    if entry["role"] == "librarian":
        return "librarian-en"
    return "explainer-en"


def synthesize(
    pipeline: KPipeline, text: str, voice_pack: torch.Tensor, speed: float,
    phonemes: str | None = None,
) -> np.ndarray:
    parts: list[np.ndarray] = []
    results = (
        pipeline.generate_from_tokens(phonemes, voice=voice_pack, speed=speed)
        if phonemes else pipeline(text, voice=voice_pack, speed=speed)
    )
    for result in results:
        audio = result.audio
        if audio is None:
            continue
        part = audio.detach().cpu().numpy().astype(np.float32)
        if part.size:
            parts.append(part)
    if not parts:
        raise RuntimeError("Kokoro produced no audio")
    gap = np.zeros(int(SAMPLE_RATE * CHUNK_GAP_SECONDS), dtype=np.float32)
    joined: list[np.ndarray] = []
    for index, part in enumerate(parts):
        if index:
            joined.append(gap)
        joined.append(part)
    return np.concatenate([
        np.zeros(int(SAMPLE_RATE * LEAD_SECONDS), dtype=np.float32),
        *joined,
        np.zeros(int(SAMPLE_RATE * TAIL_SECONDS), dtype=np.float32),
    ])


def load_model(model_dir: Path, key: str) -> KModel:
    spec = MODEL_SPECS[key]
    weight = model_dir / spec["weight"]
    config = model_dir / "config.json"
    if sha256(weight) != spec["weight_sha256"]:
        raise RuntimeError(f"Pinned model hash mismatch: {weight}")
    return KModel(repo_id=spec["repo_id"], config=str(config), model=str(weight)).eval()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--model-v10", type=Path, required=True)
    parser.add_argument("--model-v11zh", type=Path, required=True)
    args = parser.parse_args()

    args.output.mkdir(parents=True, exist_ok=True)
    raw_dir = args.output / "raw-wav"
    paced_dir = args.output / "paced-wav"
    audio_dir = args.output / "audio"
    raw_dir.mkdir(exist_ok=True)
    paced_dir.mkdir(exist_ok=True)
    audio_dir.mkdir(exist_ok=True)

    source = json.loads(args.manifest.read_text(encoding="utf-8"))
    entries = [entry for entry in source["entries"] if entry["kind"] != "letter"]
    if len(entries) != 682:
        raise RuntimeError(f"Expected 682 synthetic clips, found {len(entries)}")

    model_dirs = {"v1.0": args.model_v10, "v1.1-zh": args.model_v11zh}
    for spec in VOICE_SPECS.values():
        voice_path = model_dirs[spec["model"]] / "voices" / f'{spec["voice"]}.pt'
        actual = sha256(voice_path)
        if spec["sha256"] and actual != spec["sha256"]:
            raise RuntimeError(f"Pinned voice hash mismatch: {voice_path}")
        spec["sha256"] = actual

    records: list[dict[str, object]] = []
    counter = 0
    for model_key in ("v1.0", "v1.1-zh"):
        model = load_model(model_dirs[model_key], model_key)
        pipelines: dict[str, KPipeline] = {}
        voice_packs: dict[str, torch.Tensor] = {}
        for voice_key, spec in VOICE_SPECS.items():
            if spec["model"] != model_key:
                continue
            lang = spec["lang_code"]
            if lang not in pipelines:
                options = {}
                if lang == "z":
                    if "a" not in pipelines:
                        pipelines["a"] = KPipeline(
                            lang_code="a", repo_id=MODEL_SPECS[model_key]["repo_id"], model=model
                        )
                    english_pipeline = pipelines["a"]
                    options["en_callable"] = lambda text, pipeline=english_pipeline: pipeline.g2p(text)[0]
                pipelines[lang] = KPipeline(
                    lang_code=lang,
                    repo_id=MODEL_SPECS[model_key]["repo_id"],
                    model=model,
                    **options,
                )
            voice_path = model_dirs[model_key] / "voices" / f'{spec["voice"]}.pt'
            voice_packs[voice_key] = torch.load(voice_path, map_location="cpu", weights_only=True)

        for entry in entries:
            voice_key = select_voice(entry)
            spec = VOICE_SPECS[voice_key]
            if spec["model"] != model_key:
                continue
            counter += 1
            filename = entry["file"]
            raw_path = raw_dir / filename.replace(".mp3", ".wav")
            output_path = audio_dir / filename
            speed = float(entry.get("speed", spec["speed"]))
            phonemes = entry.get("phonemes")
            # Overrides must not reuse WAVs generated with the default pronunciation.
            if not raw_path.exists() or phonemes or speed != spec["speed"]:
                audio = synthesize(
                    pipelines[spec["lang_code"]],
                    entry["text"],
                    voice_packs[voice_key],
                    speed,
                    phonemes,
                )
                sf.write(raw_path, audio, SAMPLE_RATE, subtype="PCM_16")
            normalization_input = raw_path
            tempo = None
            words = None
            if entry["kind"] == "english_long":
                normalization_input = paced_dir / filename.replace(".mp3", ".wav")
                tempo, words = pace_english_long(raw_path, normalization_input, entry["text"])
            loudness, applied_target = normalize(normalization_input, output_path)
            technical = probe(output_path)
            boundaries = boundary_peaks(output_path)
            checks = {
                "codec_mp3": technical["codec"] == "mp3",
                "sample_rate_24000": technical["sample_rate"] == SAMPLE_RATE,
                "mono": technical["channels"] == 1,
                "bit_rate_near_48000": 45_000 <= technical["bit_rate"] <= 51_000,
                "duration_valid": technical["duration_seconds"] > 0.25,
                "loudness_within_1_lu": abs(loudness["integrated_lufs"] - TARGET_LUFS) <= 1.0,
                "true_peak_not_over_limit": loudness["true_peak_dbfs"] <= MAX_FINAL_TRUE_PEAK,
                "leading_safety_silence": boundaries["leading_40ms"] <= 0.002,
                "trailing_safety_silence": boundaries["trailing_60ms"] <= 0.002,
            }
            if not all(checks.values()):
                raise RuntimeError(f"Validation failed for {filename}: {checks}")
            record = {
                "file": filename,
                "text": entry["text"],
                "language": entry["language"],
                "role": entry["role"],
                "kind": entry["kind"],
                "model": model_key,
                "voice": spec["voice"],
                "speed": speed,
                "applied_target_lufs": round(applied_target, 2),
                "sha256": sha256(output_path),
                "technical": technical,
                "loudness": loudness,
                "boundary_peaks": boundaries,
                "checks": checks,
            }
            if phonemes:
                record["phonemes"] = phonemes
            if tempo is not None and words is not None:
                effective_duration = max(0.05, technical["duration_seconds"] - LEAD_SECONDS - TAIL_SECONDS)
                record["timing"] = {
                    "base_kokoro_speed": speed,
                    "postprocess_atempo": round(tempo, 8),
                    "word_count": words,
                    "verified_wpm": round(words / effective_duration * 60.0, 1),
                }
            records.append(record)
            print(f"[{counter:03d}/682] {filename} {spec['voice']} {loudness['integrated_lufs']:.2f} LUFS", flush=True)

        del pipelines, voice_packs, model
        torch.cuda.empty_cache()

    expected = {entry["file"] for entry in entries}
    actual = {path.name for path in audio_dir.glob("*.mp3")}
    if actual != expected:
        raise RuntimeError(f"Output file set mismatch; missing={sorted(expected-actual)}, extra={sorted(actual-expected)}")
    hashes = [record["sha256"] for record in records]
    if len(set(hashes)) != len(hashes):
        raise RuntimeError("Generated clips contain duplicate SHA-256 values")

    manifest = {
        "created_at": datetime.now().astimezone().isoformat(timespec="seconds"),
        "status": "passed",
        "purpose": "Production replacement for the 682 synthetic speech clips; alphabet recordings excluded.",
        "source_manifest": str(args.manifest.resolve()),
        "environment": {
            "python": platform.python_version(),
            "torch": torch.__version__,
            "kokoro": __import__("importlib.metadata").metadata.version("kokoro"),
            "misaki": __import__("importlib.metadata").metadata.version("misaki"),
            "device": "cpu",
        },
        "models": MODEL_SPECS,
        "voices": VOICE_SPECS,
        "audio_format": {
            "codec": "MP3",
            "sample_rate_hz": SAMPLE_RATE,
            "channels": 1,
            "target_bit_rate_bps": 48_000,
            "target_lufs": TARGET_LUFS,
            "maximum_true_peak_dbfs": MAX_FINAL_TRUE_PEAK,
            "lead_silence_ms": int(LEAD_SECONDS * 1000),
            "tail_silence_ms": int(TAIL_SECONDS * 1000),
            "chunk_gap_ms": int(CHUNK_GAP_SECONDS * 1000),
        },
        "clip_count": len(records),
        "unique_sha256_count": len(set(hashes)),
        "records": sorted(records, key=lambda item: item["file"]),
    }
    manifest_path = args.output / "production-manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    summary = {
        "status": "passed",
        "clip_count": len(records),
        "unique_sha256_count": len(set(hashes)),
        "manifest_sha256": sha256(manifest_path),
        "minimum_lufs": min(record["loudness"]["integrated_lufs"] for record in records),
        "maximum_lufs": max(record["loudness"]["integrated_lufs"] for record in records),
        "maximum_true_peak_dbfs": max(record["loudness"]["true_peak_dbfs"] for record in records),
    }
    (args.output / "validation-summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    shutil.copy2(model_dirs["v1.0"] / "README.md", args.output / "MODEL-v1.0-README.md")
    shutil.copy2(model_dirs["v1.0"] / "VOICES.md", args.output / "MODEL-v1.0-VOICES.md")
    shutil.copy2(model_dirs["v1.1-zh"] / "README.md", args.output / "MODEL-v1.1-zh-README.md")
    print(json.dumps(summary, ensure_ascii=False, indent=2), flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
