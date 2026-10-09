import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const pathsSource = await readFile(new URL("../app/paths.ts", import.meta.url), "utf8");
const pathsModule = { exports: {} };
const compiled = ts.transpileModule(pathsSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
new Function("module", "exports", "process", compiled)(
  pathsModule, pathsModule.exports, { env: {} },
);
const { versionedAudioPath } = pathsModule.exports;
const workerSource = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
const approvedAudio = await readFile(new URL("../public/audio/s01-v03-word.mp3", import.meta.url));
const origin = "https://badtim2-gif.github.io";
const base = "/nthu-library-counter-english";
const originalUrl = origin + base + "/audio/s01-v03-word.mp3";
const staleAudio = new TextEncoder().encode("old unclear privilege audio");

function makeWorker() {
  const handlers = new Map();
  const stores = new Map([
    ["nthu-library-audio-v8", new Map([[originalUrl, new Response(staleAudio)]])],
  ]);
  const networkCalls = [];
  let offline = false;
  const keyOf = (request) => typeof request === "string" ? request : request.url;
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async match(request) { return store.get(keyOf(request))?.clone(); },
        async put(request, response) { store.set(keyOf(request), response.clone()); },
      };
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
  };
  const context = vm.createContext({
    URL, caches,
    self: {
      registration: { scope: origin + base + "/" },
      location: { origin },
      addEventListener(name, handler) { handlers.set(name, handler); },
      skipWaiting() {},
      clients: { claim() {} },
    },
    async fetch(request, options) {
      networkCalls.push({ url: keyOf(request), cache: options?.cache ?? request.cache });
      if (offline) throw new Error("Network is offline");
      const mode = options?.cache ?? request.cache;
      // Simulate a browser that still has the original MP3 in its HTTP cache.
      return new Response(mode === "reload" ? approvedAudio : staleAudio);
    },
  });
  vm.runInContext(workerSource, context);
  return {
    networkCalls, stores,
    cacheName: vm.runInContext("AUDIO_CACHE", context),
    setOffline() { offline = true; },
    async activate() {
      let completion;
      handlers.get("activate")({ waitUntil(promise) { completion = promise; } });
      await completion;
    },
    async get(url, cache = "force-cache") {
      let response;
      handlers.get("fetch")({
        request: new Request(url, { cache }),
        respondWith(promise) { response = promise; },
      });
      assert.ok(response, "Service worker must handle the audio request");
      return response;
    },
  };
}

test("audio versions produce separate browser cache keys while preserving Pages paths", () => {
  const path = base + "/audio/s01-v03-word.mp3";
  const oldPath = versionedAudioPath(path, "nthu-library-audio-v8");
  const newPath = versionedAudioPath(path, "nthu-library-audio-v9");
  assert.notEqual(oldPath, newPath);
  assert.equal(new URL(newPath, origin).pathname, path);
  const withQuery = new URL(versionedAudioPath(path + "?example=1", "v9"), origin);
  assert.equal(withQuery.searchParams.get("example"), "1");
  assert.equal(withQuery.searchParams.get("audioVersion"), "v9");
});

test("an audio cache miss replaces stale browser HTTP audio with the approved clip", async () => {
  const worker = makeWorker();
  await worker.activate();
  assert.equal(worker.stores.has("nthu-library-audio-v8"), false);
  const response = await worker.get(originalUrl);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), approvedAudio);
  assert.equal(worker.networkCalls.length, 1);
  assert.equal(worker.networkCalls[0].cache, "reload");
});

test("versioned approved audio continues playing offline without another network request", async () => {
  const worker = makeWorker();
  const url = origin + versionedAudioPath(base + "/audio/s01-v03-word.mp3", worker.cacheName);
  await worker.get(url);
  worker.setOffline();
  const response = await worker.get(url);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), approvedAudio);
  assert.equal(worker.networkCalls.length, 1);
});
