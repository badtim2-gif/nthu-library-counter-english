export const LEARNING_PROGRESS_STORAGE_KEY = "nthu-library-learning-progress-v1";
export const LEARNING_PROGRESS_VERSION = 1 as const;
export const REVIEW_STAGE_COUNT = 10;
export const DEFAULT_REVIEW_INTERVALS = Object.freeze(
  Array.from({ length: REVIEW_STAGE_COUNT }, (_, index) => 2 ** (index + 1) - 1),
);

export type ReviewSettings = { maxReviews: number; intervalsDays: number[] };
export type ReviewCompletion = { completedAt: string };
export type ScenarioProgress = { learnedAt: string; reviews: ReviewCompletion[] };
export type LearningProgressStore = {
  version: typeof LEARNING_PROGRESS_VERSION;
  settings: ReviewSettings;
  scenarios: Record<string, ScenarioProgress>;
};
export type ReviewState = "unlearned" | "upcoming" | "due" | "overdue" | "completed";
export type ReviewStatus = {
  state: ReviewState;
  learnedAt: string | null;
  lastReviewedAt: string | null;
  completedReviews: number;
  maxReviews: number;
  nextReviewNumber: number | null;
  dueDate: string | null;
  daysUntilDue: number | null;
  overdueDays: number;
};
export type OverdueScenario = { scenarioId: number; status: ReviewStatus };

export function createDefaultReviewSettings(): ReviewSettings {
  return { maxReviews: REVIEW_STAGE_COUNT, intervalsDays: [...DEFAULT_REVIEW_INTERVALS] };
}

export function createDefaultLearningProgress(): LearningProgressStore {
  return { version: LEARNING_PROGRESS_VERSION, settings: createDefaultReviewSettings(), scenarios: {} };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isValidIsoTimestamp = (value: unknown): value is string =>
  typeof value === "string" && Number.isFinite(Date.parse(value));

export function normalizeReviewSettings(value: unknown): ReviewSettings {
  const defaults = createDefaultReviewSettings();
  if (!isRecord(value)) return defaults;
  const candidateMax = Number(value.maxReviews);
  const maxReviews = Number.isInteger(candidateMax) && candidateMax >= 0 && candidateMax <= REVIEW_STAGE_COUNT
    ? candidateMax
    : defaults.maxReviews;
  const raw = Array.isArray(value.intervalsDays) ? value.intervalsDays : [];
  const intervalsDays = defaults.intervalsDays.map((fallback, index) => {
    const candidate = Number(raw[index]);
    return Number.isSafeInteger(candidate) && candidate > 0 ? candidate : fallback;
  });
  return { maxReviews, intervalsDays };
}

export function loadLearningProgress(raw: string | null): LearningProgressStore {
  if (!raw) return createDefaultLearningProgress();
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return createDefaultLearningProgress(); }
  if (!isRecord(parsed) || parsed.version !== LEARNING_PROGRESS_VERSION) return createDefaultLearningProgress();
  const scenarios: Record<string, ScenarioProgress> = {};
  if (isRecord(parsed.scenarios)) {
    for (const [id, candidate] of Object.entries(parsed.scenarios)) {
      if (!/^\d+$/.test(id) || !isRecord(candidate) || !isValidIsoTimestamp(candidate.learnedAt)) continue;
      const reviews = Array.isArray(candidate.reviews)
        ? candidate.reviews.filter(isRecord).map((item) => item.completedAt).filter(isValidIsoTimestamp)
            .sort((a, b) => Date.parse(a) - Date.parse(b)).slice(0, REVIEW_STAGE_COUNT)
            .map((completedAt) => ({ completedAt }))
        : [];
      scenarios[id] = { learnedAt: candidate.learnedAt, reviews };
    }
  }
  return { version: LEARNING_PROGRESS_VERSION, settings: normalizeReviewSettings(parsed.settings), scenarios };
}

export function markScenarioLearned(store: LearningProgressStore, id: number, now = new Date()): LearningProgressStore {
  if (store.scenarios[String(id)]) return store;
  return { ...store, scenarios: { ...store.scenarios, [String(id)]: { learnedAt: now.toISOString(), reviews: [] } } };
}

export function clearScenarioProgress(store: LearningProgressStore, id: number): LearningProgressStore {
  if (!store.scenarios[String(id)]) return store;
  const scenarios = { ...store.scenarios };
  delete scenarios[String(id)];
  return { ...store, scenarios };
}

export function completeScenarioReview(store: LearningProgressStore, id: number, now = new Date()): LearningProgressStore {
  const progress = store.scenarios[String(id)];
  if (!progress || progress.reviews.length >= store.settings.maxReviews) return store;
  return { ...store, scenarios: { ...store.scenarios, [String(id)]: {
    ...progress, reviews: [...progress.reviews, { completedAt: now.toISOString() }],
  } } };
}

export function updateReviewSettings(store: LearningProgressStore, settings: ReviewSettings): LearningProgressStore {
  return { ...store, settings: normalizeReviewSettings(settings) };
}

export function toLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function addLocalCalendarDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return toLocalDateKey(date);
}

const dateKeyOrdinal = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
};

export function calendarDayDifference(laterDateKey: string, earlierDateKey: string): number {
  return dateKeyOrdinal(laterDateKey) - dateKeyOrdinal(earlierDateKey);
}

export function getReviewStatus(store: LearningProgressStore, id: number, now = new Date()): ReviewStatus {
  const progress = store.scenarios[String(id)];
  const maxReviews = store.settings.maxReviews;
  if (!progress) return {
    state: "unlearned", learnedAt: null, lastReviewedAt: null, completedReviews: 0,
    maxReviews, nextReviewNumber: null, dueDate: null, daysUntilDue: null, overdueDays: 0,
  };
  const completedReviews = progress.reviews.length;
  const lastReviewedAt = completedReviews > 0 ? progress.reviews[completedReviews - 1].completedAt : null;
  if (completedReviews >= maxReviews) return {
    state: "completed", learnedAt: progress.learnedAt, lastReviewedAt, completedReviews,
    maxReviews, nextReviewNumber: null, dueDate: null, daysUntilDue: null, overdueDays: 0,
  };
  const anchor = new Date(lastReviewedAt ?? progress.learnedAt);
  const dueDate = addLocalCalendarDays(toLocalDateKey(anchor), store.settings.intervalsDays[completedReviews]);
  const daysUntilDue = calendarDayDifference(dueDate, toLocalDateKey(now));
  const state: ReviewState = daysUntilDue > 0 ? "upcoming" : daysUntilDue === 0 ? "due" : "overdue";
  return {
    state, learnedAt: progress.learnedAt, lastReviewedAt, completedReviews, maxReviews,
    nextReviewNumber: completedReviews + 1, dueDate, daysUntilDue, overdueDays: Math.max(0, -daysUntilDue),
  };
}

export function getMostOverdueScenarios(
  store: LearningProgressStore, scenarioIds: number[], now = new Date(), limit = 3,
): OverdueScenario[] {
  return scenarioIds.map((scenarioId) => ({ scenarioId, status: getReviewStatus(store, scenarioId, now) }))
    .filter((entry) => entry.status.state === "overdue")
    .sort((a, b) => b.status.overdueDays - a.status.overdueDays || a.scenarioId - b.scenarioId)
    .slice(0, Math.max(0, limit));
}
