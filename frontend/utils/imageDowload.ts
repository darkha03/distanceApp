import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

const WIDGET_CACHE_DIR = `${FileSystem.cacheDirectory}widget-images/`;
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

function getExtFromUrl(url: string) {
  try {
    const pathname = new URL(url).pathname;
    const m = pathname.match(/\.(jpg|jpeg|png|webp|gif|bmp)$/i);
    return (m?.[1] ?? "jpg").toLowerCase();
  } catch {
    return "jpg";
  }
}

async function ensureDir() {
  await FileSystem.makeDirectoryAsync(WIDGET_CACHE_DIR, { intermediates: true }).catch(() => {});
}

export function buildFileUri(url: string) {
  const ext = getExtFromUrl(url);
  const name = `${hashString(url)}.${ext}`;
  return `${WIDGET_CACHE_DIR}${name}`;
}

async function isFresh(fileUri: string, ttlMs: number) {
  const info = await FileSystem.getInfoAsync(fileUri);
  if (!info.exists || info.modificationTime == null) return false;
  const age = Date.now() - info.modificationTime * 1000;
  return age < ttlMs;
}

async function maybeContentUri(fileUri: string, returnContentUri?: boolean) {
  if (Platform.OS === "android" && returnContentUri) {
    try {
      return await FileSystem.getContentUriAsync(fileUri);
    } catch {
      // fall through to fileUri
    }
  }
  return fileUri;
}

/**
 * Downloads an image to cache (or reuses a fresh cached one) and returns a local URI.
 * Set returnContentUri=true on Android if your widget needs content:// URIs.
 */
export async function getCachedImagePath(
  url: string,
  opts?: { ttlMs?: number; headers?: Record<string, string>; returnContentUri?: boolean }
): Promise<string> {
  const ttlMs = opts?.ttlMs ?? DEFAULT_TTL_MS;
  const fileUri = buildFileUri(url);
  await ensureDir();

  if (await isFresh(fileUri, ttlMs)) {
    return await maybeContentUri(fileUri, opts?.returnContentUri);
  }

  try {
    await FileSystem.downloadAsync(url, fileUri, { headers: opts?.headers });
  } catch (e) {
    // If download fails but file exists (stale), still return stale file as fallback
    const info = await FileSystem.getInfoAsync(fileUri);
    if (!info.exists) throw e;
  }
  return await maybeContentUri(fileUri, opts?.returnContentUri);
}

/** Pre-download a list of URLs; returns local URIs in the same order. */
export async function cacheImages(
  urls: string[],
  opts?: { ttlMs?: number; headers?: Record<string, string>; returnContentUri?: boolean }
): Promise<string[]> {
  const out: string[] = [];
  for (const u of urls) {
    out.push(await getCachedImagePath(u, opts));
  }
  return out;
}

/** Remove cached files older than the threshold (default 7 days). */
export async function clearOldCachedImages(olderThanMs = 7 * 24 * 60 * 60 * 1000) {
  await ensureDir();
  const dir = await FileSystem.readDirectoryAsync(WIDGET_CACHE_DIR).catch(() => []);
  const now = Date.now();
  for (const f of dir) {
    const uri = `${WIDGET_CACHE_DIR}${f}`;
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists && info.modificationTime && now - info.modificationTime * 1000 > olderThanMs) {
      await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
    }
  }
}

/** Purge the entire widget image cache. */
export async function purgeWidgetImageCache() {
  await FileSystem.deleteAsync(WIDGET_CACHE_DIR, { idempotent: true }).catch(() => {});
  await ensureDir();
}