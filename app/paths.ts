export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function assetPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${normalized}`;
}

export function versionedAudioPath(path: string, version: string): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}audioVersion=${encodeURIComponent(version)}`;
}
