import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const source = await readFile(new URL("../app/offline-audio.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const module = { exports: {} };
new Function("module", "exports", compiled)(module, module.exports);
const { downloadOfflineAudio, hasCompleteOfflineAudio, isOfflineMp3 } = module.exports;
const name = "fixture-audio-current";
const paths = ["/audio/a.mp3?v=current", "/audio/b.mp3?v=current", "/audio/c.mp3?v=current"];
const mp3 = () => new Response(Uint8Array.from({ length: 600 }, (_, i) => [73, 68, 51][i] ?? 0),
  { headers: { "content-type": "audio/mpeg" } });

function fixture() {
  const entries = new Map();
  let exists = false;
  const cache = {
    match: async (path) => entries.get(path)?.clone(),
    put: async (path, response) => { entries.set(path, response.clone()); },
  };
  const storage = { has: async () => exists, open: async () => { exists = true; return cache; } };
  const controller = new AbortController();
  const progress = [], fetched = [];
  const options = {
    storage, cacheName: name, paths, signal: controller.signal, isOnline: () => true,
    fetchAudio: async (path) => { fetched.push(path); return mp3(); },
    onProgress: (done, total) => progress.push([done, total]),
  };
  return { entries, cache, storage, controller, progress, fetched, options };
}

test("an empty or playback-only cache is not the complete offline course", async () => {
  const f = fixture();
  assert.equal(await hasCompleteOfflineAudio(f.storage, name, paths), false);
  await f.storage.open(name);
  f.entries.set(paths[0], mp3());
  assert.equal(await hasCompleteOfflineAudio(f.storage, name, paths), false);
});

test("completion requires all files to be saved and read back", async () => {
  const f = fixture();
  const result = await downloadOfflineAudio(f.options);
  assert.deepEqual(result, { ready: true, completed: 3, total: 3 });
  assert.deepEqual(f.progress, [[1, 3], [2, 3], [3, 3]]);
  assert.equal(await hasCompleteOfflineAudio(f.storage, name, paths), true);
});

test("HTTP failure stops without incrementing failed requests or claiming success", async () => {
  const f = fixture();
  f.options.fetchAudio = async (path) => path === paths[1] ? new Response("missing", { status: 404 }) : mp3();
  const result = await downloadOfflineAudio(f.options);
  assert.equal(result.ready, false);
  assert.equal(result.completed, 1);
  assert.equal(result.reason, "invalid-audio");
  assert.deepEqual(f.progress, [[1, 3]]);
});

test("HTML, empty, partial and non-MP3 responses never satisfy readiness", async () => {
  for (const response of [
    new Response("<html>error</html>", { headers: { "content-type": "text/html" } }),
    new Response("", { headers: { "content-type": "audio/mpeg" } }),
    new Response(new Uint8Array(600), { headers: { "content-type": "audio/mpeg" } }),
    new Response(new Uint8Array(600), { status: 206 }),
  ]) assert.equal(await isOfflineMp3(response), false);
});

test("disconnect during fetch aborts progress and preserves earlier successes", async () => {
  const f = fixture();
  f.options.fetchAudio = async (path) => {
    if (path === paths[1]) f.controller.abort();
    return mp3();
  };
  const result = await downloadOfflineAudio(f.options);
  assert.equal(result.reason, "offline");
  assert.equal(result.completed, 1);
  assert.deepEqual(f.progress, [[1, 3]]);
  assert.equal(f.entries.size, 1);
});

test("retry reuses valid saved files and requests only the missing clips", async () => {
  const f = fixture();
  f.entries.set(paths[0], mp3());
  const result = await downloadOfflineAudio(f.options);
  assert.equal(result.ready, true);
  assert.deepEqual(f.fetched, paths.slice(1));
});

test("network and quota failures leave an actionable incomplete result", async () => {
  const network = fixture();
  network.options.fetchAudio = async () => { throw new TypeError("network"); };
  assert.equal((await downloadOfflineAudio(network.options)).reason, "network");
  const quota = fixture();
  quota.cache.put = async () => { throw new Error("quota"); };
  const result = await downloadOfflineAudio(quota.options);
  assert.equal(result.reason, "storage");
  assert.equal(result.ready, false);
  assert.equal(result.completed, 0);
});

test("an initially offline request does not fetch or advance progress", async () => {
  const f = fixture();
  f.options.isOnline = () => false;
  const result = await downloadOfflineAudio(f.options);
  assert.equal(result.reason, "offline");
  assert.deepEqual(f.fetched, []);
  assert.deepEqual(f.progress, []);
});

test("UI guards double clicks, stale startup scans, and premature 100 percent", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /if \(offlineDownloadRef\.current\) return/);
  assert.match(page, /checkRun === offlineCheckRunRef\.current/);
  assert.match(page, /Math\.min\(99, Math\.floor\(completed \/ total \* 100\)\)/);
  assert.doesNotMatch(page, /caches\.has\(AUDIO_CACHE_NAME\)\.then\(setOfflineReady\)/);
  assert.match(page, /window\.addEventListener\("offline", handleOffline\)/);
  assert.match(page, /setOfflineReady\(result\.ready\)/);
});
