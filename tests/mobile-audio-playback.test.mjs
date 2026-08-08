import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

test("unlocks one Web Audio context before the queued lesson starts", () => {
  const queueStart = pageSource.indexOf("const playSteps = useCallback");
  const runnerStart = pageSource.indexOf("await runPlaybackQueue", queueStart);
  const unlockStart = pageSource.indexOf("const unlockPromise = unlockAudio()", queueStart);
  assert.ok(queueStart >= 0);
  assert.ok(unlockStart > queueStart && unlockStart < runnerStart);
  assert.match(pageSource, /context\.createBufferSource\(\)/);
  assert.match(pageSource, /context\.decodeAudioData\(data\)/);
});

test("reuses a fallback media element instead of creating one per sentence", () => {
  assert.doesNotMatch(pageSource, /new Audio\(src\)/);
  assert.match(pageSource, /audioRef\.current \?\? new Audio\(\)/);
});

test("keeps pause, resume, and mobile memory limits in the player", () => {
  assert.match(pageSource, /context\.suspend\(\)/);
  assert.match(pageSource, /context\.resume\(\)/);
  assert.match(pageSource, /audioBufferCacheRef\.current\.size >= 24/);

});

test("tracks scenario and turn loops without relocking mobile audio", () => {
  assert.match(pageSource, /type LoopTarget = \{ kind: "scenario" \} \| \{ kind: "turn"; index: number \}/);
  assert.match(pageSource, /repeat: requestedLoop !== null/);
  assert.match(pageSource, /includeLoopGap \? \[\{ kind: "silence" as const, duration: 1000/);
  assert.match(pageSource, /aria-pressed=\{loopTarget\?\.kind === "scenario"\}/);
  assert.match(pageSource, /aria-pressed=\{turnLooping\}/);
  assert.match(pageSource, /if \(loopTarget && nextTab !== "dialogue"\) stop\("循環已停止"\)/);
});
