/**
 * Watch Screen Orientation Manager
 * Adapted from artifacts/nova-mobile/utils/watchOrientation.ts for Web & Fullscreen API
 */

export type WatchOrientationMode = "landscape" | "portrait";

export async function lockWatchOrientation(
  mode: WatchOrientationMode = "landscape"
): Promise<boolean> {
  try {
    const orientationApi = (window.screen as any)?.orientation;
    if (orientationApi && typeof orientationApi.lock === "function") {
      await orientationApi.lock(
        mode === "landscape" ? "landscape" : "portrait-primary"
      );
      return true;
    }
  } catch {
    // Browser / iFrame may disallow orientation lock outside native fullscreen
  }
  return false;
}

export async function unlockWatchOrientation(): Promise<void> {
  try {
    const orientationApi = (window.screen as any)?.orientation;
    if (orientationApi && typeof orientationApi.unlock === "function") {
      orientationApi.unlock();
    }
  } catch {
    // Ignore unlock errors on unsupported browsers
  }
}
