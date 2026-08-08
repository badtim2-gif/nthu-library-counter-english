const fs = require("fs");
const path = require("path");
const ts = require(path.join(process.cwd(), "node_modules", "typescript"));

const source = fs.readFileSync(path.join(process.cwd(), "app", "scenarios.ts"), "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const box = { exports: {} };
new Function("module", "exports", "require", output)(box, box.exports, require);
const { scenarios, stripForSpeech } = box.exports;

const errors = [];
const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

assert(scenarios.length === 20, `應有 20 個情境，實際為 ${scenarios.length}`);
assert(scenarios.every((scenario, index) => scenario.id === index + 1), "情境編號不是 1 至 20 的連續值");

for (const scenario of scenarios) {
  const prefix = `情境 ${scenario.id}`;
  assert(scenario.dialogue.length === 6, `${prefix} 對話不是 6 句`);
  assert(scenario.patterns.length === 3, `${prefix} 句型不是 3 個`);
  assert(scenario.grammar.length === 2, `${prefix} 文法不是 2 個`);
  assert(
    scenario.vocabulary.length >= 6 && scenario.vocabulary.length <= 8,
    `${prefix} 單字數未落在 6 至 8 個`,
  );
  scenario.dialogue.forEach((turn, index) => {
    const expectedRole = index % 2 === 0 ? "reader" : "librarian";
    assert(turn.role === expectedRole, `${prefix} 第 ${index + 1} 句角色未交替`);
    assert(Boolean(turn.en.trim()), `${prefix} 第 ${index + 1} 句缺英文`);
    assert(Boolean(turn.zh.trim()), `${prefix} 第 ${index + 1} 句缺中文`);
    const speech = stripForSpeech(turn.en);
    assert(!/\[[^\]]*]/.test(speech), `${prefix} 第 ${index + 1} 句朗讀稿含 KK 音標`);
    assert(!/[*\/-]/.test(speech), `${prefix} 第 ${index + 1} 句朗讀稿含禁讀符號`);
    assert(!/\bNTHU\b/.test(speech), `${prefix} 第 ${index + 1} 句未拆讀 NTHU`);
  });
  scenario.patterns.forEach((item, index) => {
    assert(!/[A-Za-z]/.test(item.explanation), `${prefix} 句型 ${index + 1} 中文解說混入英文`);
  });
  scenario.grammar.forEach((item, index) => {
    assert(!/[A-Za-z]/.test(item.title + item.explanation), `${prefix} 文法 ${index + 1} 解說混入英文`);
  });
  scenario.vocabulary.forEach((item, index) => {
    assert(Boolean(item.kk), `${prefix} 單字 ${index + 1} 缺 KK 音標`);
    assert(!/[A-Za-z]/.test(item.meaning), `${prefix} 單字 ${index + 1} 中文解說混入英文`);
  });
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("Content validation passed: 20 scenarios, 120 alternating dialogue turns, notes and vocabulary complete.");
