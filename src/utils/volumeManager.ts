/**
 * Device / Player Volume & Brightness Manager
 * Adapted from artifacts/nova-mobile/lib/volume-manager.ts
 */

const VOLUME_STORAGE_KEY = "nova_player_volume_v1";
const BRIGHTNESS_STORAGE_KEY = "nova_player_brightness_v1";

export function getSavedVolume(): number {
  try {
    const raw = localStorage.getItem(VOLUME_STORAGE_KEY);
    if (raw !== null) {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) {
        return Math.max(0, Math.min(1, parsed));
      }
    }
  } catch {}
  return 0.9;
}

export function saveVolume(volume: number): number {
  const clamped = Math.max(0, Math.min(1, volume));
  try {
    localStorage.setItem(VOLUME_STORAGE_KEY, String(clamped));
  } catch {}
  return clamped;
}

export function getSavedBrightness(): number {
  try {
    const raw = localStorage.getItem(BRIGHTNESS_STORAGE_KEY);
    if (raw !== null) {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) {
        return Math.max(0.15, Math.min(1, parsed));
      }
    }
  } catch {}
  return 1.0;
}

export function saveBrightness(brightness: number): number {
  const clamped = Math.max(0.15, Math.min(1, brightness));
  try {
    localStorage.setItem(BRIGHTNESS_STORAGE_KEY, String(clamped));
  } catch {}
  return clamped;
}
