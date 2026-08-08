import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_REVIEW_INTERVALS,
  clearScenarioProgress,
  completeScenarioReview,
  createDefaultLearningProgress,
  getMostOverdueScenarios,
  getReviewStatus,
  loadLearningProgress,
  markScenarioLearned,
  updateReviewSettings,
} from "../app/review-progress.ts";

const at = (year, month, day, hour = 12) => new Date(year, month - 1, day, hour);

test("generates the ten default review intervals", () => {
  assert.deepEqual([...DEFAULT_REVIEW_INTERVALS], [1, 3, 7, 15, 31, 63, 127, 255, 511, 1023]);
});

test("makes the first review due on the next calendar day", () => {
  const store = markScenarioLearned(createDefaultLearningProgress(), 1, at(2026, 8, 1, 23));
  const status = getReviewStatus(store, 1, at(2026, 8, 2, 0));
  assert.equal(status.state, "due");
  assert.equal(status.dueDate, "2026-08-02");
  assert.equal(status.nextReviewNumber, 1);
});

test("schedules an early review from the actual completion date", () => {
  let store = markScenarioLearned(createDefaultLearningProgress(), 1, at(2026, 8, 1));
  store = completeScenarioReview(store, 1, at(2026, 8, 1, 15));
  const status = getReviewStatus(store, 1, at(2026, 8, 1, 16));
  assert.equal(status.completedReviews, 1);
  assert.equal(status.state, "upcoming");
  assert.equal(status.dueDate, "2026-08-04");
});

test("advances only one stage after an overdue review", () => {
  let store = markScenarioLearned(createDefaultLearningProgress(), 1, at(2026, 8, 1));
  assert.equal(getReviewStatus(store, 1, at(2026, 8, 10)).overdueDays, 8);
  store = completeScenarioReview(store, 1, at(2026, 8, 10));
  const status = getReviewStatus(store, 1, at(2026, 8, 10));
  assert.equal(status.completedReviews, 1);
  assert.equal(status.nextReviewNumber, 2);
  assert.equal(status.dueDate, "2026-08-13");
});

test("ranks only the three most overdue unfinished scenarios", () => {
  let store = createDefaultLearningProgress();
  store = markScenarioLearned(store, 1, at(2026, 8, 1));
  store = markScenarioLearned(store, 2, at(2026, 8, 4));
  store = markScenarioLearned(store, 3, at(2026, 8, 6));
  store = markScenarioLearned(store, 4, at(2026, 8, 8));
  store = markScenarioLearned(store, 5, at(2026, 8, 9));
  const ranking = getMostOverdueScenarios(store, [1, 2, 3, 4, 5], at(2026, 8, 10), 3);
  assert.deepEqual(ranking.map((entry) => entry.scenarioId), [1, 2, 3]);
  assert.deepEqual(ranking.map((entry) => entry.status.overdueDays), [8, 5, 3]);
});

test("supports zero reviews and recalculates existing progress", () => {
  let store = markScenarioLearned(createDefaultLearningProgress(), 1, at(2026, 8, 1));
  store = updateReviewSettings(store, {
    maxReviews: 10,
    intervalsDays: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  });
  assert.equal(getReviewStatus(store, 1, at(2026, 8, 2)).dueDate, "2026-08-06");
  store = updateReviewSettings(store, { maxReviews: 0, intervalsDays: store.settings.intervalsDays });
  assert.equal(getReviewStatus(store, 1, at(2026, 8, 2)).state, "completed");
});

test("stops recording after the configured limit", () => {
  let store = markScenarioLearned(createDefaultLearningProgress(), 1, at(2026, 8, 1));
  store = updateReviewSettings(store, { maxReviews: 1, intervalsDays: store.settings.intervalsDays });
  store = completeScenarioReview(store, 1, at(2026, 8, 2));
  store = completeScenarioReview(store, 1, at(2026, 8, 3));
  assert.equal(store.scenarios["1"].reviews.length, 1);
  assert.equal(getReviewStatus(store, 1, at(2026, 8, 3)).state, "completed");
});

test("clears one scenario without changing settings", () => {
  let store = markScenarioLearned(createDefaultLearningProgress(), 1, at(2026, 8, 1));
  store = clearScenarioProgress(store, 1);
  assert.equal(getReviewStatus(store, 1, at(2026, 8, 2)).state, "unlearned");
  assert.equal(store.settings.maxReviews, 10);
});

test("falls back safely when stored data is malformed", () => {
  assert.deepEqual(loadLearningProgress("{broken"), createDefaultLearningProgress());
  const loaded = loadLearningProgress(JSON.stringify({
    version: 1,
    settings: { maxReviews: 4, intervalsDays: [2, -3, 6] },
    scenarios: {
      "1": { learnedAt: "not-a-date", reviews: [] },
      "2": { learnedAt: at(2026, 8, 1).toISOString(), reviews: [{ completedAt: "bad" }] },
    },
  }));
  assert.equal(loaded.settings.maxReviews, 4);
  assert.deepEqual(loaded.settings.intervalsDays.slice(0, 3), [2, 3, 6]);
  assert.equal(loaded.scenarios["1"], undefined);
  assert.equal(loaded.scenarios["2"].reviews.length, 0);
});
