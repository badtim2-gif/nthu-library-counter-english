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

test("scrolls each new dialogue turn into view before its audio starts", () => {
  const queueStart = pageSource.indexOf("const playSteps = useCallback");
  const scrollStart = pageSource.indexOf("card.scrollIntoView", queueStart);
  const audioStart = pageSource.indexOf('if (step.kind === "audio") await playAudio', queueStart);
  assert.ok(queueStart >= 0);
  assert.ok(scrollStart > queueStart && scrollStart < audioStart);
  assert.match(pageSource, /nextTurn !== null && nextTurn !== lastScrolledTurnRef\.current/);
  assert.match(pageSource, /window\.matchMedia\?\.\("\(prefers-reduced-motion: reduce\)"\)/);
  assert.match(pageSource, /if \(!prefersReducedMotion\) await wait\(350, run\)/);
  assert.match(pageSource, /ref=\{\(element\) => \{ dialogueCardRefs\.current\[index\] = element; \}\}/);
});

test("opens the dialogue tab before hero playback and exposes a synced loop button", () => {
  const prepareStart = pageSource.indexOf("const prepareDialoguePlayback = useCallback");
  const unlockStart = pageSource.indexOf("const unlockPromise = unlockAudio()", prepareStart);
  const tabStart = pageSource.indexOf('setTab("dialogue")', prepareStart);
  const renderWaitStart = pageSource.indexOf("window.requestAnimationFrame", prepareStart);
  const playStart = pageSource.indexOf("await playSteps(dialogueSteps(scenario))", prepareStart);
  assert.ok(prepareStart >= 0);
  assert.ok(unlockStart > prepareStart && unlockStart < tabStart);
  assert.ok(tabStart > prepareStart && renderWaitStart > tabStart && playStart > renderWaitStart);
  assert.match(
    pageSource,
    /className=\{`button button--quiet \$\{loopTarget\?\.kind === "scenario" \? "is-looping" : ""\}`\}[\s\S]{0,400}onClick=\{toggleDialogueLoop\}/,
  );
  assert.match(pageSource, /\{loopTarget\?\.kind === "scenario" \? "■ 停止循環" : "↻ 循環播放"\}/);
});
test("stops queued playback when the sleep deadline expires", () => {
  assert.match(pageSource, /sleepDeadlineRef\.current/);
  assert.match(pageSource, /window\.setTimeout\(checkDeadline/);
  assert.match(pageSource, /Date\.now\(\) < sleepDeadlineRef\.current/);
});
test("waits one second after each vocabulary word before spelling", () => {
  assert.match(
    pageSource,
    /src: audioPaths\.vocabWord\(item\.id, index\)[\s\S]{0,160}kind: "silence", duration: 1000/,
  );
  assert.doesNotMatch(
    pageSource,
    /src: audioPaths\.vocabWord\(item\.id, index\)[\s\S]{0,160}kind: "silence", duration: 2000/,
  );
});

test("role play hides only English and keeps the Chinese translation visible", () => {
  assert.match(pageSource, /type RolePlayMode = Role \| "all" \| null/);
  assert.match(
    pageSource,
    /const roleIsHidden = \(mode: RolePlayMode, role: Role\) => mode === "all" \|\| mode === role/,
  );
  assert.match(pageSource, /\{hidden \? \(hiddenRole === "all" \? null : \(/);
  assert.match(pageSource, /<p className="english">\{turn\.en\}<\/p>/);
  assert.match(pageSource, /<p className="chinese">/);
  assert.match(pageSource, /const turnHiddenByMode = roleIsHidden\(hiddenRole, turn\.role\)/);
  assert.match(pageSource, /turnHiddenByMode && <button onClick=\{\(\) => toggleReveal\(index\)\}>/);
});

test("all-hidden role play pauses every turn while single-turn demos remain available", () => {
  assert.match(
    pageSource,
    /if \(!forceAll && roleIsHidden\(hiddenRole, turn\.role\)\) \{[\s\S]{0,300}kind: "silence"/,
  );
  assert.match(pageSource, /onClick=\{\(\) => changeRolePlayMode\("all"\)\}>都隱藏<\/button>/);
  assert.match(
    pageSource,
    /const turnSteps = useCallback[\s\S]{0,900}audioPaths\.dialogue\(scenario\.id, index, "en"\)[\s\S]{0,500}audioPaths\.dialogue\(scenario\.id, index, "zh"\)/,
  );
});

test("switching role-play mode stops playback and hides revealed answers again", () => {
  const modeStart = pageSource.indexOf("const changeRolePlayMode =");
  const stopStart = pageSource.indexOf('stop("尚未播放")', modeStart);
  const setModeStart = pageSource.indexOf("setHiddenRole(mode)", modeStart);
  const clearAnswersStart = pageSource.indexOf("setRevealed(new Set())", modeStart);
  assert.ok(modeStart >= 0);
  assert.ok(stopStart > modeStart && setModeStart > stopStart && clearAnswersStart > setModeStart);
});
