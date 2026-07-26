"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  allAudioPaths,
  audioPaths,
  CHECKED_AT,
  posSpeech,
  scenarios,
  type Role,
  type Scenario,
} from "./scenarios";
import { assetPath } from "./paths";

type LessonTab = "dialogue" | "language" | "vocabulary";
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
type PlaybackStep =
  | { kind: "audio"; src: string; turn?: number; label?: string }
  | { kind: "silence"; duration: number; turn?: number; label?: string };

const roleName: Record<Role, { en: string; zh: string }> = {
  reader: { en: "Reader", zh: "讀者" },
  librarian: { en: "Librarian", zh: "館員" },
};

const wordCount = (text: string) =>
  text.replace(/\[[^\]]*]/g, "").trim().split(/\s+/).filter(Boolean).length;

export default function Home() {
  const [scenarioId, setScenarioId] = useState(1);
  const [tab, setTab] = useState<LessonTab>("dialogue");
  const [hiddenRole, setHiddenRole] = useState<Role | null>(null);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeTurn, setActiveTurn] = useState<number | null>(null);
  const [playbackLabel, setPlaybackLabel] = useState("尚未播放");
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [offlineProgress, setOfflineProgress] = useState<number | null>(null);
  const [offlineReady, setOfflineReady] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const runRef = useRef(0);
  const pausedRef = useRef(false);
  const scenario = useMemo(
    () => scenarios.find((item) => item.id === scenarioId) ?? scenarios[0],
    [scenarioId],
  );

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register(assetPath("/sw.js"), {
        scope: assetPath("/"),
      }).catch(() => undefined);
    }
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", beforeInstall);
    if ("caches" in window) {
      caches.delete("nthu-library-audio-v1").catch(() => undefined);
      caches.delete("nthu-library-audio-v2").catch(() => undefined);
      caches.has("nthu-library-audio-v3").then(setOfflineReady).catch(() => undefined);
    }
    return () => window.removeEventListener("beforeinstallprompt", beforeInstall);
  }, []);

  const stop = useCallback((label = "已停止") => {
    runRef.current += 1;
    pausedRef.current = false;
    audioRef.current?.pause();
    audioRef.current = null;
    setIsPlaying(false);
    setIsPaused(false);
    setActiveTurn(null);
    setPlaybackLabel(label);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const wait = useCallback(async (duration: number, run: number) => {
    let remaining = duration;
    let previous = performance.now();
    while (remaining > 0 && run === runRef.current) {
      await new Promise((resolve) => setTimeout(resolve, 80));
      const now = performance.now();
      if (!pausedRef.current) remaining -= now - previous;
      previous = now;
    }
  }, []);

  const playAudio = useCallback(async (src: string, run: number) => {
    if (run !== runRef.current) return;
    await new Promise<void>((resolve) => {
      const audio = new Audio(src);
      audio.preload = "auto";
      audioRef.current = audio;
      const finish = () => {
        audio.removeEventListener("ended", finish);
        audio.removeEventListener("error", finish);
        resolve();
      };
      audio.addEventListener("ended", finish);
      audio.addEventListener("error", finish);
      audio.play().catch(finish);
    });
  }, []);

  const playSteps = useCallback(
    async (steps: PlaybackStep[]) => {
      stop("準備播放");
      const run = runRef.current;
      setIsPlaying(true);
      for (const step of steps) {
        if (run !== runRef.current) return;
        setActiveTurn(step.turn ?? null);
        if (step.label) setPlaybackLabel(step.label);
        if (step.kind === "audio") await playAudio(step.src, run);
        else await wait(step.duration, run);
      }
      if (run === runRef.current) {
        setIsPlaying(false);
        setIsPaused(false);
        setActiveTurn(null);
        setPlaybackLabel("播放完畢");
      }
    },
    [playAudio, stop, wait],
  );

  const dialogueSteps = useCallback(
    (item: Scenario, forceAll = false): PlaybackStep[] =>
      item.dialogue.flatMap<PlaybackStep>((turn, index) => {
        if (!forceAll && hiddenRole === turn.role) {
          return [{
            kind: "silence",
            duration: Math.max(4500, wordCount(turn.en) * 500 + 2500),
            turn: index,
            label: `輪到你說：${roleName[turn.role].zh}`,
          }];
        }
        return [
          {
            kind: "audio",
            src: audioPaths.dialogue(item.id, index, "en"),
            turn: index,
            label: `${roleName[turn.role].zh}英文`,
          },
          { kind: "silence", duration: 1000, turn: index },
          {
            kind: "audio",
            src: audioPaths.dialogue(item.id, index, "zh"),
            turn: index,
            label: `${roleName[turn.role].zh}中文`,
          },
          { kind: "silence", duration: 1000, turn: index },
        ];
      }),
    [hiddenRole],
  );

  const playDialogue = useCallback(
    () => void playSteps(dialogueSteps(scenario)),
    [dialogueSteps, playSteps, scenario],
  );

  const playTurn = (index: number) => {
    const turn = scenario.dialogue[index];
    void playSteps([
      {
        kind: "audio",
        src: audioPaths.dialogue(scenario.id, index, "en"),
        turn: index,
        label: `${roleName[turn.role].zh}英文示範`,
      },
      { kind: "silence", duration: 1000, turn: index },
      {
        kind: "audio",
        src: audioPaths.dialogue(scenario.id, index, "zh"),
        turn: index,
        label: `${roleName[turn.role].zh}中文翻譯`,
      },
    ]);
  };

  const noteSteps = (item: Scenario): PlaybackStep[] => [
    ...item.patterns.flatMap((_, index) => [
      { kind: "audio" as const, src: audioPaths.pattern(item.id, index, "en"), label: `句型 ${index + 1} 英文` },
      { kind: "silence" as const, duration: 1000 },
      { kind: "audio" as const, src: audioPaths.pattern(item.id, index, "zh"), label: `句型 ${index + 1} 中文解說` },
      { kind: "silence" as const, duration: 1000 },
    ]),
    ...item.grammar.flatMap((_, index) => [
      { kind: "audio" as const, src: audioPaths.grammar(item.id, index), label: `文法重點 ${index + 1}` },
      { kind: "silence" as const, duration: 1000 },
    ]),
  ];

  const vocabSteps = (item: Scenario, onlyIndex?: number): PlaybackStep[] => {
    const entries =
      typeof onlyIndex === "number"
        ? [[item.vocabulary[onlyIndex], onlyIndex] as const]
        : item.vocabulary.map((entry, index) => [entry, index] as const);
    return entries.flatMap(([entry, index]) => [
      { kind: "audio", src: audioPaths.vocabWord(item.id, index), label: `單字 ${entry.word}` },
      { kind: "silence", duration: 2000 },
      ...entry.word.toLowerCase().split("").filter((letter) => /[a-z]/.test(letter)).flatMap((letter) => [
        { kind: "audio" as const, src: audioPaths.alphabet(letter), label: `拼寫 ${entry.word}` },
        { kind: "silence" as const, duration: 280 },
      ]),
      { kind: "audio", src: audioPaths.vocabMeaning(item.id, index), label: `${entry.word} 中文解說` },
      { kind: "silence", duration: 2000 },
    ]);
  };

  const togglePause = () => {
    if (!isPlaying) return;
    if (pausedRef.current) {
      pausedRef.current = false;
      setIsPaused(false);
      audioRef.current?.play().catch(() => undefined);
      setPlaybackLabel("繼續播放");
    } else {
      pausedRef.current = true;
      setIsPaused(true);
      audioRef.current?.pause();
      setPlaybackLabel("已暫停");
    }
  };

  const changeScenario = (id: number) => {
    stop("尚未播放");
    setScenarioId(id);
    setTab("dialogue");
    setRevealed(new Set());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleReveal = (index: number) => {
    setRevealed((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstallPrompt(null);
  };

  const downloadOffline = async () => {
    if (!("caches" in window)) return;
    setOfflineProgress(0);
    const cache = await caches.open("nthu-library-audio-v3");
    for (let index = 0; index < allAudioPaths.length; index += 1) {
      const path = allAudioPaths[index];
      try {
        const response = await fetch(path);
        if (response.ok) await cache.put(path, response);
      } catch {
        // Keep successful files and allow a later retry.
      }
      setOfflineProgress(Math.round(((index + 1) / allAudioPaths.length) * 100));
    }
    setOfflineReady(true);
    setOfflineProgress(null);
  };

  return (
    <main className="app-shell">
      <header className="hero">
        <div className="hero__eyebrow">
          <span className="brand-mark" aria-hidden="true">清</span>
          NTHU LIBRARY · COUNTER ENGLISH LAB
        </div>
        <div className="hero__grid">
          <div>
            <p className="kicker">櫃台英語，一句一句練到能用</p>
            <h1>清大圖書館<br />英語情境練習室</h1>
            <p className="hero__copy">
              十個真實服務情境，從權益聲明、館際合作到論文繳交。
              跟著三位角色慢速聽、逐句看，再關掉提示親自說一次。
            </p>
            <div className="hero__actions">
              <button className="button button--primary" onClick={playDialogue}>▶ 開始本課示範</button>
              <button className="button button--quiet" onClick={install} disabled={!installPrompt}>↓ 安裝 APP</button>
            </div>
          </div>
          <div className="hero-card" aria-label="課程資訊">
            <div className="hero-card__number">{String(scenario.id).padStart(2, "0")}</div>
            <p>目前情境</p>
            <h2>{scenario.shortTitle}</h2>
            <div className="hero-card__meta"><span>6 句對話</span><span>120 WPM</span><span>台灣華語</span></div>
          </div>
        </div>
      </header>

      <section className="scenario-strip" aria-labelledby="scenario-heading">
        <div className="section-heading">
          <div><p className="section-label">SCENARIO MAP</p><h2 id="scenario-heading">十個櫃台任務</h2></div>
          <span className="section-count">已選 {scenario.id} / 10</span>
        </div>
        <div className="scenario-list">
          {scenarios.map((item) => (
            <button
              key={item.id}
              className={`scenario-chip ${item.id === scenario.id ? "is-active" : ""}`}
              onClick={() => changeScenario(item.id)}
              aria-current={item.id === scenario.id ? "step" : undefined}
            >
              <span>{String(item.id).padStart(2, "0")}</span>{item.shortTitle}
            </button>
          ))}
        </div>
      </section>

      <section className="lesson-layout">
        <aside className="lesson-aside">
          <p className="section-label">CURRENT LESSON</p>
          <div className="lesson-number">{String(scenario.id).padStart(2, "0")}</div>
          <h2>{scenario.title}</h2>
          <p>{scenario.summary}</p>
          <div className="mode-card">
            <div className="mode-card__title"><span aria-hidden="true">◎</span>角色扮演</div>
            <p>隱藏一方台詞，播放時會留出相同長度讓你開口。</p>
            <div className="segmented" role="group" aria-label="選擇角色扮演模式">
              <button className={hiddenRole === null ? "is-active" : ""} onClick={() => setHiddenRole(null)}>完整</button>
              <button className={hiddenRole === "reader" ? "is-active" : ""} onClick={() => setHiddenRole("reader")}>我當讀者</button>
              <button className={hiddenRole === "librarian" ? "is-active" : ""} onClick={() => setHiddenRole("librarian")}>我當館員</button>
            </div>
          </div>
          <div className="offline-card">
            <div>
              <strong>{offlineReady ? "離線語音已備妥" : "下載離線語音"}</strong>
              <p>{offlineProgress !== null ? `下載進度 ${offlineProgress}%` : "第一次下載需要網路，之後可離線練習。"}</p>
            </div>
            <button onClick={downloadOffline} disabled={offlineProgress !== null} aria-label="下載全部離線語音">
              {offlineProgress !== null ? `${offlineProgress}%` : "↓"}
            </button>
          </div>
        </aside>

        <article className="lesson-main">
          <div className="lesson-tabs" role="tablist" aria-label="課程內容">
            {[
              ["dialogue", "模擬對話"],
              ["language", "句型與文法"],
              ["vocabulary", "單字解說"],
            ].map(([id, label]) => (
              <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "is-active" : ""} onClick={() => setTab(id as LessonTab)}>
                {label}
              </button>
            ))}
          </div>

          {tab === "dialogue" && (
            <div className="tab-panel">
              <div className="panel-toolbar">
                <div><span className={`live-dot ${isPlaying ? "is-live" : ""}`} /><strong>{playbackLabel}</strong></div>
                <div className="toolbar-actions">
                  <button onClick={playDialogue}>▶ <span>全文</span></button>
                  <button onClick={togglePause} disabled={!isPlaying}>{isPaused ? "▶" : "Ⅱ"} <span>{isPaused ? "繼續" : "暫停"}</span></button>
                  <button onClick={playDialogue}>↻ <span>重播</span></button>
                  <button onClick={() => stop()}>■ <span>停止</span></button>
                </div>
              </div>
              <div className="dialogue-list">
                {scenario.dialogue.map((turn, index) => {
                  const hidden = hiddenRole === turn.role && !revealed.has(index);
                  return (
                    <section key={`${scenario.id}-${index}`} className={`dialogue-card dialogue-card--${turn.role} ${activeTurn === index ? "is-speaking" : ""}`}>
                      <div className="speaker-row">
                        <span className={`speaker-avatar speaker-avatar--${turn.role}`}>{turn.role === "reader" ? "讀" : "館"}</span>
                        <div><strong>{roleName[turn.role].en}</strong><small>{roleName[turn.role].zh}</small></div>
                        <span className="turn-number">0{index + 1}</span>
                      </div>
                      {hidden ? (
                        <div className="hidden-line"><p>輪到你說這一句</p><span>先試著說，再顯示答案或聽示範。</span></div>
                      ) : (
                        <div className="line-copy">
                          <p className="english">{turn.en}</p>
                          <p className="chinese">（{roleName[turn.role].zh}：{turn.zh}）</p>
                        </div>
                      )}
                      <div className="line-actions">
                        {hiddenRole === turn.role && <button onClick={() => toggleReveal(index)}>{hidden ? "顯示答案" : "再次隱藏"}</button>}
                        <button onClick={() => playTurn(index)}>◉ 聽本句示範</button>
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "language" && (
            <div className="tab-panel">
              <div className="content-title">
                <div><p className="section-label">USEFUL LANGUAGE</p><h3>實用句型</h3></div>
                <button className="button button--small" onClick={() => void playSteps(noteSteps(scenario))}>▶ 播放本區解說</button>
              </div>
              <div className="pattern-grid">
                {scenario.patterns.map((pattern, index) => (
                  <section className="pattern-card" key={pattern.form}>
                    <span className="index-pill">句型 {index + 1}</span>
                    <h4>{pattern.form}</h4>
                    <p className="example">{pattern.example}</p>
                    <p>{pattern.explanation}</p>
                    <button onClick={() => void playSteps([
                      { kind: "audio", src: audioPaths.pattern(scenario.id, index, "en"), label: `句型 ${index + 1} 英文` },
                      { kind: "silence", duration: 1000 },
                      { kind: "audio", src: audioPaths.pattern(scenario.id, index, "zh"), label: `句型 ${index + 1} 中文解說` },
                    ])}>◉ 聽句型</button>
                  </section>
                ))}
              </div>
              <div className="content-title grammar-title"><div><p className="section-label">GRAMMAR FOCUS</p><h3>文法重點</h3></div></div>
              <div className="grammar-list">
                {scenario.grammar.map((point, index) => (
                  <section key={point.title}>
                    <span>{index + 1}</span>
                    <div><h4>{point.title}</h4><p>{point.explanation}</p></div>
                    <button aria-label={`播放${point.title}`} onClick={() => void playSteps([
                      { kind: "audio", src: audioPaths.grammar(scenario.id, index), label: `文法重點 ${index + 1}` },
                    ])}>◉</button>
                  </section>
                ))}
              </div>
            </div>
          )}

          {tab === "vocabulary" && (
            <div className="tab-panel">
              <div className="content-title">
                <div>
                  <p className="section-label">VOCABULARY</p>
                  <h3>本課單字</h3>
                  <p className="content-subtitle">先聽單字，停兩秒，再聽逐字母拼寫與中文解說。</p>
                </div>
                <button className="button button--small" onClick={() => void playSteps(vocabSteps(scenario))}>▶ 依序播放</button>
              </div>
              <div className="vocabulary-list">
                {scenario.vocabulary.map((entry, index) => (
                  <section className="vocab-row" key={`${entry.word}-${index}`}>
                    <span className="vocab-index">{String(index + 1).padStart(2, "0")}</span>
                    <div className="vocab-word"><strong>{entry.word}</strong><span>[{entry.kk}]</span></div>
                    <div className="vocab-meaning"><span>{entry.meaning}</span><small>{entry.pos}</small></div>
                    <button onClick={() => void playSteps(vocabSteps(scenario, index))} aria-label={`播放單字 ${entry.word}`}>◉</button>
                  </section>
                ))}
              </div>
              <div className="speech-rule">
                <span aria-hidden="true">i</span>
                <p>朗讀時不念 KK 音標；詞性會完整念成{Object.values(posSpeech).join("、")}。每個單字與下一個單字之間保留兩秒。</p>
              </div>
            </div>
          )}

          <footer className="lesson-source">
            <div><span>官方資料來源</span><a href={scenario.sourceUrl} target="_blank" rel="noreferrer">{scenario.sourceLabel} ↗</a></div>
            <p>資料查核日期：{CHECKED_AT}。實際資格、費用與作業方式請以清大圖書館最新公告為準。</p>
          </footer>
        </article>
      </section>

      <footer className="site-footer">
        <div><strong>NTHU Library Counter English Lab</strong><p>國立清華大學圖書館櫃台英語教學練習</p></div>
        <span>教學練習用 · 政策資訊請以官方網站為準</span>
      </footer>
    </main>
  );
}
