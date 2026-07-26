const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const Module = require("node:module");

const project = path.resolve(__dirname, "..");
const sourcePath = path.join(project, "app", "scenarios.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const scenarioModule = new Module(sourcePath, module);
scenarioModule.filename = sourcePath;
scenarioModule.paths = Module._nodeModulePaths(path.dirname(sourcePath));
scenarioModule._compile(compiled, sourcePath);

const { allAudioPaths } = scenarioModule.exports;
const manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, "audio-manifest.json"), "utf8"),
);
const report = JSON.parse(
  fs.readFileSync(path.join(project, "public", "audio", "audio-report.json"), "utf8"),
);

assert.equal(allAudioPaths.length, 368);
assert.equal(new Set(allAudioPaths).size, 368);
for (const publicPath of allAudioPaths) {
  const file = path.join(project, "public", publicPath.replace(/^\//, ""));
  assert.ok(fs.existsSync(file), `Missing audio: ${publicPath}`);
  assert.ok(fs.statSync(file).size > 500, `Audio is unexpectedly small: ${publicPath}`);
}

assert.deepEqual(manifest.voices, {
  english: {
    reader: "en-US-BrianMultilingualNeural",
    librarian: "en-US-AvaMultilingualNeural",
    explainer: "en-US-AndrewMultilingualNeural",
  },
  chinese: {
    reader: "zh-TW-YunJheNeural",
    librarian: "zh-TW-HsiaoChenNeural",
    explainer: "zh-TW-YunJheNeural",
  },
});
assert.equal(manifest.entries.length, 368);
assert.equal(report.clip_count, 368);
assert.equal(report.english_long_count, 90);
assert.equal(report.english_wpm_target, 120);
assert.ok(report.english_wpm_min >= 115);
assert.ok(report.english_wpm_max <= 125);
assert.deepEqual(report.outside_115_125, []);

for (const entry of manifest.entries) {
  assert.doesNotMatch(entry.text, /\[[^\]]*]/, `KK entered speech: ${entry.file}`);
  assert.doesNotMatch(entry.text, /[*\/-]/, `Forbidden symbol entered speech: ${entry.file}`);
  assert.doesNotMatch(entry.text, /\bNTHU\b/, `NTHU was not expanded: ${entry.file}`);
  assert.doesNotMatch(
    entry.text,
    /\b(?:n|v|adj|adv|prep|conj|phr)\./i,
    `POS abbreviation entered speech: ${entry.file}`,
  );

  const language = entry.language === "zh" ? "chinese" : "english";
  assert.equal(
    entry.voice,
    manifest.voices[language][entry.role],
    `Wrong ${language} voice: ${entry.file}`,
  );
  if (entry.language === "zh") {
    assert.match(entry.voice, /^zh-TW-/, `Chinese voice is not Taiwan Mandarin: ${entry.file}`);
  }
}

console.log(
  `Audio validation passed: ${report.clip_count} clips, ` +
    `${report.english_long_count} English clips at ` +
    `${report.english_wpm_min}-${report.english_wpm_max} WPM; ` +
    `all Chinese clips use zh-TW voices.`,
);
