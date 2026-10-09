import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const fetch = typeof worker === "function" ? worker : worker.fetch.bind(worker);
  return fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

async function renderCredits() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("credits-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const fetch = typeof worker === "function" ? worker : worker.fetch.bind(worker);
  return fetch(
    new Request("http://localhost/credits", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the course shell and PWA metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<html lang="zh-Hant"/i);
  assert.match(html, /清大圖書館英語情境練習室/);
  assert.match(html, /Counter English Lab/);
  assert.match(html, /二十個真實服務情境/);
  assert.match(html, /manifest\.webmanifest/);
  assert.match(html, /循環播放整個情境/);
  assert.match(html, /循環播放第 1 句/);
  assert.match(html, /素材來源、第三方授權及著作權聲明/);
  assert.match(html, /og\.png/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("server-renders material sources and license notices", async () => {
  const response = await renderCredits();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /未授予專案整體的開源或開放內容授權/);
  assert.match(html, /並非清大官方網域/);
  assert.match(html, /不會自動將整個網站或獨立程式碼改授權為 CC BY-SA/);
  assert.match(html, /國立清華大學商標使用管理要點/);
  assert.doesNotMatch(html, /© 2026 國立清華大學圖書館/);
  assert.match(html, /Brannon Wyndesor/);
  assert.match(html, /CC BY-SA 3\.0/);
  assert.match(html, /am_fenrir/);
  assert.match(html, /Apache License 2\.0/);
  assert.match(html, /KOKORO-APACHE-2\.0\.txt/);
  assert.match(html, /權益聲明與召回政策/);
  assert.match(html, /THIRD_PARTY_NOTICES\.md/);
  assert.match(html, /third-party-packages\.json/);
});

test("keeps the repository license boundary explicit", async () => {
  const [license, packageJson] = await Promise.all([
    readFile(new URL("../LICENSE", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  assert.match(license, /does not grant a project-wide open-source/);
  assert.match(license, /Creative Commons Attribution-ShareAlike 3\.0/);
  assert.match(license, /do not\s+automatically relicense independent files/);
  assert.equal(JSON.parse(packageJson).license, "UNLICENSED");
});

test("keeps the final app free of starter preview code", async () => {
  const [page, layout, packageJson, manifest, serviceWorker] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
  ]);
  assert.match(page, /角色扮演/);
  assert.match(page, /LEARNING_PROGRESS_STORAGE_KEY/);
  assert.match(page, /逾期最久、應優先複習的情境/);
  assert.match(page, /複習排程設定/);
  assert.match(page, /這個情境我已學過/);
  assert.match(page, /下載全部離線語音/);
  assert.match(page, /changeRolePlayMode\("reader"\)/);
  assert.match(page, /changeRolePlayMode\("librarian"\)/);
  assert.match(page, /changeRolePlayMode\("all"\)/);
  assert.match(page, /都隱藏/);
  assert.match(layout, /og\.png/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(manifest, /standalone/);
  assert.match(serviceWorker, /nthu-library-shell-v11/);
  assert.match(serviceWorker, /withBase\("\/credits\/"\)/);
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
  await access(new URL("../public/img_20260726120102.png", import.meta.url));
  await access(new URL("../public/img_20260726121722.png", import.meta.url));
  await access(new URL("../public/og.png", import.meta.url));
});

test("renders sleep timer controls and accessible status", async () => {
  const response = await render();
  const html = await response.text();
  assert.match(html, /sleep-timer-heading/);
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /SLEEP_TIMER_STORAGE_KEY/);
  assert.match(page, /sleepDeadlineRef/);
  assert.match(page, /aria-live="polite"/);
  assert.match(page, /sleep-toolbar-status/);
});
