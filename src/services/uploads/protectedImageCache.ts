import { apiClient } from "@/services/http/client";

interface CacheEntry {
  promise: Promise<string>;
  objectUrl: string | null;
  references: number;
  revokeTimer: number | null;
}

const cache = new Map<string, CacheEntry>();
const REVOKE_DELAY_MS = 60_000;

function isDirectBrowserSource(source: string): boolean {
  return /^(?:blob:|data:|https?:\/\/)/i.test(source) || source.startsWith("/api/public/");
}

export function acquireProtectedImage(source: string): Promise<string> {
  if (isDirectBrowserSource(source)) return Promise.resolve(source);
  const current = cache.get(source);
  if (current) {
    current.references += 1;
    if (current.revokeTimer !== null) window.clearTimeout(current.revokeTimer);
    current.revokeTimer = null;
    return current.promise;
  }

  const entry: CacheEntry = {
    references: 1,
    objectUrl: null,
    revokeTimer: null,
    promise: Promise.resolve(""),
  };
  entry.promise = apiClient.get<Blob>(source, { responseType: "blob" }).then(({ data }) => {
    const objectUrl = URL.createObjectURL(data);
    entry.objectUrl = objectUrl;
    return objectUrl;
  }).catch((error) => {
    cache.delete(source);
    throw error;
  });
  cache.set(source, entry);
  return entry.promise;
}

export function releaseProtectedImage(source: string): void {
  if (isDirectBrowserSource(source)) return;
  const entry = cache.get(source);
  if (!entry) return;
  entry.references = Math.max(0, entry.references - 1);
  if (entry.references > 0 || entry.revokeTimer !== null) return;
  entry.revokeTimer = window.setTimeout(() => {
    if (entry.references > 0) return;
    if (entry.objectUrl) URL.revokeObjectURL(entry.objectUrl);
    cache.delete(source);
  }, REVOKE_DELAY_MS);
}

export function clearProtectedImageCache(): void {
  cache.forEach((entry) => {
    if (entry.revokeTimer !== null) window.clearTimeout(entry.revokeTimer);
    if (entry.objectUrl) URL.revokeObjectURL(entry.objectUrl);
  });
  cache.clear();
}
