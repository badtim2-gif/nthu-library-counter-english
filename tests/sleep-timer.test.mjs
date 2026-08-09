import assert from "node:assert/strict";
import test from "node:test";
import {
  cancelSleepTimer,
  createDefaultSleepTimerStore,
  DEFAULT_SLEEP_TIMER_MINUTES,
  formatSleepTimerRemaining,
  getSleepTimerRemainingSeconds,
  loadSleepTimer,
  parseSleepTimerMinutes,
  startSleepTimer,
} from "../app/sleep-timer.ts";

const now = Date.UTC(2026, 7, 9, 12, 0, 0);

test("uses a 30-minute default and validates 1-720 minute input", () => {
  assert.equal(createDefaultSleepTimerStore().preferredMinutes, DEFAULT_SLEEP_TIMER_MINUTES);
  assert.equal(parseSleepTimerMinutes("1"), 1);
  assert.equal(parseSleepTimerMinutes("720"), 720);
  assert.equal(parseSleepTimerMinutes("0"), null);
  assert.equal(parseSleepTimerMinutes("721"), null);
  assert.equal(parseSleepTimerMinutes("30.5"), null);
  assert.equal(parseSleepTimerMinutes("abc"), null);
});

test("starts from an absolute deadline and formats the remaining countdown", () => {
  const store = startSleepTimer(30, now);
  assert.equal(store.expiresAt, new Date(now + 30 * 60_000).toISOString());
  assert.equal(getSleepTimerRemainingSeconds(store, now + 1), 1800);
  assert.equal(getSleepTimerRemainingSeconds(store, now + 30 * 60_000 - 1), 1);
  assert.equal(formatSleepTimerRemaining(1799), "29:59");
  assert.equal(formatSleepTimerRemaining(720 * 60), "720:00");
});

test("restores a future timer, clears expired data, and keeps the preference", () => {
  const active = startSleepTimer(45, now);
  const restored = loadSleepTimer(JSON.stringify(active), now + 1_000);
  assert.equal(restored.preferredMinutes, 45);
  assert.equal(restored.expiresAt, active.expiresAt);
  const expired = loadSleepTimer(JSON.stringify(active), now + 46 * 60_000);
  assert.equal(expired.preferredMinutes, 45);
  assert.equal(expired.expiresAt, null);
  assert.deepEqual(loadSleepTimer("{bad json}", now), createDefaultSleepTimerStore());
});

test("cancels without discarding the preferred duration", () => {
  const active = startSleepTimer(90, now);
  const cancelled = cancelSleepTimer(active);
  assert.equal(cancelled.preferredMinutes, 90);
  assert.equal(cancelled.expiresAt, null);
});

