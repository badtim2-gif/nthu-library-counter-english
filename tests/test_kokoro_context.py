"""Offline carrier-cut guards; run with the pinned Kokoro production Python."""
import ast
import hashlib
import math
from pathlib import Path
import re
import tempfile
from types import SimpleNamespace
import unittest

import numpy as np
import soundfile as sf


SOURCE = Path(__file__).resolve().parents[1] / "scripts" / "generate-kokoro-audio.py"
tree = ast.parse(SOURCE.read_text(encoding="utf-8"))
function = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "synthesize_context_word")
namespace = dict(np=np, sf=sf, math=math, re=re, SAMPLE_RATE=24000,
                 LEAD_SECONDS=.08, TAIL_SECONDS=.12,
                 sha256=lambda p: hashlib.sha256(p.read_bytes()).hexdigest())
# Test only the pure extraction function; no model loading or network calls.
test_module = ast.Module(body=[ast.ImportFrom(module="__future__", names=[ast.alias(name="annotations")], level=0), function], type_ignores=[])
exec(compile(ast.fix_missing_locations(test_module), str(SOURCE), "exec"), namespace)
extract = namespace["synthesize_context_word"]


class Tensor:
    def detach(self): return self
    def cpu(self): return self
    def numpy(self): return np.full(48000, .1, dtype=np.float32)


class Pipeline:
    def __init__(self, start=.9, end=1.5, previous=.7, duplicate=False, following=False, missing=False):
        self.tokens = [SimpleNamespace(text="Please", phonemes="pliz", start_ts=.1, end_ts=previous),
                       SimpleNamespace(text="receive", phonemes="wrong", start_ts=start, end_ts=end)]
        if duplicate:
            self.tokens.append(SimpleNamespace(text="receive", phonemes="wrong", start_ts=1.6, end_ts=1.8))
        if following:
            self.tokens.append(SimpleNamespace(text="now", phonemes="nau", start_ts=1.6, end_ts=1.8))
        self.missing = missing

    def g2p(self, text): return "", self.tokens
    def generate_from_tokens(self, tokens, **kwargs):
        yield SimpleNamespace(audio=Tensor(), tokens=None if self.missing else tokens)


class ContextTests(unittest.TestCase):
    def call(self, pipeline=None, **kwargs):
        with tempfile.TemporaryDirectory() as temp:
            args = dict(pipeline=pipeline or Pipeline(), word="receive", phonemes="riSiv",
                        context={"method": "aligned-carrier-v1", "text": "Please say: receive."},
                        voice_pack=None, speed=.75, context_path=Path(temp) / "context.wav")
            args.update(kwargs)
            audio, record = extract(**args)
            self.assertTrue(args["context_path"].exists())
            return audio, record

    def test_valid_cut_preserves_padding_alignment_and_target(self):
        audio, record = self.call()
        self.assertEqual(record["target_phonemes"], "riSiv")
        self.assertEqual(record["tokens"][1]["phonemes"], "riSiv")
        self.assertGreaterEqual(record["leading_margin_seconds"], .02)
        self.assertGreaterEqual(record["trailing_margin_seconds"], .02)
        self.assertTrue(np.all(audio[:1920] == 0))
        self.assertTrue(np.all(audio[-2880:] == 0))
        self.assertEqual(len(record["context_pcm_sha256"]), 64)

    def test_rejects_ambiguous_or_nonfinal_target(self):
        for pipeline in (Pipeline(duplicate=True), Pipeline(following=True)):
            with self.subTest(pipeline=pipeline), self.assertRaises(ValueError):
                self.call(pipeline)

    def test_rejects_wrong_carrier_or_missing_phonemes(self):
        for options in ({"context": {"method": "aligned-carrier-v1", "text": "receive"}}, {"phonemes": ""}):
            with self.subTest(options=options), self.assertRaises(ValueError):
                self.call(**options)

    def test_rejects_missing_invalid_or_unsafe_timestamps(self):
        for pipeline in (Pipeline(missing=True), Pipeline(start=None), Pipeline(start=float("nan")),
                         Pipeline(end=3), Pipeline(previous=.895), Pipeline(end=1.99)):
            with self.subTest(pipeline=pipeline), self.assertRaises(RuntimeError):
                self.call(pipeline)


if __name__ == "__main__":
    unittest.main()
