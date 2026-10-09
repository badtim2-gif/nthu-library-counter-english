const SHELL_CACHE = "nthu-library-shell-v11";
const AUDIO_CACHE = "nthu-library-audio-v9";
const BASE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, "");
const withBase = (path) => `${BASE_PATH}${path}`;
const SHELL_FILES = [
  withBase("/"),
  withBase("/credits/"),
  withBase("/manifest.webmanifest"),
  withBase("/third-party-packages.json"),
  withBase("/img_20260726120102.png")
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![SHELL_CACHE, AUDIO_CACHE].includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith(withBase("/audio/"))) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        const response = await fetch(event.request, { cache: "reload" });
        if (response.ok) {
          // A storage failure must not interrupt a successfully downloaded clip.
          await cache.put(event.request, response.clone()).catch(() => undefined);
        }
        return response;
      })
    );
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(withBase("/"), copy));
          return response;
        })
        .catch(() => caches.match(withBase("/")))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
