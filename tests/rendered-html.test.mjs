import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
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
  assert.match(html, /manifest\.webmanifest/);
  assert.match(html, /img_20260726121722\.png/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
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
  assert.match(page, /下載全部離線語音/);
  assert.match(page, /setHiddenRole\("reader"\)/);
  assert.match(page, /setHiddenRole\("librarian"\)/);
  assert.match(layout, /img_20260726121722\.png/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(manifest, /standalone/);
  assert.match(serviceWorker, /nthu-library-shell-v3/);
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
  await access(new URL("../public/img_20260726120102.png", import.meta.url));
  await access(new URL("../public/img_20260726121722.png", import.meta.url));
});
