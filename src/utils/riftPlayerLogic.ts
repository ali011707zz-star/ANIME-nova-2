import { SkipInterval } from "./skipTimes";

export type GestureSide = "brightness" | "volume";

/**
 * Determines whether a touch gesture at clientX within a container [rectLeft, rectWidth]
 * controls Brightness (left half) or Volume (right half).
 * Per user requirement:
 * - Right side vertical swipe -> Volume (الصوت)
 * - Left side vertical swipe -> Brightness (السطوع)
 */
export function resolveTouchGestureSide(
  clientX: number,
  rectLeft: number,
  rectWidth: number
): GestureSide {
  const safeWidth = Math.max(1, rectWidth);
  const relativeX = clientX - rectLeft;
  return relativeX < safeWidth / 2 ? "brightness" : "volume";
}

/**
 * Computes the updated normalized level (0..1) when dragging vertically.
 * Swiping UP (negative dy) increases the value; swiping DOWN (positive dy) decreases it.
 */
export function computeVerticalGestureLevel(
  startLevel: number,
  deltaY: number,
  sensitivityPx = 220,
  minLevel = 0,
  maxLevel = 1
): number {
  const safeSensitivity = Math.max(20, sensitivityPx);
  const raw = startLevel - deltaY / safeSensitivity;
  return Math.max(minLevel, Math.min(maxLevel, Number(raw.toFixed(3))));
}

export interface TimelineMarkerSegment {
  kind: "intro" | "outro";
  leftPct: number;
  widthPct: number;
  startSeconds: number;
  endSeconds: number;
}

/**
 * Computes the yellow/amber skip-intro and skip-outro marker segments on the seekbar.
 */
export function computeTimelineSkipSegments(
  durationSeconds: number,
  intro?: SkipInterval | null,
  outro?: SkipInterval | null
): TimelineMarkerSegment[] {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return [];
  const segments: TimelineMarkerSegment[] = [];

  const addSegment = (kind: "intro" | "outro", interval?: SkipInterval | null) => {
    if (!interval) return;
    const start = Math.max(0, Math.min(durationSeconds, interval.startSeconds));
    const end = Math.max(0, Math.min(durationSeconds, interval.endSeconds));
    if (end <= start) return;
    const leftPct = (start / durationSeconds) * 100;
    const widthPct = Math.max(1.2, ((end - start) / durationSeconds) * 100);
    segments.push({
      kind,
      leftPct: Number(leftPct.toFixed(2)),
      widthPct: Number(Math.min(100 - leftPct, widthPct).toFixed(2)),
      startSeconds: start,
      endSeconds: end,
    });
  };

  addSegment("intro", intro);
  addSegment("outro", outro);
  return segments;
}

/**
 * Formats the player metadata subtitle line matching the reference design:
 * e.g. "الحلقة 4 • العربية • مترجم • 1080P"
 */
export function formatPlayerSubtitleLine(params: {
  episodeNumber: number;
  languageLabel?: string;
  modeLabel?: string;
  qualityLabel?: string;
}): string {
  const ep = `الحلقة ${params.episodeNumber}`;
  const lang = (params.languageLabel || "العربية").trim();
  const mode = (params.modeLabel || "مترجم").trim();
  const quality = (params.qualityLabel || "1080P").toUpperCase().trim();
  return `${ep} • ${lang} • ${mode} • ${quality}`;
}

/**
 * Formats seconds into MM:SS or H:MM:SS tabular timestamp string.
 */
export function formatPlayerTimestamp(seconds: number): string {
  const s = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) {
    return `${h}:${m < 10 ? "0" : ""}${m}:${r < 10 ? "0" : ""}${r}`;
  }
  return `${m < 10 ? "0" : ""}${m}:${r < 10 ? "0" : ""}${r}`;
}

export interface LocalPointerCoords {
  localX: number;
  localY: number;
  localWidth: number;
  localHeight: number;
}

/**
 * Maps viewport pointer coordinates (clientX, clientY) and a bounding client rect
 * into the player's local unrotated coordinate space.
 * When `isCssRotated90` is true (player is rotated +90deg clockwise to show Landscape
 * inside a Portrait viewport), screen Y corresponds to local X and inverted screen X
 * corresponds to local Y.
 */
export function mapPointerToPlayerLocalCoords(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; right: number; bottom: number; width: number; height: number },
  isCssRotated90: boolean
): LocalPointerCoords {
  if (!isCssRotated90) {
    return {
      localX: clientX - rect.left,
      localY: clientY - rect.top,
      localWidth: Math.max(1, rect.width),
      localHeight: Math.max(1, rect.height),
    };
  }
  return {
    localX: clientY - rect.top,
    localY: rect.right - clientX,
    localWidth: Math.max(1, rect.height),
    localHeight: Math.max(1, rect.width),
  };
}

