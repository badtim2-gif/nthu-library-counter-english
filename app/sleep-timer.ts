export const SLEEP_TIMER_STORAGE_KEY = "nthu-library-sleep-timer-v1";
export const SLEEP_TIMER_VERSION = 1 as const;
export const DEFAULT_SLEEP_TIMER_MINUTES = 30;
export const MIN_SLEEP_TIMER_MINUTES = 1;
export const MAX_SLEEP_TIMER_MINUTES = 720;
export const SLEEP_TIMER_PRESETS = Object.freeze([10, 20, 30, 45, 60, 90]);

export type SleepTimerStore = {
  version: typeof SLEEP_TIMER_VERSION;
  preferredMinutes: number;
  expiresAt: string | null;
};

export function isValidSleepTimerMinutes(value: unknown): value is number {
  return Number.isInteger(value) &&
    Number(value) >= MIN_SLEEP_TIMER_MINUTES &&
    Number(value) <= MAX_SLEEP_TIMER_MINUTES;
}

export function parseSleepTimerMinutes(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const minutes = Number(value);
  return isValidSleepTimerMinutes(minutes) ? minutes : null;
}

export function createDefaultSleepTimerStore(): SleepTimerStore {
  return {
    version: SLEEP_TIMER_VERSION,
    preferredMinutes: DEFAULT_SLEEP_TIMER_MINUTES,
    expiresAt: null,
  };
}

export function loadSleepTimer(raw: string | null, now = Date.now()): SleepTimerStore {
  if (!raw) return createDefaultSleepTimerStore();
  try {
    const parsed = JSON.parse(raw) as Partial<SleepTimerStore>;
    if (parsed.version !== SLEEP_TIMER_VERSION) return createDefaultSleepTimerStore();
    const preferredMinutes = isValidSleepTimerMinutes(parsed.preferredMinutes)
      ? parsed.preferredMinutes
      : DEFAULT_SLEEP_TIMER_MINUTES;
    const expiresAtMs = typeof parsed.expiresAt === "string"
      ? Date.parse(parsed.expiresAt)
      : Number.NaN;
    return {
      version: SLEEP_TIMER_VERSION,
      preferredMinutes,
      expiresAt: Number.isFinite(expiresAtMs) && expiresAtMs > now
        ? new Date(expiresAtMs).toISOString()
        : null,
    };
  } catch {
    return createDefaultSleepTimerStore();
  }
}

export function startSleepTimer(
  preferredMinutes: number,
  now = Date.now(),
): SleepTimerStore {
  if (!isValidSleepTimerMinutes(preferredMinutes)) {
    throw new RangeError(`Sleep timer must be between ${MIN_SLEEP_TIMER_MINUTES} and ${MAX_SLEEP_TIMER_MINUTES} minutes.`);
  }
  return {
    version: SLEEP_TIMER_VERSION,
    preferredMinutes,
    expiresAt: new Date(now + preferredMinutes * 60_000).toISOString(),
  };
}

export function cancelSleepTimer(store: SleepTimerStore): SleepTimerStore {
  return { ...store, expiresAt: null };
}

export function getSleepTimerRemainingSeconds(
  store: SleepTimerStore,
  now = Date.now(),
): number {
  if (!store.expiresAt) return 0;
  const expiresAtMs = Date.parse(store.expiresAt);
  if (!Number.isFinite(expiresAtMs)) return 0;
  return Math.max(0, Math.ceil((expiresAtMs - now) / 1000));
}

export function formatSleepTimerRemaining(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
