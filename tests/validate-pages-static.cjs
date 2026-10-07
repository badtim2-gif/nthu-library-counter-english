const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "out");
const basePath = "/nthu-library-counter-english";

for (const relative of [
  "index.html",
  "credits/index.html",
  "manifest.webmanifest",
  "sw.js",
  "third-party-packages.json",
  ".nojekyll",
  "img_20260726120102.png",
  "img_20260726121722.png",
  "og.png",
  "audio/KOKORO-APACHE-2.0.txt",
  "audio/kokoro-audio-sources.json",
  "audio/s01-t01-en.mp3",
  "audio/s10-v07-meaning.mp3",
  "audio/s20-v07-meaning.mp3",
]) {
  assert.ok(fs.existsSync(path.join(output, relative)), `Missing Pages file: ${relative}`);
}

const html = fs.readFileSync(path.join(output, "index.html"), "utf8");
assert.match(html, /清大圖書館英語情境練習室/);
assert.match(html, new RegExp(`${basePath}/_next/`));
assert.match(html, new RegExp(`${basePath}/manifest\\.webmanifest`));
assert.doesNotMatch(html, /(?:href|src)="\/_next\//);
assert.match(html, new RegExp(`${basePath}/credits/`));

const creditsHtml = fs.readFileSync(path.join(output, "credits", "index.html"), "utf8");
assert.match(creditsHtml, /素材來源、第三方授權及著作權聲明/);
assert.match(creditsHtml, /Brannon Wyndesor/);
assert.match(creditsHtml, /CC BY-SA 3\.0/);
assert.match(creditsHtml, new RegExp(`href="${basePath}/"`));
assert.match(creditsHtml, new RegExp(`${basePath}/third-party-packages\\.json`));

const serviceWorker = fs.readFileSync(path.join(output, "sw.js"), "utf8");
assert.match(serviceWorker, /self\.registration\.scope/);
assert.match(serviceWorker, /nthu-library-shell-v10/);
assert.match(serviceWorker, /withBase\("\/credits\/"\)/);
assert.match(serviceWorker, /nthu-library-audio-v8/);
assert.doesNotMatch(serviceWorker, /nthu-library-audio-v[1-7]/);

const kokoroSources = JSON.parse(
  fs.readFileSync(path.join(output, "audio", "kokoro-audio-sources.json"), "utf8"),
);
assert.equal(kokoroSources.status, "approved-production");
assert.equal(kokoroSources.license, "Apache-2.0");
assert.equal(kokoroSources.records.length, 682);
const packageReport = JSON.parse(
  fs.readFileSync(path.join(output, "third-party-packages.json"), "utf8"),
);
assert.ok(packageReport.package_count > 0);
assert.equal(packageReport.packages.length, packageReport.package_count);
assert.ok(packageReport.packages.every((entry) => !("paths" in entry)));

const pageSource = fs.readFileSync(path.join(root, "app", "page.tsx"), "utf8");
assert.match(pageSource, /const AUDIO_CACHE_NAME = "nthu-library-audio-v8"/);
assert.match(pageSource, /caches\.open\(AUDIO_CACHE_NAME\)/);
for (const version of [1, 2, 3, 4, 5, 6, 7]) {
  assert.match(pageSource, new RegExp(`nthu-library-audio-v${version}`));
}

const manifest = JSON.parse(
  fs.readFileSync(path.join(output, "manifest.webmanifest"), "utf8"),
);
assert.equal(manifest.start_url, "./");
assert.equal(manifest.scope, "./");

console.log("GitHub Pages static export validation passed.");
