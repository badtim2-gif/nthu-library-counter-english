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

const { allAudioPaths, audioPaths, scenarios, stripForSpeech, posSpeech } = scenarioModule.exports;
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
const kokoroSources = JSON.parse(
  fs.readFileSync(
    path.join(project, "public", "audio", "kokoro-audio-sources.json"),
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
    reader: "kokoro-v1.0/am_fenrir",
    librarian: "kokoro-v1.1-zh/af_maple",
    explainer: "kokoro-v1.0/am_puck",
  },
  chinese: {
    reader: "kokoro-v1.1-zh/zm_010",
    librarian: "kokoro-v1.1-zh/zm_010",
    explainer: "kokoro-v1.1-zh/zm_010",
  },
});
assert.equal(manifest.entries.length, 708);

const visitorLesson = scenarios.find((scenario) => scenario.id === 11);
assert.equal(visitorLesson.dialogue[5].en, "The card is for entry and reading only, and you must return it on the same day to avoid a late fee or a lost-card handling [ˋhændlɪŋ] charge.");
assert.equal(visitorLesson.dialogue[5].zh, "這張證只供入館閱覽，必須當天歸還，以免產生逾期費用或遺失處理費。");
assert.equal(visitorLesson.vocabulary[5].word, "eligible");
assert.equal(visitorLesson.vocabulary[5].meaning, "符合資格的");
assert.equal(visitorLesson.vocabulary.length, 7);

const recallLesson = scenarios.find((scenario) => scenario.id === 2);
assert.equal(recallLesson.dialogue[3].en, "If more than fourteen days remain [rɪˋmen], the new due date is fourteen days from the recall request.");
assert.equal(recallLesson.dialogue[3].zh, "如果原本剩餘超過十四天，新到期日就是從召回申請日起算十四天。");
assert.equal(recallLesson.dialogue[4].en, "What happens if fourteen days or fewer remain?");
assert.equal(recallLesson.dialogue[4].zh, "如果剩十四天或更少，會怎麼處理？");
assert.equal(recallLesson.dialogue[5].en, "The original [əˋrɪdʒənəl] due date stays the same. Please check your account regularly [ˋrɛgjəlɚlɪ], because notification emails are only reminders.");
assert.equal(recallLesson.dialogue[5].zh, "原到期日維持不變。請定期查看個人借閱狀況，因為通知郵件僅供提醒。");
assert.equal(recallLesson.vocabulary.length, 7);
assert.deepEqual(recallLesson.vocabulary.find((item) => item.word === "recall"), {
  word: "recall", kk: "rɪˋkɔl", meaning: "召回", pos: "n.",
});

// Detect text edits that have not been reflected in the approved speech inventory.
const expectedTranscripts = new Map();
const addTranscript = (publicPath, text) => expectedTranscripts.set(path.basename(publicPath), text);
for (const scenario of scenarios) {
  scenario.dialogue.forEach((turn, index) => {
    addTranscript(audioPaths.dialogue(scenario.id, index, "en"), stripForSpeech(turn.en));
    addTranscript(audioPaths.dialogue(scenario.id, index, "zh"), turn.zh);
  });
  scenario.patterns.forEach((pattern, index) => {
    addTranscript(audioPaths.pattern(scenario.id, index, "en"), stripForSpeech(pattern.example));
    addTranscript(audioPaths.pattern(scenario.id, index, "zh"), pattern.explanation);
  });
  scenario.grammar.forEach((grammar, index) => {
    addTranscript(audioPaths.grammar(scenario.id, index), `${grammar.title}。${grammar.explanation}`);
  });
  scenario.vocabulary.forEach((item, index) => {
    addTranscript(audioPaths.vocabWord(scenario.id, index), stripForSpeech(item.word));
    addTranscript(audioPaths.vocabMeaning(scenario.id, index), `${item.meaning}，${posSpeech[item.pos]}`);
  });
}
assert.equal(expectedTranscripts.size, 682);
for (const entry of manifest.entries.filter((item) => item.kind !== "letter")) {
  assert.equal(entry.text, expectedTranscripts.get(entry.file), `Speech text differs from lesson: ${entry.file}`);
}

assert.equal(report.clip_count, 708);
assert.equal(report.english_long_count, 180);
assert.equal(report.english_wpm_target, 120);
assert.ok(report.english_wpm_min >= 115);
assert.ok(report.english_wpm_max <= 125);
assert.deepEqual(report.outside_115_125, []);
assert.equal(report.synthetic_clip_count, 682);
assert.equal(report.alphabet_clip_count, 26);
assert.ok(report.loudness_min_lufs >= -23.3);
assert.ok(report.loudness_max_lufs <= -21.3);
assert.ok(report.maximum_true_peak_dbfs <= -3);

assert.equal(kokoroSources.status, "approved-production");
assert.equal(kokoroSources.license, "Apache-2.0");
assert.equal(kokoroSources.clip_count, 682);
assert.equal(kokoroSources.unique_sha256_count, 682);
assert.equal(kokoroSources.records.length, 682);
assert.equal(kokoroSources.models["v1.0"].revision, "f3ff3571791e39611d31c381e3a41a3af07b4987");
assert.equal(kokoroSources.models["v1.1-zh"].revision, "8913be6a3a2d1b410c83c24fb7b8821a8843b0c5");
assert.equal(new Set(kokoroSources.records.map((record) => record.sha256)).size, 682);

const kokoroRecords = new Map(
  kokoroSources.records.map((record) => [record.file, record]),
);
for (const entry of manifest.entries.filter((item) => item.kind !== "letter")) {
  const record = kokoroRecords.get(entry.file);
  assert.ok(record, `Missing Kokoro source record: ${entry.file}`);
  if (record.text !== undefined) {
    assert.equal(record.text, entry.text, `Generated speech text differs from inventory: ${entry.file}`);
  }
  assert.equal(entry.voice, `kokoro-${record.model}/${record.voice}`);
  assert.equal(entry.speed, record.speed);
  assert.equal(entry.phonemes, record.phonemes);
  assert.equal(entry.voice_key, record.voice_key);
  assert.equal(entry.model, record.model);
  if (entry.target_wpm !== undefined) {
    assert.equal(entry.kind, "english_long");
    assert.ok(entry.target_wpm >= 115 && entry.target_wpm <= 125);
    assert.equal(record.timing.target_wpm, entry.target_wpm);
    assert.ok(Math.abs(record.timing.verified_wpm - entry.target_wpm) < 1);
  }
  assert.equal(record.technical.codec, "mp3");
  assert.equal(record.technical.sample_rate, 24000);
  assert.equal(record.technical.channels, 1);
  assert.ok(Math.abs(record.loudness.integrated_lufs - -22.3) <= 1);
  assert.ok(record.loudness.true_peak_dbfs <= -3);
  const file = path.join(project, "public", "audio", entry.file);
  const digest = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  assert.equal(digest, record.sha256, `Unapproved Kokoro audio: ${entry.file}`);
}

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
  if (entry.kind === "word" && entry.text === "present") {
    assert.match(entry.phonemes ?? "", /pɹɪzˈɛnt/, `Present must use the verb stress: ${entry.file}`);
  }
  if (entry.file === "s10-p01-zh.mp3") {
    assert.match(entry.phonemes ?? "", /ㄍ万3ㄕㄜ4/, "館舍 must use guan3 she4");
    assert.match(entry.phonemes ?? "", /ㄒ阳3ㄑ言2王3/, "Keep 想前往 in one spoken phrase");
  }
  if (entry.file === "s12-v03-meaning.mp3") {
    assert.match(entry.phonemes ?? "", /言2ㄔㄤ2/, "延長 must use yan2 chang2");
  }
  if (entry.language === "zh") {
    if (/^s(?:02|11)-/.test(entry.file)) {
      const periods = entry.text.split("期").length - 1;
      if (periods > 0) {
        assert.ok(entry.phonemes, `Period tone is not pinned: ${entry.file}`);
        assert.equal((entry.phonemes.match(/ㄑㄧ2/g) ?? []).length, periods,
          `期 must use qi2: ${entry.file}`);
        assert.doesNotMatch(entry.phonemes, /ㄑㄧ1/, `Wrong first tone: ${entry.file}`);
      }
      if (entry.text.includes("處理")) {
        assert.match(entry.phonemes ?? "", /ㄔㄨ[23]ㄌㄧ3/,
          `Processing must use the third-tone base or its second-tone sandhi: ${entry.file}`);
      }
    }

    // A return transaction must not use the pronunciation for "still".
    const returned = [...entry.text.matchAll(/(?<=歸|返|交|償)還|還(?=書|款|清)/gu)].length;
    if (returned > 0) {
      assert.ok(entry.phonemes, `Return pronunciation is not pinned: ${entry.file}`);
      assert.equal((entry.phonemes.match(/ㄏ万2/g) ?? []).length, returned,
        `Return must use huan2: ${entry.file}`);
      const still = entry.text.split("還").length - 1 - returned;
      assert.equal((entry.phonemes.match(/ㄏㄞ2/g) ?? []).length, still,
        `Preserve hai2 only for the remaining contexts: ${entry.file}`);
    }
  }

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
    let expectedVoice = manifest.voices[language][entry.role];
    if (entry.voice_key !== undefined) {
      assert.equal(entry.language, "en", `Voice override must be English: ${entry.file}`);
      assert.equal(entry.kind, "word", `Voice override must be a word: ${entry.file}`);
      const wordVoices = {
        "reader-en": manifest.voices.english.reader,
        "librarian-en": manifest.voices.english.librarian,
        "explainer-en": manifest.voices.english.explainer,
      };
      assert.ok(Object.hasOwn(wordVoices, entry.voice_key), `Unknown word voice: ${entry.file}`);
      expectedVoice = wordVoices[entry.voice_key];
    }
    assert.equal(entry.voice, expectedVoice, `Wrong ${language} voice: ${entry.file}`);
  }
  if (entry.language === "zh") {
    assert.equal(entry.voice, "kokoro-v1.1-zh/zm_010", `Wrong Chinese voice: ${entry.file}`);
  }
}

console.log(
  `Audio validation passed: ${report.clip_count} clips, ` +
    `${report.english_long_count} English clips at ` +
    `${report.english_wpm_min}-${report.english_wpm_max} WPM; ` +
    `all 682 synthetic clips match the approved Kokoro hashes.`,
);
