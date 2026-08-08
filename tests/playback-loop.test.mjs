import assert from "node:assert/strict";
import test from "node:test";
import { runPlaybackQueue } from "../app/playback-loop.ts";

test("plays a normal queue exactly once", async () => {
  const played = [];
  const cycles = await runPlaybackQueue(["en", "zh"], {
    repeat: false,
    shouldContinue: () => true,
    playStep: async (step) => { played.push(step); },
  });
  assert.equal(cycles, 1);
  assert.deepEqual(played, ["en", "zh"]);
});

test("continues into a second loop without recreating the queue", async () => {
  const played = [];
  const cycles = await runPlaybackQueue(["en", "pause", "zh", "gap"], {
    repeat: true,
    shouldContinue: () => played.length < 8,
    playStep: async (step) => { played.push(step); },
  });
  assert.equal(cycles, 2);
  assert.deepEqual(played, ["en", "pause", "zh", "gap", "en", "pause", "zh", "gap"]);
});

test("stops before the next queued step when cancellation changes", async () => {
  const played = [];
  let active = true;
  const cycles = await runPlaybackQueue([1, 2, 3], {
    repeat: true,
    shouldContinue: () => active,
    playStep: async (step) => {
      played.push(step);
      if (step === 2) active = false;
    },
  });
  assert.equal(cycles, 1);
  assert.deepEqual(played, [1, 2]);
});
