export type OfflineDownloadResult = {
  completed: number;
  total: number;
  ready: boolean;
  reason?: "offline" | "network" | "invalid-audio" | "storage";
};

// A cache container or an HTTP 200 HTML error page is not an offline MP3.
export async function isOfflineMp3(response: Response | undefined): Promise<boolean> {
  if (!response || response.status !== 200) return false;
  const type = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (type && !["audio/mpeg", "audio/mp3", "application/octet-stream"].includes(type)) return false;
  try {
    const bytes = new Uint8Array(await response.clone().arrayBuffer());
    return bytes.length > 500 && (
      (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) ||
      (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)
    );
  } catch {
    return false;
  }
}

export async function hasCompleteOfflineAudio(
  storage: CacheStorage, cacheName: string, paths: readonly string[],
): Promise<boolean> {
  if (paths.length === 0 || !(await storage.has(cacheName))) return false;
  const cache = await storage.open(cacheName);
  for (const path of paths) {
    if (!(await isOfflineMp3(await cache.match(path)))) return false;
  }
  return true;
}

export async function downloadOfflineAudio(options: {
  storage: CacheStorage;
  cacheName: string;
  paths: readonly string[];
  fetchAudio: (path: string, signal: AbortSignal) => Promise<Response>;
  signal: AbortSignal;
  isOnline: () => boolean;
  onProgress: (completed: number, total: number) => void;
}): Promise<OfflineDownloadResult> {
  const { storage, cacheName, paths, signal, isOnline, onProgress } = options;
  let completed = 0;
  const result = (reason?: OfflineDownloadResult["reason"]): OfflineDownloadResult => ({
    completed, total: paths.length, ready: !reason && paths.length > 0 && completed === paths.length,
    ...(reason ? { reason } : {}),
  });
  const interrupted = () => signal.aborted || !isOnline();
  try {
    const cache = await storage.open(cacheName);
    for (const path of paths) {
      if (interrupted()) return result("offline");
      const cached = await cache.match(path);
      if (!(await isOfflineMp3(cached))) {
        let response: Response;
        try {
          response = await options.fetchAudio(path, signal);
        } catch {
          return result(interrupted() ? "offline" : "network");
        }
        if (interrupted()) return result("offline");
        if (!(await isOfflineMp3(response))) return result("invalid-audio");
        if (interrupted()) return result("offline");
        await cache.put(path, response);
        if (interrupted()) return result("offline");
        if (!(await isOfflineMp3(await cache.match(path)))) return result("storage");
      }
      if (interrupted()) return result("offline");
      completed += 1;
      onProgress(completed, paths.length);
    }
    if (interrupted()) return result("offline");
    if (!(await hasCompleteOfflineAudio(storage, cacheName, paths))) return result("storage");
    if (interrupted()) return result("offline");
    return result();
  } catch {
    return result(interrupted() ? "offline" : "storage");
  }
}
