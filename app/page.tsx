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
import { runPlaybackQueue } from "./playback-loop";
import {
  clearScenarioProgress,
  completeScenarioReview,
  createDefaultLearningProgress,
  createDefaultReviewSettings,
  getMostOverdueScenarios,
  getReviewStatus,
  LEARNING_PROGRESS_STORAGE_KEY,
  loadLearningProgress,
  markScenarioLearned,
  updateReviewSettings,
  type LearningProgressStore,
  type ReviewSettings,
  type ReviewState,
  type ReviewStatus,
} from "./review-progress";
import {
  cancelSleepTimer,
  createDefaultSleepTimerStore,
  formatSleepTimerRemaining,
  getSleepTimerRemainingSeconds,
  loadSleepTimer,
  MAX_SLEEP_TIMER_MINUTES,
  MIN_SLEEP_TIMER_MINUTES,
  parseSleepTimerMinutes,
  SLEEP_TIMER_PRESETS,
  SLEEP_TIMER_STORAGE_KEY,
  startSleepTimer,
  type SleepTimerStore,
} from "./sleep-timer";


type LessonTab = "dialogue" | "language" | "vocabulary";
type ReviewSettingsDraft = { maxReviews: number; intervalsDays: string[] };
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
type PlaybackStep =
  | { kind: "audio"; src: string; turn?: number; label?: string }
  | { kind: "silence"; duration: number; turn?: number; label?: string };
type LoopTarget =
  | { kind: "scenario" }
  | { kind: "turn"; index: number }
  | { kind: "language" }
  | { kind: "pattern"; index: number }
  | { kind: "grammar"; index: number }
  | { kind: "vocabulary" }
  | { kind: "vocabulary-item"; index: number };
type PlaybackOptions = { loopTarget?: LoopTarget };
type RolePlayMode = Role | "all" | null;

const roleIsHidden = (mode: RolePlayMode, role: Role) => mode === "all" || mode === role;

const AUDIO_CACHE_NAME = "nthu-library-audio-v7";
const LEGACY_AUDIO_CACHE_NAMES = [
  "nthu-library-audio-v1",
  "nthu-library-audio-v2",
  "nthu-library-audio-v3",
  "nthu-library-audio-v4",
  "nthu-library-audio-v5",
  "nthu-library-audio-v6",
];


const roleName: Record<Role, { en: string; zh: string }> = {
  reader: { en: "Reader", zh: "讀者" },
  librarian: { en: "Librarian", zh: "館員" },
};

const wordCount = (text: string) =>
  text.replace(/\[[^\]]*]/g, "").trim().split(/\s+/).filter(Boolean).length;

const formatDateTime = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("zh-TW", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit",
      }).format(new Date(value))
    : "尚無紀錄";

const formatDateKey = (value: string | null) => {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${year}/${month}/${day}`;
};

const statusLabel = (status: ReviewStatus) => {
  if (status.state === "unlearned") return "未學習";
  if (status.state === "completed") return "已完成";
  if (status.state === "due") return "今日複習";
  if (status.state === "overdue") return `逾期 ${status.overdueDays} 日`;
  return `${status.daysUntilDue} 日後`;
};

const statusClass: Record<ReviewState, string> = {
  unlearned: "is-unlearned", upcoming: "is-upcoming", due: "is-due",
  overdue: "is-overdue", completed: "is-completed",
};

export default function Home() {
  const [scenarioId, setScenarioId] = useState(1);
  const [tab, setTab] = useState<LessonTab>("dialogue");
  const [hiddenRole, setHiddenRole] = useState<RolePlayMode>(null);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeTurn, setActiveTurn] = useState<number | null>(null);
  const [playbackLabel, setPlaybackLabel] = useState("尚未播放");
  const [loopTarget, setLoopTarget] = useState<LoopTarget | null>(null);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [offlineProgress, setOfflineProgress] = useState<number | null>(null);
  const [offlineReady, setOfflineReady] = useState(false);
  const [sleepTimer, setSleepTimer] = useState<SleepTimerStore>(createDefaultSleepTimerStore);
  const [sleepTimerReady, setSleepTimerReady] = useState(false);
  const [sleepTimerDraft, setSleepTimerDraft] = useState("30");
  const [sleepTimerError, setSleepTimerError] = useState("");
  const [sleepNow, setSleepNow] = useState(() => Date.now());
  const [sleepAnnouncement, setSleepAnnouncement] = useState("");

  const [learningStore, setLearningStore] = useState<LearningProgressStore>(
    createDefaultLearningProgress,
  );
  const [learningReady, setLearningReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState<ReviewSettingsDraft>(() => ({
    maxReviews: 10,
    intervalsDays: createDefaultReviewSettings().intervalsDays.map(String),
  }));
  const [settingsError, setSettingsError] = useState("");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioFinishRef = useRef<(() => void) | null>(null);
  const audioModeRef = useRef<"webaudio" | "html" | null>(null);
  const audioBufferCacheRef = useRef<Map<string, Promise<AudioBuffer>>>(new Map());
  const runRef = useRef(0);
  const pausedRef = useRef(false);
  const sleepDeadlineRef = useRef<number | null>(null);
  const dialogueCardRefs = useRef<Array<HTMLElement | null>>([]);
  const lastScrolledTurnRef = useRef<number | null>(null);
  const scenario = useMemo(
    () => scenarios.find((item) => item.id === scenarioId) ?? scenarios[0],
    [scenarioId],
  );

  const sleepRemainingSeconds = getSleepTimerRemainingSeconds(sleepTimer, sleepNow);
  const sleepTimerActive = sleepRemainingSeconds > 0;
  const sleepRemainingLabel = formatSleepTimerRemaining(sleepRemainingSeconds);
  const sleepStopTimeLabel = sleepTimer.expiresAt
    ? new Intl.DateTimeFormat("zh-TW", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(sleepTimer.expiresAt))
    : "";

  const reviewStatuses = useMemo(
    () => new Map(scenarios.map((item) => [item.id, getReviewStatus(learningStore, item.id, currentTime)])),
    [currentTime, learningStore],
  );
  const currentReviewStatus = reviewStatuses.get(scenario.id) ??
    getReviewStatus(learningStore, scenario.id, currentTime);
  const learnedCount = [...reviewStatuses.values()].filter((status) => status.state !== "unlearned").length;
  const dueCount = [...reviewStatuses.values()].filter((status) => status.state === "due").length;
  const overdueCount = [...reviewStatuses.values()].filter((status) => status.state === "overdue").length;
  const mostOverdue = useMemo(
    () => getMostOverdueScenarios(learningStore, scenarios.map((item) => item.id), currentTime, 3),
    [currentTime, learningStore],
  );

  useEffect(() => {
    try {
      setLearningStore(loadLearningProgress(window.localStorage.getItem(LEARNING_PROGRESS_STORAGE_KEY)));
    } catch {
      setLearningStore(createDefaultLearningProgress());
    } finally {
      setLearningReady(true);
    }
    const sync = (event: StorageEvent) => {
      if (event.key === LEARNING_PROGRESS_STORAGE_KEY) {
        setLearningStore(loadLearningProgress(event.newValue));
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    const applySleepTimer = (store: SleepTimerStore) => {
      setSleepTimer(store);
      setSleepTimerDraft(String(store.preferredMinutes));
      sleepDeadlineRef.current = store.expiresAt ? Date.parse(store.expiresAt) : null;
      setSleepNow(Date.now());
    };
    try {
      applySleepTimer(loadSleepTimer(window.localStorage.getItem(SLEEP_TIMER_STORAGE_KEY)));
    } finally {
      setSleepTimerReady(true);
    }
    const sync = (event: StorageEvent) => {
      if (event.key === SLEEP_TIMER_STORAGE_KEY) applySleepTimer(loadSleepTimer(event.newValue));
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

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
      for (const cacheName of LEGACY_AUDIO_CACHE_NAMES) {
        caches.delete(cacheName).catch(() => undefined);
      }
      caches.has(AUDIO_CACHE_NAME).then(setOfflineReady).catch(() => undefined);
    }
    return () => window.removeEventListener("beforeinstallprompt", beforeInstall);
  }, []);

  useEffect(() => {
    if (!learningReady) return;
    try {
      window.localStorage.setItem(LEARNING_PROGRESS_STORAGE_KEY, JSON.stringify(learningStore));
    } catch {
      // Storage limits or private mode must not block the course.
    }
  }, [learningReady, learningStore]);

  useEffect(() => {
    const refreshTime = () => setCurrentTime(new Date());
    const timer = window.setInterval(refreshTime, 60_000);
    document.addEventListener("visibilitychange", refreshTime);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshTime);
    };
  }, []);

  useEffect(() => {
    if (!settingsOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSettingsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [settingsOpen]);

  const ensureAudioContext = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      return audioContextRef.current;
    }
    const AudioContextClass = window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    try {
      const context = new AudioContextClass();
      audioContextRef.current = context;
      return context;
    } catch {
      return null;
    }
  }, []);

  const unlockAudio = useCallback(() => {
    const context = ensureAudioContext();
    if (!context || context.state === "closed") return Promise.resolve();
    try {
      const silentBuffer = context.createBuffer(1, 1, 22050);
      const silentSource = context.createBufferSource();
      silentSource.buffer = silentBuffer;
      silentSource.connect(context.destination);
      silentSource.start(0);
    } catch {
      // Resuming the context below is sufficient on browsers that reject a silent buffer.
    }
    return context.state === "running" ? Promise.resolve() : context.resume();
  }, [ensureAudioContext]);

  const stop = useCallback((label = "已停止") => {
    runRef.current += 1;
    pausedRef.current = false;
    lastScrolledTurnRef.current = null;
    const source = audioSourceRef.current;
    const finish = audioFinishRef.current;
    audioFinishRef.current = null;
    finish?.();
    try {
      source?.stop(0);
    } catch {
      // The source may already have ended.
    }
    try {
      source?.disconnect();
    } catch {
      // The source may already have been disconnected by its finish handler.
    }
    audioSourceRef.current = null;
    audioModeRef.current = null;
    const audio = audioRef.current;
    audio?.pause();
    if (audio) {
      try { audio.currentTime = 0; } catch { /* The element may not have loaded yet. */ }
    }
    setIsPlaying(false);
    setIsPaused(false);
    setActiveTurn(null);
    setPlaybackLabel(label);
    setLoopTarget(null);
  }, []);

  const expireSleepTimer = useCallback(() => {
    const deadline = sleepDeadlineRef.current;
    if (!deadline || Date.now() < deadline) return;
    sleepDeadlineRef.current = null;
    setSleepTimer((current) => current.expiresAt ? cancelSleepTimer(current) : current);
    setSleepNow(Date.now());
    setSleepAnnouncement("\u7761\u7720\u8a08\u6642\u7d50\u675f\uff0c\u5df2\u505c\u6b62\u6240\u6709\u64ad\u653e\u3002");
    stop("\u7761\u7720\u8a08\u6642\u7d50\u675f\uff0c\u5df2\u505c\u6b62\u64ad\u653e");
  }, [stop]);

  useEffect(() => {
    if (!sleepTimerReady) return;
    const deadline = sleepDeadlineRef.current;
    if (!deadline || !Number.isFinite(deadline)) return;
    const checkDeadline = () => {
      setSleepNow(Date.now());
      if (Date.now() >= deadline) expireSleepTimer();
    };
    checkDeadline();
    const countdown = window.setInterval(checkDeadline, 1000);
    const deadlineTimer = window.setTimeout(checkDeadline, Math.max(0, deadline - Date.now()));
    document.addEventListener("visibilitychange", checkDeadline);
    return () => {
      window.clearInterval(countdown);
      window.clearTimeout(deadlineTimer);
      document.removeEventListener("visibilitychange", checkDeadline);
    };
  }, [expireSleepTimer, sleepTimer.expiresAt, sleepTimerReady]);

  useEffect(() => () => {
    stop();
    const context = audioContextRef.current;
    audioContextRef.current = null;
    if (context && context.state !== "closed") void context.close();
  }, [stop]);

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

  const playHtmlAudio = useCallback(async (src: string, run: number) => {
    if (run !== runRef.current) return;
    await new Promise<void>((resolve) => {
      const audio = audioRef.current ?? new Audio();
      audio.preload = "auto";
      audioRef.current = audio;
      audioModeRef.current = "html";
      audio.src = src;
      audio.load();
      const finish = () => {
        audio.removeEventListener("ended", finish);
        audio.removeEventListener("error", finish);
        if (audioFinishRef.current === finish) audioFinishRef.current = null;
        if (audioModeRef.current === "html") audioModeRef.current = null;
        resolve();
      };
      audioFinishRef.current = finish;
      audio.addEventListener("ended", finish);
      audio.addEventListener("error", finish);
      audio.play().catch(finish);
    });
  }, []);

  const playAudio = useCallback(async (src: string, run: number) => {
    if (run !== runRef.current) return;
    const context = ensureAudioContext();
    if (!context || context.state === "closed") {
      await playHtmlAudio(src, run);
      return;
    }

    try {
      if (context.state !== "running" && !pausedRef.current) await context.resume();
      let bufferPromise = audioBufferCacheRef.current.get(src);
      if (!bufferPromise) {
        if (audioBufferCacheRef.current.size >= 24) {
          const oldest = audioBufferCacheRef.current.keys().next().value;
          if (oldest) audioBufferCacheRef.current.delete(oldest);
        }
        bufferPromise = fetch(src, { cache: "force-cache" })
          .then((response) => {
            if (!response.ok) throw new Error(`Audio request failed: ${response.status}`);
            return response.arrayBuffer();
          })
          .then((data) => context.decodeAudioData(data))
          .catch((error) => {
            audioBufferCacheRef.current.delete(src);
            throw error;
          });
        audioBufferCacheRef.current.set(src, bufferPromise);
      }

      const buffer = await bufferPromise;
      if (run !== runRef.current) return;
      await new Promise<void>((resolve) => {
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        audioSourceRef.current = source;
        audioModeRef.current = "webaudio";
        const finish = () => {
          source.onended = null;
          try {
            source.disconnect();
          } catch {
            // A simultaneous stop may already have disconnected this source.
          }
          if (audioSourceRef.current === source) audioSourceRef.current = null;
          if (audioFinishRef.current === finish) audioFinishRef.current = null;
          if (audioModeRef.current === "webaudio") audioModeRef.current = null;
          resolve();
        };
        audioFinishRef.current = finish;
        source.onended = finish;
        source.start(0);
      });
    } catch {
      if (run === runRef.current) await playHtmlAudio(src, run);
    }
  }, [ensureAudioContext, playHtmlAudio]);

  const playSteps = useCallback(
    async (steps: PlaybackStep[], options: PlaybackOptions = {}) => {
      if (sleepDeadlineRef.current && Date.now() >= sleepDeadlineRef.current) {
        expireSleepTimer();
        return;
      }
      stop("\u6e96\u5099\u64ad\u653e");
      if (steps.length === 0) return;
      const run = runRef.current;
      const requestedLoop = options.loopTarget ?? null;
      const unlockPromise = unlockAudio();
      setIsPlaying(true);
      setLoopTarget(requestedLoop);
      await unlockPromise.catch(() => undefined);
      await runPlaybackQueue(steps, {
        repeat: requestedLoop !== null,
        shouldContinue: () => run === runRef.current &&
          (!sleepDeadlineRef.current || Date.now() < sleepDeadlineRef.current),
        playStep: async (step) => {
          const nextTurn = step.turn ?? null;
          setActiveTurn(nextTurn);
          if (step.label) {
            setPlaybackLabel(requestedLoop ? `循環播放｜${step.label}` : step.label);
          }
          if (nextTurn !== null && nextTurn !== lastScrolledTurnRef.current) {
            lastScrolledTurnRef.current = nextTurn;
            const card = dialogueCardRefs.current[nextTurn];
            if (card) {
              const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
              card.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
              if (!prefersReducedMotion) await wait(350, run);
            }
          }
          if (step.kind === "audio") await playAudio(step.src, run);
          else await wait(step.duration, run);
        },
      });
      if (run === runRef.current && sleepDeadlineRef.current && Date.now() >= sleepDeadlineRef.current) {
        expireSleepTimer();
        return;
      }
      if (run === runRef.current) {
        setIsPlaying(false);
        setIsPaused(false);
        setActiveTurn(null);
        setLoopTarget(null);
        setPlaybackLabel("播放完畢");
      }
    },
    [expireSleepTimer, playAudio, stop, unlockAudio, wait],
  );

  const dialogueSteps = useCallback(
    (item: Scenario, forceAll = false): PlaybackStep[] =>
      item.dialogue.flatMap<PlaybackStep>((turn, index) => {
        if (!forceAll && roleIsHidden(hiddenRole, turn.role)) {
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

  const prepareDialoguePlayback = useCallback(async () => {
    const unlockPromise = unlockAudio();
    if (tab !== "dialogue") {
      setTab("dialogue");
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
      });
    }
    await unlockPromise.catch(() => undefined);
  }, [tab, unlockAudio]);

  const playDialogue = useCallback(() => {
    void (async () => {
      await prepareDialoguePlayback();
      await playSteps(dialogueSteps(scenario));
    })();
  }, [dialogueSteps, playSteps, prepareDialoguePlayback, scenario]);

  const toggleDialogueLoop = useCallback(() => {
    if (loopTarget?.kind === "scenario") {
      stop("循環已停止");
      return;
    }
    void (async () => {
      await prepareDialoguePlayback();
      await playSteps(dialogueSteps(scenario), { loopTarget: { kind: "scenario" } });
    })();
  }, [dialogueSteps, loopTarget, playSteps, prepareDialoguePlayback, scenario, stop]);

  const turnSteps = useCallback((index: number, includeLoopGap = false): PlaybackStep[] => {
    const turn = scenario.dialogue[index];
    return [
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
      ...(includeLoopGap ? [{ kind: "silence" as const, duration: 1000, turn: index }] : []),
    ];
  }, [scenario]);

  const playTurn = (index: number) => {
    void playSteps(turnSteps(index));
  };

  const toggleTurnLoop = (index: number) => {
    if (loopTarget?.kind === "turn" && loopTarget.index === index) {
      stop("循環已停止");
      return;
    }
    void playSteps(turnSteps(index, true), { loopTarget: { kind: "turn", index } });
  };

  const patternSteps = (
    item: Scenario,
    index: number,
    includeLoopGap = false,
  ): PlaybackStep[] => [
    { kind: "audio", src: audioPaths.pattern(item.id, index, "en"), label: `句型 ${index + 1} 英文` },
    { kind: "silence", duration: 1000 },
    { kind: "audio", src: audioPaths.pattern(item.id, index, "zh"), label: `句型 ${index + 1} 中文解說` },
    ...(includeLoopGap ? [{ kind: "silence" as const, duration: 1000 }] : []),
  ];

  const grammarSteps = (
    item: Scenario,
    index: number,
    includeLoopGap = false,
  ): PlaybackStep[] => [
    { kind: "audio", src: audioPaths.grammar(item.id, index), label: `文法重點 ${index + 1}` },
    ...(includeLoopGap ? [{ kind: "silence" as const, duration: 1000 }] : []),
  ];

  const noteSteps = (item: Scenario): PlaybackStep[] => [
    ...item.patterns.flatMap((_, index) => [
      ...patternSteps(item, index),
      { kind: "silence" as const, duration: 1000 },
    ]),
    ...item.grammar.flatMap((_, index) => [
      ...grammarSteps(item, index),
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
      { kind: "silence", duration: 1000 },
      ...entry.word.toLowerCase().split("").filter((letter) => /[a-z]/.test(letter)).flatMap((letter) => [
        { kind: "audio" as const, src: audioPaths.alphabet(letter), label: `拼寫 ${entry.word}` },
        { kind: "silence" as const, duration: 280 },
      ]),
      { kind: "audio", src: audioPaths.vocabMeaning(item.id, index), label: `${entry.word} 中文解說` },
      { kind: "silence", duration: 2000 },
    ]);
  };

  const toggleLanguageLoop = () => {
    if (loopTarget?.kind === "language") {
      stop("循環已停止");
      return;
    }
    void playSteps(noteSteps(scenario), { loopTarget: { kind: "language" } });
  };

  const togglePatternLoop = (index: number) => {
    if (loopTarget?.kind === "pattern" && loopTarget.index === index) {
      stop("循環已停止");
      return;
    }
    void playSteps(patternSteps(scenario, index, true), { loopTarget: { kind: "pattern", index } });
  };

  const toggleGrammarLoop = (index: number) => {
    if (loopTarget?.kind === "grammar" && loopTarget.index === index) {
      stop("循環已停止");
      return;
    }
    void playSteps(grammarSteps(scenario, index, true), { loopTarget: { kind: "grammar", index } });
  };

  const toggleVocabularyLoop = () => {
    if (loopTarget?.kind === "vocabulary") {
      stop("循環已停止");
      return;
    }
    void playSteps(vocabSteps(scenario), { loopTarget: { kind: "vocabulary" } });
  };

  const toggleVocabularyItemLoop = (index: number) => {
    if (loopTarget?.kind === "vocabulary-item" && loopTarget.index === index) {
      stop("循環已停止");
      return;
    }
    void playSteps(vocabSteps(scenario, index), { loopTarget: { kind: "vocabulary-item", index } });
  };

  const togglePause = () => {
    if (!isPlaying) return;
    if (pausedRef.current) {
      pausedRef.current = false;
      setIsPaused(false);
      if (audioModeRef.current === "webaudio") {
        const context = audioContextRef.current;
        if (context && context.state !== "running") void context.resume().catch(() => undefined);
      } else if (audioModeRef.current === "html") {
        audioRef.current?.play().catch(() => undefined);
      }
      setPlaybackLabel("繼續播放");
    } else {
      pausedRef.current = true;
      setIsPaused(true);
      if (audioModeRef.current === "webaudio") {
        const context = audioContextRef.current;
        if (context && context.state === "running") void context.suspend().catch(() => undefined);
      } else if (audioModeRef.current === "html") {
        audioRef.current?.pause();
      }
      setPlaybackLabel("已暫停");
    }
  };

  const changeTab = (nextTab: LessonTab) => {
    if (loopTarget && nextTab !== tab) stop("循環已停止");
    setTab(nextTab);
  };

  const changeScenario = (id: number) => {
    stop("尚未播放");
    setScenarioId(id);
    setTab("dialogue");
    setRevealed(new Set());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const changeRolePlayMode = (mode: RolePlayMode) => {
    stop("尚未播放");
    setHiddenRole(mode);
    setRevealed(new Set());
  };

  const activateSleepTimer = () => {
    const minutes = parseSleepTimerMinutes(sleepTimerDraft);
    if (minutes === null) {
      setSleepTimerError("\u8acb\u8f38\u5165 " + MIN_SLEEP_TIMER_MINUTES + "\u2013" + MAX_SLEEP_TIMER_MINUTES + " \u4e4b\u9593\u7684\u6b63\u6574\u6578\u5206\u9418\u3002");
      return;
    }
    const next = startSleepTimer(minutes);
    sleepDeadlineRef.current = Date.parse(next.expiresAt ?? "");
    setSleepTimer(next);
    setSleepTimerDraft(String(minutes));
    setSleepTimerError("");
    setSleepNow(Date.now());
    setSleepAnnouncement("\u7761\u7720\u8a08\u6642\u5df2\u555f\u52d5\uff0c" + minutes + " \u5206\u9418\u5f8c\u505c\u6b62\u6240\u6709\u64ad\u653e\u3002");
    try {
      window.localStorage.setItem(SLEEP_TIMER_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Private mode must not prevent the active timer in this page.
    }
  };

  const cancelActiveSleepTimer = () => {
    const next = cancelSleepTimer(sleepTimer);
    sleepDeadlineRef.current = null;
    setSleepTimer(next);
    setSleepNow(Date.now());
    setSleepAnnouncement("\u7761\u7720\u8a08\u6642\u5df2\u53d6\u6d88\uff0c\u76ee\u524d\u64ad\u653e\u4e0d\u6703\u4e2d\u65b7\u3002");
    try {
      window.localStorage.setItem(SLEEP_TIMER_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Private mode must not prevent cancelling the timer in this page.
    }
  };

  const toggleScenarioLearned = (id: number, checked: boolean) => {
    if (!checked && !window.confirm("取消後會清除此情境的首次學習與全部複習紀錄，確定要繼續嗎？")) {
      return;
    }
    const now = new Date();
    setLearningStore((current) =>
      checked ? markScenarioLearned(current, id, now) : clearScenarioProgress(current, id),
    );
    setCurrentTime(now);
  };

  const completeReview = (id: number) => {
    const now = new Date();
    const status = getReviewStatus(learningStore, id, now);
    if (status.state === "upcoming" && !window.confirm(
      `第 ${status.nextReviewNumber} 次複習尚未到期。若提前完成，下一次會從今天重新起算，確定要繼續嗎？`,
    )) {
      return;
    }
    setLearningStore((current) => completeScenarioReview(current, id, now));
    setCurrentTime(now);
  };

  const openReviewSettings = () => {
    setSettingsDraft({
      maxReviews: learningStore.settings.maxReviews,
      intervalsDays: learningStore.settings.intervalsDays.map(String),
    });
    setSettingsError("");
    setSettingsOpen(true);
  };

  const restoreDefaultSettings = () => {
    const defaults = createDefaultReviewSettings();
    setSettingsDraft({
      maxReviews: defaults.maxReviews,
      intervalsDays: defaults.intervalsDays.map(String),
    });
    setSettingsError("");
  };

  const saveReviewSettings = () => {
    const intervalsDays = settingsDraft.intervalsDays.map((value) => Number(value));
    const validIntervals =
      intervalsDays.length === 10 &&
      settingsDraft.intervalsDays.every((value) => /^\d+$/.test(value.trim())) &&
      intervalsDays.every((value) => Number.isSafeInteger(value) && value > 0);
    if (!validIntervals) {
      setSettingsError("10 次等待天數都必須是大於 0 的整數。");
      return;
    }
    const settings: ReviewSettings = {
      maxReviews: settingsDraft.maxReviews,
      intervalsDays,
    };
    setLearningStore((current) => updateReviewSettings(current, settings));
    setCurrentTime(new Date());
    setSettingsOpen(false);
    setSettingsError("");
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
    const cache = await caches.open(AUDIO_CACHE_NAME);
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
              二十個真實服務情境，從權益聲明、借還館藏到空間與網路服務。
              跟著三位角色慢速聽、逐句看，再關掉提示親自說一次。
            </p>
            <div className="hero__actions">
              <button className="button button--primary" onClick={playDialogue}>▶ 開始本課示範</button>
              <button
                className={`button button--quiet ${loopTarget?.kind === "scenario" ? "is-looping" : ""}`}
                aria-pressed={loopTarget?.kind === "scenario"}
                aria-label={loopTarget?.kind === "scenario" ? "停止整個情境循環播放" : "循環播放整個情境"}
                onClick={toggleDialogueLoop}
              >
                {loopTarget?.kind === "scenario" ? "■ 停止循環" : "↻ 循環播放"}
              </button>
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
          <div><p className="section-label">LEARNING MAP</p><h2 id="scenario-heading">二十個櫃台任務</h2></div>
          <button className="settings-trigger" onClick={openReviewSettings}>⚙ 複習設定</button>
        </div>

        <div className="progress-overview" aria-label="學習進度摘要">
          <div><strong>{learnedCount}</strong><span>已學習／{scenarios.length}</span></div>
          <div><strong>{dueCount}</strong><span>今日待複習</span></div>
          <div className={overdueCount > 0 ? "has-overdue" : ""}><strong>{overdueCount}</strong><span>逾期未複習</span></div>
        </div>

        <section className={`overdue-reminder ${mostOverdue.length > 0 ? "has-items" : ""}`} aria-labelledby="overdue-heading">
          <div>
            <p className="section-label">REVIEW PRIORITY</p>
            <h3 id="overdue-heading">逾期最久、應優先複習的情境</h3>
          </div>
          {mostOverdue.length > 0 ? (
            <ol>
              {mostOverdue.map(({ scenarioId: overdueId, status }, index) => {
                const item = scenarios.find((candidate) => candidate.id === overdueId);
                if (!item) return null;
                return (
                  <li key={overdueId}>
                    <button onClick={() => changeScenario(overdueId)}>
                      <span className="overdue-rank">{index + 1}</span>
                      <span><strong>{String(overdueId).padStart(2, "0")} {item.shortTitle}</strong><small>第 {status.nextReviewNumber} 次複習</small></span>
                      <em>逾期 {status.overdueDays} 日</em>
                    </button>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="overdue-empty">目前沒有逾期複習，請繼續保持。</p>
          )}
        </section>

        <div className="scenario-list">
          {scenarios.map((item) => {
            const status = reviewStatuses.get(item.id) ??
              getReviewStatus(learningStore, item.id, currentTime);
            const learned = status.state !== "unlearned";
            return (
              <div className="scenario-tile" key={item.id}>
                <button
                  className={`scenario-chip ${item.id === scenario.id ? "is-active" : ""}`}
                  onClick={() => changeScenario(item.id)}
                  aria-current={item.id === scenario.id ? "step" : undefined}
                >
                  <span className="scenario-number">{String(item.id).padStart(2, "0")}</span>
                  <span className="scenario-title">{item.shortTitle}</span>
                  <small className={`scenario-status ${statusClass[status.state]}`}>{statusLabel(status)}</small>
                </button>
                <label className="scenario-learned">
                  <input
                    type="checkbox"
                    checked={learned}
                    onChange={(event) => toggleScenarioLearned(item.id, event.target.checked)}
                    aria-label={`將情境 ${item.id} ${item.shortTitle}標記為已學過`}
                  />
                  <span>已學過</span>
                </label>
              </div>
            );
          })}
        </div>
      </section>

      <section className="lesson-layout">
        <aside className="lesson-aside">
          <p className="section-label">CURRENT LESSON</p>
          <div className="lesson-number">{String(scenario.id).padStart(2, "0")}</div>
          <h2>{scenario.title}</h2>
          <p>{scenario.summary}</p>
          <div className="progress-card">
            <div className="progress-card__heading">
              <strong>學習與複習紀錄</strong>
              <span className={`review-badge ${statusClass[currentReviewStatus.state]}`}>
                {statusLabel(currentReviewStatus)}
              </span>
            </div>
            <label className="learned-toggle">
              <input
                type="checkbox"
                checked={currentReviewStatus.state !== "unlearned"}
                onChange={(event) => toggleScenarioLearned(scenario.id, event.target.checked)}
              />
              <span>這個情境我已學過</span>
            </label>
            {currentReviewStatus.state === "unlearned" ? (
              <p>勾選後會記錄目前時間，並依設定安排第一次複習。</p>
            ) : (
              <>
                <dl>
                  <div><dt>首次學習</dt><dd>{formatDateTime(currentReviewStatus.learnedAt)}</dd></div>
                  <div><dt>已完成複習</dt><dd>{currentReviewStatus.completedReviews} 次</dd></div>
                  <div><dt>最近一次複習</dt><dd>{formatDateTime(currentReviewStatus.lastReviewedAt)}</dd></div>
                  <div><dt>下一次日期</dt><dd>{formatDateKey(currentReviewStatus.dueDate)}</dd></div>
                </dl>
                {currentReviewStatus.state === "completed" ? (
                  <p className="progress-complete">
                    {currentReviewStatus.maxReviews === 0
                      ? "目前設定為不安排複習。"
                      : `已達目前設定的 ${currentReviewStatus.maxReviews} 次複習上限。`}
                  </p>
                ) : (
                  <button className="review-complete-button" onClick={() => completeReview(scenario.id)}>
                    {currentReviewStatus.state === "upcoming" ? "提前完成" : "完成"}第 {currentReviewStatus.nextReviewNumber} 次複習
                  </button>
                )}
              </>
            )}
          </div>
          <div className="mode-card">
            <div className="mode-card__title"><span aria-hidden="true">◎</span>角色扮演</div>
            <p>可隱藏所選角色或全部英文，中文提示會保持顯示；播放時會留出相同長度讓你開口。</p>
            <div className="segmented" role="group" aria-label="選擇角色扮演模式">
              <button className={hiddenRole === null ? "is-active" : ""} aria-pressed={hiddenRole === null} onClick={() => changeRolePlayMode(null)}>完整</button>
              <button className={hiddenRole === "reader" ? "is-active" : ""} aria-pressed={hiddenRole === "reader"} onClick={() => changeRolePlayMode("reader")}>我當讀者</button>
              <button className={hiddenRole === "librarian" ? "is-active" : ""} aria-pressed={hiddenRole === "librarian"} onClick={() => changeRolePlayMode("librarian")}>我當館員</button>
              <button className={hiddenRole === "all" ? "is-active" : ""} aria-pressed={hiddenRole === "all"} onClick={() => changeRolePlayMode("all")}>都隱藏</button>
            </div>
          </div>
          <section className={sleepTimerActive ? "sleep-card is-active" : "sleep-card"} aria-labelledby="sleep-timer-heading">
            <div className="sleep-card__heading">
              <strong id="sleep-timer-heading"><span aria-hidden="true">{"\u263e"}</span> {"\u7761\u7720\u524d\u6536\u807d"}</strong>
              {sleepTimerActive && <span className="sleep-card__active">{"\u8a08\u6642\u4e2d"}</span>}
            </div>
            <p>{"\u555f\u52d5\u5f8c\uff0c\u4e0d\u8ad6\u66ab\u505c\u6216\u5207\u63db\u756b\u9762\uff0c\u5230\u671f\u90fd\u6703\u505c\u6b62\u6240\u6709\u64ad\u653e\u3002"}</p>
            <div className="sleep-presets" role="group" aria-label="\u9078\u64c7\u7761\u7720\u8a08\u6642\u6642\u9593">
              {SLEEP_TIMER_PRESETS.map((minutes) => (
                <button type="button" key={minutes}
                  className={Number(sleepTimerDraft) === minutes ? "is-selected" : undefined}
                  aria-pressed={Number(sleepTimerDraft) === minutes}
                  onClick={() => { setSleepTimerDraft(String(minutes)); setSleepTimerError(""); }}
                >{minutes} {"\u5206\u9418"}</button>
              ))}
            </div>
            <label className="sleep-custom-input">
              <span>{"\u81ea\u8a02\u5206\u9418"}</span>
              <input type="number" inputMode="numeric" min={MIN_SLEEP_TIMER_MINUTES} max={MAX_SLEEP_TIMER_MINUTES} step="1"
                value={sleepTimerDraft}
                onChange={(event) => { setSleepTimerDraft(event.target.value); setSleepTimerError(""); }}
                aria-describedby={sleepTimerError ? "sleep-timer-error" : undefined}
              />
            </label>
            {sleepTimerError && <p id="sleep-timer-error" className="sleep-timer-error" role="alert">{sleepTimerError}</p>}
            {sleepTimerActive && (
              <div className="sleep-countdown">
                <strong>{"\u5269\u9918 "}{sleepRemainingLabel}</strong>
                <small>{"\u9810\u8a08\u505c\u6b62 "}{sleepStopTimeLabel}</small>
              </div>
            )}
            <div className="sleep-actions">
              <button type="button" className="sleep-start" onClick={activateSleepTimer} disabled={!sleepTimerReady}>
                {sleepTimerActive ? "\u91cd\u65b0\u8a08\u6642" : "\u958b\u59cb\u8a08\u6642"}
              </button>
              {sleepTimerActive && <button type="button" className="sleep-cancel" onClick={cancelActiveSleepTimer}>{"\u53d6\u6d88\u8a08\u6642"}</button>}
            </div>
          </section>
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
              <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "is-active" : ""} onClick={() => changeTab(id as LessonTab)}>
                {label}
              </button>
            ))}
          </div>

          {tab === "dialogue" && (
            <div className="tab-panel">
              <div className="panel-toolbar">
                <div className="playback-status">
                  <span className={isPlaying ? "live-dot is-live" : "live-dot"} />
                  <strong>{playbackLabel}</strong>
                  {sleepTimerActive && <span className="sleep-toolbar-status" aria-label={"\u7761\u7720\u8a08\u6642\u5269\u9918 " + sleepRemainingLabel}>{"\u263e"} {sleepRemainingLabel}</span>}
                  <span className="sr-only" role="status" aria-live="polite">{sleepAnnouncement}</span>
                </div>
                <div className="toolbar-actions">
                  <button onClick={playDialogue}>▶ <span>全文</span></button>
                  <button onClick={togglePause} disabled={!isPlaying}>{isPaused ? "▶" : "Ⅱ"} <span>{isPaused ? "繼續" : "暫停"}</span></button>
                  <button
                    className={loopTarget?.kind === "scenario" ? "is-looping" : undefined}
                    aria-pressed={loopTarget?.kind === "scenario"}
                    aria-label={loopTarget?.kind === "scenario" ? "停止整個情境循環播放" : "循環播放整個情境"}
                    onClick={toggleDialogueLoop}
                  >
                    {loopTarget?.kind === "scenario" ? "■" : "↻"} <span>{loopTarget?.kind === "scenario" ? "停止循環" : "循環播放"}</span>
                  </button>
                  <button onClick={() => stop()}>■ <span>停止</span></button>
                </div>
              </div>
              <div className="dialogue-list">
                {scenario.dialogue.map((turn, index) => {
                  const turnHiddenByMode = roleIsHidden(hiddenRole, turn.role);
                  const hidden = turnHiddenByMode && !revealed.has(index);
                  const turnLooping = loopTarget?.kind === "turn" && loopTarget.index === index;
                  return (
                    <section
                      key={`${scenario.id}-${index}`}
                      ref={(element) => { dialogueCardRefs.current[index] = element; }}
                      className={`dialogue-card dialogue-card--${turn.role} ${activeTurn === index ? "is-speaking" : ""}`}
                    >
                      <div className="speaker-row">
                        <span className={`speaker-avatar speaker-avatar--${turn.role}`}>{turn.role === "reader" ? "讀" : "館"}</span>
                        <div><strong>{roleName[turn.role].en}</strong><small>{roleName[turn.role].zh}</small></div>
                        <span className="turn-number">0{index + 1}</span>
                      </div>
                      <div className="line-copy">
                        {hidden ? (hiddenRole === "all" ? null : (
                          <div className="hidden-line"><p>輪到你說這一句</p><span>先試著說，再顯示英文答案或聽示範。</span></div>
                        )) : (
                          <p className="english">{turn.en}</p>
                        )}
                        <p className="chinese">（{roleName[turn.role].zh}：{turn.zh}）</p>
                      </div>
                      <div className="line-actions">
                        {turnHiddenByMode && <button onClick={() => toggleReveal(index)}>{hidden ? "顯示答案" : "再次隱藏"}</button>}
                        <button onClick={() => playTurn(index)}>◉ 聽本句示範</button>
                        <button
                          className={turnLooping ? "is-looping" : undefined}
                          aria-pressed={turnLooping}
                          aria-label={turnLooping ? `停止循環第 ${index + 1} 句` : `循環播放第 ${index + 1} 句`}
                          onClick={() => toggleTurnLoop(index)}
                        >{turnLooping ? "■ 停止循環" : "↻ 循環播放"}</button>
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
                <div className="content-actions">
                  <button className="button button--small" onClick={() => void playSteps(noteSteps(scenario))}>▶ 播放本區解說</button>
                  <button
                    className={`button button--small ${loopTarget?.kind === "language" ? "is-looping" : ""}`}
                    aria-pressed={loopTarget?.kind === "language"}
                    aria-label={loopTarget?.kind === "language" ? "停止句型與文法循環播放" : "循環播放句型與文法"}
                    onClick={toggleLanguageLoop}
                  >{loopTarget?.kind === "language" ? "■ 停止循環" : "↻ 循環播放"}</button>
                </div>
              </div>
              <div className="pattern-grid">
                {scenario.patterns.map((pattern, index) => {
                  const patternLooping = loopTarget?.kind === "pattern" && loopTarget.index === index;
                  return (
                    <section className="pattern-card" key={pattern.form}>
                      <span className="index-pill">句型 {index + 1}</span>
                      <h4>{pattern.form}</h4>
                      <p className="example">{pattern.example}</p>
                      <p>{pattern.explanation}</p>
                      <div className="item-actions">
                        <button onClick={() => void playSteps(patternSteps(scenario, index))}>◉ 聽句型</button>
                        <button
                          className={patternLooping ? "is-looping" : undefined}
                          aria-pressed={patternLooping}
                          aria-label={patternLooping ? `停止循環句型 ${index + 1}` : `循環播放句型 ${index + 1}`}
                          onClick={() => togglePatternLoop(index)}
                        >{patternLooping ? "■ 停止循環" : "↻ 循環句型"}</button>
                      </div>
                    </section>
                  );
                })}
              </div>
              <div className="content-title grammar-title"><div><p className="section-label">GRAMMAR FOCUS</p><h3>文法重點</h3></div></div>
              <div className="grammar-list">
                {scenario.grammar.map((point, index) => {
                  const grammarLooping = loopTarget?.kind === "grammar" && loopTarget.index === index;
                  return (
                    <section key={point.title}>
                      <span>{index + 1}</span>
                      <div><h4>{point.title}</h4><p>{point.explanation}</p></div>
                      <div className="item-actions">
                        <button aria-label={`播放${point.title}`} onClick={() => void playSteps(grammarSteps(scenario, index))}>◉</button>
                        <button
                          className={grammarLooping ? "is-looping" : undefined}
                          aria-pressed={grammarLooping}
                          aria-label={grammarLooping ? `停止循環${point.title}` : `循環播放${point.title}`}
                          onClick={() => toggleGrammarLoop(index)}
                        >{grammarLooping ? "■" : "↻"}</button>
                      </div>
                    </section>
                  );
                })}
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
                <div className="content-actions">
                  <button className="button button--small" onClick={() => void playSteps(vocabSteps(scenario))}>▶ 依序播放</button>
                  <button
                    className={`button button--small ${loopTarget?.kind === "vocabulary" ? "is-looping" : ""}`}
                    aria-pressed={loopTarget?.kind === "vocabulary"}
                    aria-label={loopTarget?.kind === "vocabulary" ? "停止全部單字循環播放" : "循環播放全部單字"}
                    onClick={toggleVocabularyLoop}
                  >{loopTarget?.kind === "vocabulary" ? "■ 停止循環" : "↻ 循環播放"}</button>
                </div>
              </div>
              <div className="vocabulary-list">
                {scenario.vocabulary.map((entry, index) => {
                  const vocabularyItemLooping = loopTarget?.kind === "vocabulary-item" && loopTarget.index === index;
                  return (
                    <section className="vocab-row" key={`${entry.word}-${index}`}>
                      <span className="vocab-index">{String(index + 1).padStart(2, "0")}</span>
                      <div className="vocab-word"><strong>{entry.word}</strong><span>[{entry.kk}]</span></div>
                      <div className="vocab-meaning"><span>{entry.meaning}</span><small>{entry.pos}</small></div>
                      <div className="item-actions">
                        <button onClick={() => void playSteps(vocabSteps(scenario, index))} aria-label={`播放單字 ${entry.word}`}>◉</button>
                        <button
                          className={vocabularyItemLooping ? "is-looping" : undefined}
                          aria-pressed={vocabularyItemLooping}
                          aria-label={vocabularyItemLooping ? `停止循環單字 ${entry.word}` : `循環播放單字 ${entry.word}`}
                          onClick={() => toggleVocabularyItemLoop(index)}
                        >{vocabularyItemLooping ? "■" : "↻"}</button>
                      </div>
                    </section>
                  );
                })}
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

      {settingsOpen && (
        <div
          className="settings-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSettingsOpen(false);
          }}
        >
          <section
            className="settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-settings-title"
            aria-describedby="review-settings-note"
          >
            <div className="settings-modal__heading">
              <div>
                <p className="section-label">REVIEW SETTINGS</p>
                <h2 id="review-settings-title">複習排程設定</h2>
              </div>
              <button autoFocus onClick={() => setSettingsOpen(false)} aria-label="關閉複習設定">×</button>
            </div>
            <p id="review-settings-note" className="settings-note">
              此設定套用全部 {scenarios.length} 個情境。修改後會保留完成紀錄，並立即重新計算下一次日期。
            </p>
            <form onSubmit={(event) => { event.preventDefault(); saveReviewSettings(); }}>
              <label className="max-reviews-field">
                <span>完成幾次後不再複習</span>
                <select
                  value={settingsDraft.maxReviews}
                  onChange={(event) => setSettingsDraft((current) => ({
                    ...current, maxReviews: Number(event.target.value),
                  }))}
                >
                  {Array.from({ length: 11 }, (_, count) => (
                    <option key={count} value={count}>{count} 次{count === 0 ? "（不安排複習）" : ""}</option>
                  ))}
                </select>
              </label>
              <fieldset>
                <legend>每次複習前的等待天數</legend>
                <div className="interval-grid">
                  {settingsDraft.intervalsDays.map((value, index) => (
                    <label key={index}>
                      <span>第 {index + 1} 次</span>
                      <div><input
                        type="number"
                        min="1"
                        step="1"
                        inputMode="numeric"
                        value={value}
                        onChange={(event) => setSettingsDraft((current) => ({
                          ...current,
                          intervalsDays: current.intervalsDays.map((entry, entryIndex) =>
                            entryIndex === index ? event.target.value : entry
                          ),
                        }))}
                        aria-label={`第 ${index + 1} 次複習等待天數`}
                      /><span>日</span></div>
                    </label>
                  ))}
                </div>
              </fieldset>
              {settingsError && <p className="settings-error" role="alert">{settingsError}</p>}
              <div className="settings-actions">
                <button type="button" onClick={restoreDefaultSettings}>恢復預設值</button>
                <button type="submit" className="button button--primary">儲存並重新計算</button>
              </div>
            </form>
          </section>
        </div>
      )}

      <footer className="site-footer">
        <div><strong>NTHU Library Counter English Lab</strong><p>國立清華大學圖書館櫃台英語教學練習</p></div>
        <div className="site-footer__legal">
          <span>圖書館英語教學練習專案 · 非校方政策發布頁面 · 政策資訊請以官方網站為準</span>
          <a href={assetPath("/credits/")}>素材來源、第三方授權及著作權聲明</a>
        </div>
      </footer>
    </main>
  );
}
