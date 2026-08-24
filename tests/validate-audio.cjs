const assert = require("node:assert/strict");
const crypto = require("node:crypto");
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
const alphabetSources = JSON.parse(
  fs.readFileSync(
    path.join(project, "public", "audio", "alphabet-audio-sources.json"),
    "utf8",
  ),
);

assert.equal(allAudioPaths.length, 708);
assert.equal(new Set(allAudioPaths).size, 708);
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
assert.equal(manifest.entries.length, 708);
assert.equal(report.clip_count, 708);
assert.equal(report.english_long_count, 180);
assert.equal(report.english_wpm_target, 120);
assert.ok(report.english_wpm_min >= 115);
assert.ok(report.english_wpm_max <= 125);
assert.deepEqual(report.outside_115_125, []);

assert.equal(alphabetSources.status, "approved-production");
assert.equal(alphabetSources.speaker_policy, "single speaker only");
assert.equal(alphabetSources.author, "Brannon Wyndesor");
assert.equal(alphabetSources.license, "CC BY-SA 3.0");
assert.equal(alphabetSources.records.length, 26);
assert.equal(new Set(alphabetSources.records.map((record) => record.candidate_sha256)).size, 26);

const letterEntries = manifest.entries.filter((entry) => entry.kind === "letter");
assert.equal(letterEntries.length, 26);
for (let index = 0; index < 26; index += 1) {
  const letter = String.fromCharCode(65 + index);
  const entry = letterEntries[index];
  const sourceRecord = alphabetSources.records[index];
  assert.equal(entry.file, `alphabet-${letter.toLowerCase()}.mp3`);
  assert.equal(entry.text, letter);
  assert.equal(entry.voice, "human-Brannon-Wyndesor");
  assert.equal(entry.rate, 0);
  assert.equal(sourceRecord.letter, letter);
  assert.equal(sourceRecord.candidate_file, entry.file);
  const file = path.join(project, "public", "audio", entry.file);
  const digest = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  assert.equal(digest, sourceRecord.candidate_sha256, `Unapproved alphabet audio: ${entry.file}`);
}

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
  if (entry.kind !== "letter") {
    assert.equal(
      entry.voice,
      manifest.voices[language][entry.role],
      `Wrong ${language} voice: ${entry.file}`,
    );
  }
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
