import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveTouchGestureSide,
  computeVerticalGestureLevel,
  computeTimelineSkipSegments,
  formatPlayerSubtitleLine,
  formatPlayerTimestamp,
  mapPointerToPlayerLocalCoords,
} from "./riftPlayerLogic";

test("resolveTouchGestureSide maps left half to brightness and right half to volume", () => {
  assert.equal(resolveTouchGestureSide(100, 0, 400), "brightness");
  assert.equal(resolveTouchGestureSide(199, 0, 400), "brightness");
  assert.equal(resolveTouchGestureSide(201, 0, 400), "volume");
  assert.equal(resolveTouchGestureSide(380, 0, 400), "volume");
});

test("computeVerticalGestureLevel increases when swiping up (negative deltaY) and clamps safely", () => {
  // Swiping up by 110px with 220px sensitivity increases by +0.5
  assert.equal(computeVerticalGestureLevel(0.15, -110, 220, 0.05, 1), 0.65);
  // Swiping down decreases and clamps to minLevel
  assert.equal(computeVerticalGestureLevel(0.2, 200, 220, 0.05, 1), 0.05);
  // Swiping far up clamps to maxLevel (1.0)
  assert.equal(computeVerticalGestureLevel(0.8, -200, 220, 0, 1), 1);
});

test("computeTimelineSkipSegments calculates yellow intro and outro bar percentages", () => {
  const segments = computeTimelineSkipSegments(
    1429, // 23:49
    { startSeconds: 85, endSeconds: 175 },
    { startSeconds: 1310, endSeconds: 1429 }
  );
  assert.equal(segments.length, 2);
  assert.equal(segments[0].kind, "intro");
  assert.ok(segments[0].leftPct > 5 && segments[0].leftPct < 7);
  assert.ok(segments[0].widthPct > 5 && segments[0].widthPct < 7);
  assert.equal(segments[1].kind, "outro");
  assert.ok(segments[1].leftPct > 90);
});

test("formatPlayerSubtitleLine formats bullet-separated metadata matching screenshot", () => {
  const line = formatPlayerSubtitleLine({
    episodeNumber: 4,
    languageLabel: "العربية",
    modeLabel: "مترجم",
    qualityLabel: "1080p",
  });
  assert.equal(line, "الحلقة 4 • العربية • مترجم • 1080P");
});

test("formatPlayerTimestamp formats MM:SS and H:MM:SS accurately", () => {
  assert.equal(formatPlayerTimestamp(561), "09:21");
  assert.equal(formatPlayerTimestamp(579), "09:39");
  assert.equal(formatPlayerTimestamp(1429), "23:49");
});

test("mapPointerToPlayerLocalCoords maps coordinates accurately in both normal and 90deg CSS-rotated landscape", () => {
  const portraitRect = {
    left: 0,
    top: 0,
    right: 390,
    bottom: 844,
    width: 390,
    height: 844,
  };
  const normal = mapPointerToPlayerLocalCoords(100, 200, portraitRect, false);
  assert.equal(normal.localX, 100);
  assert.equal(normal.localY, 200);
  assert.equal(normal.localWidth, 390);
  assert.equal(normal.localHeight, 844);

  const rotated = mapPointerToPlayerLocalCoords(100, 600, portraitRect, true);
  assert.equal(rotated.localX, 600);
  assert.equal(rotated.localY, 290);
  assert.equal(rotated.localWidth, 844);
  assert.equal(rotated.localHeight, 390);
});

