import * as FileSystem from "expo-file-system/legacy";
import { WidgetControl } from "@/utils/widgetBridge";
import { getCachedImagePath, buildFileUri } from "@/utils/imageDowload"; // uses your existing downloader


/**
 * Sync partner widget image with a new backend URL.
 * - If same as saved URL, returns existing local path (ensuring it’s cached).
 * - If different, deletes old cached file, downloads new, updates saved URL.
 */
export async function syncPartnerWidgetImage(
  newUrl: string | null | undefined,
  opts?: { returnContentUri?: boolean; headers?: Record<string, string> }
): Promise<{ localUri: string | null; updated: boolean }> {
  const savedUrl = await WidgetControl.getPartnerImageUrl();

  // If no URL provided: clear prefs and return
  if (!newUrl) {
    if (savedUrl) {
      const oldPath = buildFileUri(savedUrl);
      await FileSystem.deleteAsync(oldPath, { idempotent: true }).catch(() => {});
      await WidgetControl.updatePartnerImageUrl("");
    }
    return { localUri: null, updated: !!savedUrl };
  }

  // If same URL, ensure it’s cached and return its local path
  if (savedUrl === newUrl) {
    const localUri = await getCachedImagePath(newUrl, {
      returnContentUri: opts?.returnContentUri,
      headers: opts?.headers,
    });
    return { localUri, updated: false };
  }

  // Different URL: delete old cached file if any
  if (savedUrl) {
    const oldPath = buildFileUri(savedUrl);
    await FileSystem.deleteAsync(oldPath, { idempotent: true }).catch(() => {});
  }

  // Download new and update prefs
  const localUri = await getCachedImagePath(newUrl, {
    returnContentUri: opts?.returnContentUri,
    headers: opts?.headers,
  });

  await WidgetControl.updatePartnerImageUrl(newUrl);

  return { localUri, updated: true };
}