import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import Hls from "hls.js";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Rewind,
  FastForward,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Lock,
  Unlock,
  Settings,
  ListVideo,
  Server,
  Subtitles,
  AudioLines,
  Camera,
  Moon,
  AlertTriangle,
  RefreshCw,
  Languages,
  Sun,
  Check,
  Sparkles,
} from "lucide-react";
import {
  EpisodeSkipTimes,
  SkipInterval,
  isPositionInSkipInterval,
  resolveEpisodeSkipTimes,
  fetchRemoteSkipTimes,
} from "../utils/skipTimes";
import {
  lockWatchOrientation,
  unlockWatchOrientation,
} from "../utils/watchOrientation";
import {
  getSavedVolume,
  saveVolume,
  getSavedBrightness,
  saveBrightness,
} from "../utils/volumeManager";
import {
  resolveTouchGestureSide,
  computeVerticalGestureLevel,
  computeTimelineSkipSegments,
  formatPlayerSubtitleLine,
  mapPointerToPlayerLocalCoords,
} from "../utils/riftPlayerLogic";

function Seek10Button({
  direction,
  onClick,
  size = 50,
}: {
  direction: "back" | "forward";
  onClick: () => void;
  size?: number;
}) {
  const isBack = direction === "back";
  const iconSize = size >= 50 ? 18 : 15;
  const fontSize = size >= 50 ? 11.5 : 10.5;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isBack ? "رجوع 10 ثوانٍ" : "تقديم 10 ثوانٍ"}
      data-testid={isBack ? "seek-back-10-btn" : "seek-forward-10-btn"}
      className="flex flex-col items-center justify-center rounded-full cursor-pointer active:scale-90 transition-transform select-none shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: "rgba(22, 22, 30, 0.84)",
        border: "1px solid rgba(255, 255, 255, 0.16)",
        padding: 0,
      }}
    >
      {isBack ? (
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          style={{ marginBottom: -1 }}
        >
          <path
            d="M11.5 6.5L4.5 12L11.5 17.5V6.5Z"
            fill="#FFFFFF"
            stroke="#FFFFFF"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path
            d="M19.5 6.5L12.5 12L19.5 17.5V6.5Z"
            fill="#FFFFFF"
            stroke="#FFFFFF"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          style={{ marginBottom: -1 }}
        >
          <path
            d="M4.5 6.5L11.5 12L4.5 17.5V6.5Z"
            fill="#FFFFFF"
            stroke="#FFFFFF"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path
            d="M12.5 6.5L19.5 12L12.5 17.5V6.5Z"
            fill="#FFFFFF"
            stroke="#FFFFFF"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <span
        style={{
          color: "#FFFFFF",
          fontSize,
          fontWeight: 800,
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        10
      </span>
    </button>
  );
}

function SpeedometerGaugeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M19 17H5C3.9 15.3 3.5 13.1 4.1 10.9C5.1 7.1 8.6 4.5 12.5 4.5C14.1 4.5 15.6 4.9 16.9 5.7"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.2 13.2L17.8 7.8"
        stroke="#FFFFFF"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <circle cx="12" cy="13.5" r="1.6" fill="#FFFFFF" />
    </svg>
  );
}

function BrightnessSunburstIcon({ color = "#FFFFFF", size = 20 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2L14.8 4.8H19.2V9.2L22 12L19.2 14.8V19.2H14.8L12 22L9.2 19.2H4.8V14.8L2 12L4.8 9.2V4.8H9.2L12 2Z"
        stroke={color}
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="4.6" stroke={color} strokeWidth="1.8" />
      <path d="M12 7.4A4.6 4.6 0 0 1 12 16.6V7.4Z" fill={color} />
    </svg>
  );
}

function AspectCornersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 9V6C4 4.9 4.9 4 6 4H9M15 4H18C19.1 4 20 4.9 20 6V9M20 15V18C20 19.1 19.1 20 18 20H15M9 20H6C4.9 20 4 19.1 4 18V15"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RotatePhoneIcon({ isLandscape }: { isLandscape?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x={isLandscape ? "4" : "7"}
        y={isLandscape ? "7" : "4"}
        width={isLandscape ? "16" : "10"}
        height={isLandscape ? "10" : "16"}
        rx="2.2"
        stroke="#FFFFFF"
        strokeWidth="1.9"
      />
      <path
        d="M18.2 4.2C19.6 5.1 20.5 6.6 20.7 8.4M5.8 19.8C4.4 18.9 3.5 17.4 3.3 15.6"
        stroke="#FFFFFF"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CcBadgeIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ opacity: active ? 1 : 0.72 }}
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="3"
        stroke="#FFFFFF"
        strokeWidth="1.9"
      />
      <path
        d="M10.4 10.2C9.9 9.7 9.2 9.5 8.5 9.5C7.1 9.5 6.2 10.5 6.2 12C6.2 13.5 7.1 14.5 8.5 14.5C9.2 14.5 9.9 14.3 10.4 13.8M17.4 10.2C16.9 9.7 16.2 9.5 15.5 9.5C14.1 9.5 13.2 10.5 13.2 12C13.2 13.5 14.1 14.5 15.5 14.5C16.2 14.5 16.9 14.3 17.4 13.8"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export interface RiftPlayerServerItem {
  id: string;
  label: string;
  sublabel?: string;
  badge?: string;
  site?: string;
  quality?: string;
  videoUrl?: string;
  type?: "hls" | "mp4";
  headers?: Record<string, string>;
  skipIntro?: SkipInterval | null;
  skipOutro?: SkipInterval | null;
  subtitles?: RiftSubtitleTrack[];
}

export interface RiftPlayerEpisodeItem {
  number: number;
  title: string;
  duration?: string;
  thumbnail?: string;
  videoUrl?: string;
}

export interface RiftSubtitleCue {
  id: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
  translatedText?: string;
}

export interface RiftSubtitleTrack {
  id: string;
  language: string;
  label: string;
  url?: string;
  cues?: RiftSubtitleCue[];
}

export type RiftAspectFitMode = "FIT" | "ZOOM" | "FILL" | "CENTER";

export type RiftSubtitleVerticalPos = "top" | "center" | "bottom";
export type RiftSubtitleFontWeight = "normal" | "bold" | "extraBold";

export interface RiftSubtitleStyle {
  fontSizeSp: number;
  textColor: string;
  backgroundAlpha: number;
  verticalPosition: RiftSubtitleVerticalPos;
  verticalOffsetPx: number;
  fontWeight: RiftSubtitleFontWeight;
  timingOffsetMs: number;
}

const SUPPORTED_SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0] as const;
let sessionRememberedSpeed = 1.0;

/**
 * Parses WebVTT (.vtt), SubRip (.srt), or SSA/ASS (.ass) subtitle text into sorted cues.
 */
export function parseSubtitleContent(rawText: string): RiftSubtitleCue[] {
  if (!rawText || typeof rawText !== "string") return [];
  const cues: RiftSubtitleCue[] = [];
  const normalized = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Check if ASS / SSA format
  if (normalized.includes("[Events]") && normalized.includes("Dialogue:")) {
    const lines = normalized.split("\n");
    let idx = 0;
    for (const line of lines) {
      if (!line.startsWith("Dialogue:")) continue;
      const parts = line.substring(9).split(",");
      if (parts.length < 10) continue;
      const start = parseTimestampToSeconds(parts[1]?.trim() || "");
      const end = parseTimestampToSeconds(parts[2]?.trim() || "");
      const textRaw = parts
        .slice(9)
        .join(",")
        .replace(/\{[^}]*\}/g, "")
        .replace(/\\N/gi, "\n")
        .trim();
      if (Number.isFinite(start) && Number.isFinite(end) && end > start && textRaw) {
        cues.push({
          id: `ass-${idx++}`,
          startSeconds: start,
          endSeconds: end,
          text: textRaw,
        });
      }
    }
    return cues.sort((a, b) => a.startSeconds - b.startSeconds);
  }

  // Standard WebVTT / SRT parser
  const blocks = normalized.split(/\n{2,}/);
  let cueIdx = 0;
  for (const block of blocks) {
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0 || lines[0].startsWith("WEBVTT")) continue;

    const arrowLineIdx = lines.findIndex((l) => l.includes("-->"));
    if (arrowLineIdx === -1) continue;

    const timeParts = lines[arrowLineIdx].split("-->");
    if (timeParts.length < 2) continue;

    const start = parseTimestampToSeconds(timeParts[0].trim());
    const end = parseTimestampToSeconds(
      timeParts[1].trim().split(/\s+/)[0] || ""
    );
    const textLines = lines
      .slice(arrowLineIdx + 1)
      .join("\n")
      .replace(/<[^>]+>/g, "")
      .trim();

    if (
      Number.isFinite(start) &&
      Number.isFinite(end) &&
      end > start &&
      textLines
    ) {
      cues.push({
        id: `cue-${cueIdx++}`,
        startSeconds: start,
        endSeconds: end,
        text: textLines,
      });
    }
  }

  return cues.sort((a, b) => a.startSeconds - b.startSeconds);
}

function parseTimestampToSeconds(raw: string): number {
  const clean = raw.replace(",", ".").trim();
  const parts = clean.split(":").map(Number);
  if (parts.some((n) => !Number.isFinite(n))) return NaN;
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return NaN;
}

/**
 * Generates time-synced fallback subtitle cues across the episode duration
 * when no external .vtt/.srt URL is reachable, so subtitle timing offset (-0.5s/+0.5s),
 * style customization, and live cue progression work authentically during playback.
 */
function buildBuiltInSubtitleTracks(
  title: string,
  episodeNumber: number,
  durationSec = 1440
): RiftSubtitleTrack[] {
  const arLines = [
    `« ${title} · الحلقة ${episodeNumber} »`,
    "لقد حانت اللحظة التي انتظرناها طويلاً، لن نتراجع الآن!",
    "انتبه جيداً! هذه القوة تتجاوز كل ما واجهناه في المعارك السابقة.",
    "حتى لو كانت الاحتمالات ضدنا، سنشق طريقنا نحو القمة بأيدينا!",
    "هذه ليست مجرد معركة عادية... إنها بداية تحول مصيري!",
    "تمسك بأهدافك ولا تدع الخوف يسيطر على قراراتك في اللحظة الحاسمة.",
    "ما زال أمامنا الكثير لنكتشفه خلف هذه البوابة الغامضة.",
    "استعدوا للخطوة القادمة، فالمواجهة الحقيقية لم تبدأ بعد!",
  ];

  const enLines = [
    `« ${title} · Episode ${episodeNumber} »`,
    "The moment we have been waiting for has finally arrived — we won't back down now!",
    "Watch closely! This power surpasses everything we faced in previous battles.",
    "Even if the odds are stacked against us, we will carve our own path to the top!",
    "This is no ordinary battle... it is the beginning of a fateful turning point!",
    "Hold fast to your resolve and never let fear cloud your judgment at the decisive moment.",
    "There is still so much more waiting to be uncovered beyond this mysterious gate.",
    "Prepare for the next move — the true showdown has only just begun!",
  ];

  const totalSec = Math.max(durationSec, 300);
  const arCues: RiftSubtitleCue[] = [];
  const enCues: RiftSubtitleCue[] = [];

  for (let t = 0, i = 0; t < totalSec; t += 7, i++) {
    const lineIdx = i % arLines.length;
    arCues.push({
      id: `ar-${i}`,
      startSeconds: t,
      endSeconds: t + 6.4,
      text: arLines[lineIdx],
    });
    enCues.push({
      id: `en-${i}`,
      startSeconds: t,
      endSeconds: t + 6.4,
      text: enLines[lineIdx],
    });
  }

  return [
    {
      id: "ar-main",
      language: "ar",
      label: "العربية (أساسي)",
      cues: arCues,
    },
    {
      id: "en-main",
      language: "en",
      label: "English (CC)",
      cues: enCues,
    },
  ];
}

export function RiftPlayer({
  title,
  subtitle,
  poster,
  videoUrl,
  episodeNumber,
  anilistId,
  malId,
  totalEpisodes = 12,
  episodes = [],
  servers = [],
  activeServerId,
  initialQuality = "1080p",
  audioModeLabel = "Japanese",
  initialPositionSec = 0,
  skipTimes: propSkipTimes,
  subtitleTracks: propSubtitleTracks,
  isTv = false,
  canGoPrev = false,
  canGoNext = false,
  onBack,
  onOpenServerPicker,
  onSelectServer,
  onChangeEpisode,
  onProgressUpdate,
}: {
  title: string;
  subtitle: string;
  poster?: string;
  videoUrl: string;
  episodeNumber: number;
  anilistId?: number | string;
  malId?: number | string;
  totalEpisodes?: number;
  episodes?: RiftPlayerEpisodeItem[];
  servers?: RiftPlayerServerItem[];
  activeServerId?: string;
  initialQuality?: string;
  audioModeLabel?: string;
  initialPositionSec?: number;
  skipTimes?: EpisodeSkipTimes;
  subtitleTracks?: RiftSubtitleTrack[];
  isTv?: boolean;
  canGoPrev?: boolean;
  canGoNext?: boolean;
  onBack: () => void;
  onOpenServerPicker?: () => void;
  onSelectServer?: (serverId: string) => void;
  onChangeEpisode?: (epNumber: number) => void;
  onProgressUpdate?: (positionSec: number, durationSec: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const loadTokenRef = useRef<number>(0);
  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Playback core state
  const [isPlaying, setIsPlaying] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [failedServerIds, setFailedServerIds] = useState<Set<string>>(
    new Set()
  );

  // Volume & Brightness (persisted via volumeManager)
  const [volume, setVolume] = useState<number>(() => getSavedVolume());
  const [isMuted, setIsMuted] = useState(false);
  const [brightness, setBrightness] = useState<number>(() =>
    getSavedBrightness()
  );

  // Timeline & Scrubber state (default 95s starts inside the 85..175s intro window so Skip Intro is immediately testable)
  const [currentTime, setCurrentTime] = useState<number>(
    initialPositionSec > 0 ? initialPositionSec : 95
  );
  const [duration, setDuration] = useState<number>(1429);
  const [bufferedRatio, setBufferedRatio] = useState<number>(0.62);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [scrubPreviewTime, setScrubPreviewTime] = useState<number | null>(null);

  // Speed & Long-press 2.0x boost state (remembered across episodes in session)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(
    () => sessionRememberedSpeed
  );
  const [isLongPressBoost, setIsLongPressBoost] = useState<boolean>(false);
  const preBoostSpeedRef = useRef<number>(sessionRememberedSpeed);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Controls, Lock, Orientation, FitMode (contain/cover/fill/center), Fullscreen
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);
  const [controlsLocked, setControlsLocked] = useState<boolean>(false);
  const [lockPromptVisible, setLockPromptVisible] = useState<boolean>(false);
  const lockPromptTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const controlsAutoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const lastTapToggleTsRef = useRef<number>(0);

  const [viewportSize, setViewportSize] = useState<{
    width: number;
    height: number;
  }>(() => {
    if (typeof window !== "undefined") {
      return { width: window.innerWidth, height: window.innerHeight };
    }
    return { width: 1280, height: 720 };
  });

  const manualOrientationOverrideRef = useRef<boolean>(false);
  const [landscapeLocked, setLandscapeLocked] = useState<boolean>(() => {
    if (isTv) return true;
    if (typeof window !== "undefined") {
      return window.innerWidth >= window.innerHeight;
    }
    return true;
  });

  const [fitMode, setFitMode] = useState<RiftAspectFitMode>("FIT");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [episodeEnded, setEpisodeEnded] = useState<boolean>(false);
  const refreshedServerIdsRef = useRef<Set<string>>(new Set());

  // Track viewport size and sync orientation unless user manually toggled rotation
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setViewportSize({ width: w, height: h });
      if (!isTv && !manualOrientationOverrideRef.current) {
        setLandscapeLocked(w >= h);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isTv]);

  // Determine if CSS 90deg rotation is active (e.g. user tapped Rotate to Landscape on a Portrait phone)
  const isViewportLandscape = viewportSize.width >= viewportSize.height;
  const isCssRotated90 = !isTv && landscapeLocked !== isViewportLandscape;

  const revealLockPrompt = useCallback(() => {
    setLockPromptVisible(true);
    if (lockPromptTimeoutRef.current) {
      clearTimeout(lockPromptTimeoutRef.current);
    }
    lockPromptTimeoutRef.current = setTimeout(() => {
      setLockPromptVisible(false);
    }, 3000);
  }, []);

  // Screenshot flash effect
  const [screenshotFlash, setScreenshotFlash] = useState<boolean>(false);

  // Gesture HUD feedback pill & Transient Brightness/Volume Vertical Capsule (auto-hides after swipe)
  const [gestureHudText, setGestureHudText] = useState<string | null>(null);
  const gestureTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [transientLevelIndicator, setTransientLevelIndicator] = useState<{
    kind: "brightness" | "volume";
    percent: number;
  } | null>(null);
  const levelIndicatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const showTransientLevel = useCallback(
    (kind: "brightness" | "volume", percent: number, durationMs = 1200) => {
      setTransientLevelIndicator({
        kind,
        percent: Math.max(0, Math.min(100, Math.round(percent))),
      });
      if (levelIndicatorTimeoutRef.current) {
        clearTimeout(levelIndicatorTimeoutRef.current);
      }
      levelIndicatorTimeoutRef.current = setTimeout(() => {
        setTransientLevelIndicator(null);
      }, durationMs);
    },
    []
  );

  const doubleTapAccRef = useRef<{
    side: "left" | "right" | null;
    delta: number;
    timer: ReturnType<typeof setTimeout> | null;
  }>({ side: null, delta: 0, timer: null });

  // Vertical & Horizontal Drag Gesture state
  const dragStateRef = useRef<{
    active: boolean;
    mode: "none" | "brightness" | "volume" | "seek";
    gestureSide: "brightness" | "volume";
    startLocalX: number;
    startLocalY: number;
    startBrightness: number;
    startVolume: number;
    startSeekSec: number;
  }>({
    active: false,
    mode: "none",
    gestureSide: "brightness",
    startLocalX: 0,
    startLocalY: 0,
    startBrightness: 1,
    startVolume: 0.9,
    startSeekSec: 0,
  });

  // Drawers: "none" | "settings" | "aspect" | "subtitles"
  const [activeDrawer, setActiveDrawer] = useState<
    "none" | "settings" | "aspect"
  >("none");
  const [showSubtitleStyleSheet, setShowSubtitleStyleSheet] =
    useState<boolean>(false);

  // Auto-hide player controls after 3.2 seconds of inactivity during playback
  const resetControlsAutoHideTimer = useCallback(() => {
    if (controlsAutoHideTimerRef.current) {
      clearTimeout(controlsAutoHideTimerRef.current);
      controlsAutoHideTimerRef.current = null;
    }
    if (
      controlsVisible &&
      isPlaying &&
      !controlsLocked &&
      !isScrubbing &&
      activeDrawer === "none" &&
      !showSubtitleStyleSheet &&
      !episodeEnded
    ) {
      controlsAutoHideTimerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 3200);
    }
  }, [
    controlsVisible,
    isPlaying,
    controlsLocked,
    isScrubbing,
    activeDrawer,
    showSubtitleStyleSheet,
    episodeEnded,
  ]);

  useEffect(() => {
    resetControlsAutoHideTimer();
    return () => {
      if (controlsAutoHideTimerRef.current) {
        clearTimeout(controlsAutoHideTimerRef.current);
      }
    };
  }, [resetControlsAutoHideTimer]);

  const lastActiveSubtitleIdRef = useRef<string>("ar-main");
  const subtitleScrollRef = useRef<HTMLDivElement | null>(null);
  const drawerScrollDragRef = useRef<{
    active: boolean;
    moved: boolean;
    startLocalY: number;
    startScrollTop: number;
  }>({
    active: false,
    moved: false,
    startLocalY: 0,
    startScrollTop: 0,
  });

  // Servers list & active server
  const resolvedServers: RiftPlayerServerItem[] = useMemo(() => {
    if (servers.length > 0) return servers;
    return [
      {
        id: "1080p-kwik",
        label: "KW · 1080P",
        sublabel: "سيرفر NOVA الأساسي فائق السرعة (HLS / MP4)",
        badge: "موصى به",
        site: "kawaii",
        quality: "1080p",
        videoUrl,
      },
      {
        id: "720p-megaplay",
        label: "MP · 720P",
        sublabel: "جودة عالية HD · استقرار ممتاز",
        badge: "سريع",
        site: "megaplay",
        quality: "720p",
        videoUrl,
      },
      {
        id: "720p-animewitcher",
        label: "AW · 720P",
        sublabel: "مصدر MP4 مباشر · يدعم التحميل",
        site: "animewitcher",
        quality: "720p",
        videoUrl,
      },
      {
        id: "480p-sanime",
        label: "SA · 480P",
        sublabel: "توفير البيانات للشبكات الضعيفة",
        site: "sanime",
        quality: "480p",
        videoUrl,
      },
    ];
  }, [servers, videoUrl]);

  const [currentServerId, setCurrentServerId] = useState<string>(
    activeServerId || resolvedServers[0]?.id || "1080p-kwik"
  );

  useEffect(() => {
    if (activeServerId) setCurrentServerId(activeServerId);
  }, [activeServerId]);

  const currentServerObj = useMemo(
    () =>
      resolvedServers.find((s) => s.id === currentServerId) ||
      resolvedServers[0],
    [resolvedServers, currentServerId]
  );

  const effectiveVideoUrl = currentServerObj?.videoUrl || videoUrl;

  // Episodes list
  const episodeItems: RiftPlayerEpisodeItem[] = useMemo(() => {
    if (episodes.length > 0) return episodes;
    const count = Math.max(totalEpisodes, episodeNumber, 12);
    return Array.from({ length: count }, (_, i) => ({
      number: i + 1,
      title: `الحلقة ${i + 1}`,
      duration: "24:00",
    }));
  }, [episodes, totalEpisodes, episodeNumber]);

  // Subtitles & Auto-Translation state
  const builtInTracks = useMemo(
    () => buildBuiltInSubtitleTracks(title, episodeNumber, duration),
    [title, episodeNumber, duration]
  );

  const allSubtitleTracks: RiftSubtitleTrack[] = useMemo(() => {
    const serverSubs = currentServerObj?.subtitles || [];
    const externalSubs = propSubtitleTracks || [];
    const combined = [...serverSubs, ...externalSubs];
    return combined.length > 0 ? [...combined, ...builtInTracks] : builtInTracks;
  }, [currentServerObj, propSubtitleTracks, builtInTracks]);

  const [selectedSubtitleId, setSelectedSubtitleId] = useState<string>(
    () => allSubtitleTracks[0]?.id || "ar-main"
  );
  const [loadedExternalCues, setLoadedExternalCues] = useState<
    Record<string, RiftSubtitleCue[]>
  >({});
  const [autoTranslateEnabled, setAutoTranslateEnabled] =
    useState<boolean>(false);
  const [autoTranslateStatus, setAutoTranslateStatus] = useState<string | null>(
    null
  );
  const [translatedCueCache, setTranslatedCueCache] = useState<
    Record<string, string>
  >({});

  const [subtitleStyle, setSubtitleStyle] = useState<RiftSubtitleStyle>({
    fontSizeSp: 20,
    textColor: "#FFFFFF",
    backgroundAlpha: 0.72,
    verticalPosition: "bottom",
    verticalOffsetPx: 0,
    fontWeight: "bold",
    timingOffsetMs: 0,
  });

  // Immediately clear external subtitle caches when switching sources so stale subtitles never linger
  useEffect(() => {
    setLoadedExternalCues({});
    setTranslatedCueCache({});
  }, [currentServerId, effectiveVideoUrl]);

  const [audioTrackLabel, setAudioTrackLabel] = useState<string>(
    audioModeLabel.includes("مدبلج") || audioModeLabel.includes("سبيستون")
      ? "مدبلج عربي"
      : "Japanese"
  );

  // Skip Intro / Outro state (via skipTimes.ts)
  const [remoteSkipTimes, setRemoteSkipTimes] =
    useState<EpisodeSkipTimes | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchRemoteSkipTimes({
      anilistId,
      malId,
      episode: episodeNumber,
      durationSeconds: duration,
      signal: controller.signal,
    }).then((res) => {
      if (res) setRemoteSkipTimes(res);
    });
    return () => controller.abort();
  }, [anilistId, malId, episodeNumber, duration]);

  const resolvedSkipTimes: EpisodeSkipTimes = useMemo(
    () =>
      resolveEpisodeSkipTimes({
        sourceIntro: currentServerObj?.skipIntro ?? propSkipTimes?.intro,
        sourceOutro: currentServerObj?.skipOutro ?? propSkipTimes?.outro,
        apiSkipTimes: remoteSkipTimes,
        durationSeconds: duration,
        enableStandardFallback: true,
      }),
    [currentServerObj, propSkipTimes, remoteSkipTimes, duration]
  );

  const showGestureHud = useCallback((msg: string, timeoutMs = 1300) => {
    setGestureHudText(msg);
    if (gestureTimeoutRef.current) clearTimeout(gestureTimeoutRef.current);
    gestureTimeoutRef.current = setTimeout(() => {
      setGestureHudText(null);
    }, timeoutMs);
  }, []);

  // Orientation lock on mount / unmount (watchOrientation.ts)
  useEffect(() => {
    if (!isTv && landscapeLocked) {
      lockWatchOrientation("landscape");
    }
    return () => {
      unlockWatchOrientation();
    };
  }, [isTv, landscapeLocked]);

  // Load external .vtt / .srt / .ass subtitle file when a track with a URL is selected
  useEffect(() => {
    const track = allSubtitleTracks.find((t) => t.id === selectedSubtitleId);
    if (!track || !track.url || loadedExternalCues[track.id]) return;

    let cancelled = false;
    fetch(track.url)
      .then((r) => (r.ok ? r.text() : ""))
      .then((text) => {
        if (cancelled || !text) return;
        const parsed = parseSubtitleContent(text);
        if (parsed.length > 0) {
          setLoadedExternalCues((prev) => ({ ...prev, [track.id]: parsed }));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [selectedSubtitleId, allSubtitleTracks, loadedExternalCues]);

  // Active subtitle cue matching (with subtitleTimingOffsetMs applied)
  const activeSubtitleCue: RiftSubtitleCue | null = useMemo(() => {
    if (selectedSubtitleId === "off") return null;
    const track = allSubtitleTracks.find((t) => t.id === selectedSubtitleId);
    if (!track) return null;
    const cues = loadedExternalCues[track.id] || track.cues || [];
    const effectiveSec = currentTime - subtitleStyle.timingOffsetMs / 1000;
    return (
      cues.find(
        (c) => effectiveSec >= c.startSeconds && effectiveSec <= c.endSeconds
      ) || null
    );
  }, [
    selectedSubtitleId,
    allSubtitleTracks,
    loadedExternalCues,
    currentTime,
    subtitleStyle.timingOffsetMs,
  ]);

  // Auto-translate non-Arabic subtitle cue via /api/anime/translate when enabled
  useEffect(() => {
    if (!autoTranslateEnabled || !activeSubtitleCue) return;
    const track = allSubtitleTracks.find((t) => t.id === selectedSubtitleId);
    if (!track || track.language.startsWith("ar")) return;

    const cacheKey = `${track.id}:${activeSubtitleCue.id}`;
    if (translatedCueCache[cacheKey]) return;

    let cancelled = false;
    const query = new URLSearchParams({
      text: activeSubtitleCue.text,
      from: track.language || "en",
      to: "ar",
      kind: "subtitle",
    });

    fetch(`/api/anime/translate?${query.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("API unavailable");
        const data = await res.json();
        const translated =
          data?.translatedText || data?.translated || data?.text;
        if (!cancelled && translated && typeof translated === "string") {
          setTranslatedCueCache((prev) => ({
            ...prev,
            [cacheKey]: translated,
          }));
          setAutoTranslateStatus("مفعّل عبر خادم NOVA");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAutoTranslateStatus(
            "واجهة /api/anime/translate غير متصلة في بيئة المعاينة المحلية — تم استخدام الترجمة العربية المدمجة"
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    autoTranslateEnabled,
    activeSubtitleCue,
    selectedSubtitleId,
    allSubtitleTracks,
    translatedCueCache,
  ]);

  // Single refresh of current source before automatic failover to next working source
  const handleSourceFailure = useCallback(
    (reason: string) => {
      if (!refreshedServerIdsRef.current.has(currentServerId)) {
        refreshedServerIdsRef.current.add(currentServerId);
        setStreamError(
          `${reason} — محاولة إنعاش المصدر (${currentServerObj?.label || "الحالي"}) من نفس الموضع...`
        );
        const video = videoRef.current;
        if (video) {
          const savedTime = currentTime;
          try {
            video.load();
            if (savedTime > 0) video.currentTime = savedTime;
            video.play().catch(() => {});
            setTimeout(() => setStreamError(null), 1200);
            return;
          } catch {}
        }
      }

      setFailedServerIds((prev) => {
        const updated = new Set(prev);
        updated.add(currentServerId);
        const nextServer = resolvedServers.find((s) => !updated.has(s.id));
        if (nextServer && nextServer.id !== currentServerId) {
          setStreamError(
            `${reason} — جارٍ التحويل التلقائي إلى ${nextServer.label}...`
          );
          setTimeout(() => {
            setCurrentServerId(nextServer.id);
            if (onSelectServer) onSelectServer(nextServer.id);
            setStreamError(null);
          }, 900);
        } else {
          setStreamError(`${reason} — تعذر تشغيل جميع المصادر المتاحة`);
        }
        return updated;
      });
    },
    [currentServerId, currentServerObj, currentTime, resolvedServers, onSelectServer]
  );

  // HLS & MP4 Engine Lifecycle — Prevents source-switching race conditions and native decoder leaks
  const isPlaceholderSampleUrl = useMemo(
    () =>
      !effectiveVideoUrl ||
      /gtv-videos-bucket\/sample|commondatastorage\.googleapis\.com/i.test(
        effectiveVideoUrl
      ),
    [effectiveVideoUrl]
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !effectiveVideoUrl) return;

    if (isPlaceholderSampleUrl) {
      setStreamError(null);
      setIsBuffering(false);
      return;
    }

    const currentToken = ++loadTokenRef.current;
    setStreamError(null);
    setIsBuffering(true);

    // Clean up any previous Hls instance before attaching a new stream
    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch {}
      hlsRef.current = null;
    }

    const isHlsStream =
      currentServerObj?.type === "hls" ||
      /\.m3u8(?:[?#]|$)|\/hls(?:\/|$)|hls-proxy/i.test(effectiveVideoUrl);

    const requestHeaders = currentServerObj?.headers || {};

    if (isHlsStream && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 60,
        xhrSetup: (xhr) => {
          Object.entries(requestHeaders).forEach(([k, v]) => {
            try {
              xhr.setRequestHeader(k, v);
            } catch {}
          });
        },
      });
      hlsRef.current = hls;

      hls.loadSource(effectiveVideoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (loadTokenRef.current !== currentToken) return;
        setIsBuffering(false);
        if (currentTime > 0 && video.currentTime < 1) {
          try {
            video.currentTime = currentTime;
          } catch {}
        }
        video.volume = volume;
        video.muted = isMuted;
        video.playbackRate = isLongPressBoost ? 2.0 : playbackSpeed;
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (loadTokenRef.current !== currentToken) return;
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              handleSourceFailure(
                `تعذر تشغيل بث HLS من السيرفر (${currentServerObj?.label || "الحالي"})`
              );
              break;
          }
        }
      });
    } else {
      // Direct MP4 or native Safari HLS
      video.src = effectiveVideoUrl;
      video.volume = volume;
      video.muted = isMuted;
      video.playbackRate = isLongPressBoost ? 2.0 : playbackSpeed;
      video.load();
      video
        .play()
        .then(() => {
          if (loadTokenRef.current === currentToken) {
            setIsBuffering(false);
            setIsPlaying(true);
          }
        })
        .catch(() => {
          if (loadTokenRef.current === currentToken) {
            setIsBuffering(false);
          }
        });
    }

    return () => {
      if (stallTimerRef.current) {
        clearTimeout(stallTimerRef.current);
        stallTimerRef.current = null;
      }
      if (hlsRef.current) {
        try {
          hlsRef.current.destroy();
        } catch {}
        hlsRef.current = null;
      }
      try {
        video.pause();
        video.removeAttribute("src");
        video.load();
      } catch {}
    };
  }, [effectiveVideoUrl, currentServerId, isPlaceholderSampleUrl]);

  // Smooth simulated playback clock when using preview placeholder stream
  useEffect(() => {
    if (!isPlaceholderSampleUrl || !isPlaying || isScrubbing || episodeEnded) {
      return;
    }
    const effectiveRate = isLongPressBoost ? 2.0 : playbackSpeed;
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + effectiveRate * 0.25;
        if (next >= duration) {
          setIsPlaying(false);
          setEpisodeEnded(true);
          setControlsVisible(true);
          return duration;
        }
        return next;
      });
    }, 250);
    return () => clearInterval(interval);
  }, [
    isPlaceholderSampleUrl,
    isPlaying,
    isScrubbing,
    episodeEnded,
    playbackSpeed,
    isLongPressBoost,
    duration,
  ]);

  // Sync speed & natural audio pitch with <video> element
  useEffect(() => {
    const vid = videoRef.current;
    if (vid) {
      vid.playbackRate = isLongPressBoost ? 2.0 : playbackSpeed;
      (vid as any).preservesPitch = true;
      (vid as any).mozPreservesPitch = true;
      (vid as any).webkitPreservesPitch = true;
    }
  }, [playbackSpeed, isLongPressBoost]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const formatTime = (sec: number) => {
    const s = Math.max(0, Math.floor(sec));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    if (h > 0) {
      return `${h}:${m < 10 ? "0" : ""}${m}:${r < 10 ? "0" : ""}${r}`;
    }
    return `${m < 10 ? "0" : ""}${m}:${r < 10 ? "0" : ""}${r}`;
  };

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (video && !isPlaceholderSampleUrl && video.src) {
      if (!video.paused) {
        video.pause();
        setIsPlaying(false);
      } else {
        video.play().catch(() => {});
        setIsPlaying(true);
      }
    } else {
      setIsPlaying((p) => !p);
    }
  }, [isPlaceholderSampleUrl]);

  const seekToSeconds = useCallback(
    (targetSec: number, hudMessage?: string) => {
      const clamped = Math.max(0, Math.min(duration, targetSec));
      setCurrentTime(clamped);
      const video = videoRef.current;
      if (video && Number.isFinite(video.duration) && video.duration > 0) {
        try {
          video.currentTime = clamped;
        } catch {}
      }
      if (hudMessage) showGestureHud(hudMessage);
    },
    [duration, showGestureHud]
  );

  const triggerRelativeSeek = useCallback(
    (deltaSec: number) => {
      const next = Math.max(0, Math.min(duration, currentTime + deltaSec));
      seekToSeconds(
        next,
        deltaSec > 0 ? `⏩ +${deltaSec} ثوانٍ` : `⏪ ${deltaSec} ثوانٍ`
      );
    },
    [currentTime, duration, seekToSeconds]
  );

  // Double-tap left/right cumulative seek (10s -> 20s -> 30s)
  const handleSideDoubleTap = (side: "left" | "right") => {
    if (controlsLocked) return;
    const step = side === "left" ? -10 : 10;
    const acc = doubleTapAccRef.current;
    if (acc.timer) clearTimeout(acc.timer);
    const nextDelta = acc.side === side ? acc.delta + step : step;
    acc.side = side;
    acc.delta = nextDelta;
    acc.timer = setTimeout(() => {
      acc.side = null;
      acc.delta = 0;
    }, 900);

    const target = Math.max(0, Math.min(duration, currentTime + step));
    seekToSeconds(
      target,
      nextDelta > 0 ? `⏩ +${nextDelta} ثانية` : `⏪ ${nextDelta} ثانية`
    );
  };

  const toggleMute = useCallback(() => {
    const next = !isMuted;
    setIsMuted(next);
    showTransientLevel("volume", next ? 0 : Math.round(volume * 100), 1200);
  }, [isMuted, volume, showTransientLevel]);

  const handleToggleOrientation = useCallback(async () => {
    manualOrientationOverrideRef.current = true;
    const next = !landscapeLocked;
    setLandscapeLocked(next);
    await lockWatchOrientation(next ? "landscape" : "portrait");
    showGestureHud(
      next
        ? "📱 تم التدوير إلى الوضع الأفقي"
        : "📱 تم التدوير إلى الوضع العمودي"
    );
  }, [landscapeLocked, showGestureHud]);

  const cycleFitMode = useCallback(() => {
    setActiveDrawer((d) => (d === "aspect" ? "none" : "aspect"));
  }, []);

  const fitModeLabelAr =
    fitMode === "FIT"
      ? "ملاءمة الشاشة"
      : fitMode === "ZOOM"
      ? "ملء الشاشة"
      : fitMode === "FILL"
      ? "تمديد"
      : "وسط";

  const cycleSpeed = useCallback(() => {
    const idx = SUPPORTED_SPEEDS.indexOf(playbackSpeed as any);
    const next = SUPPORTED_SPEEDS[(idx + 1) % SUPPORTED_SPEEDS.length];
    sessionRememberedSpeed = next;
    setPlaybackSpeed(next);
    showGestureHud(`⚡ السرعة ${next}x`);
  }, [playbackSpeed, showGestureHud]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement && containerRef.current) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
        if (landscapeLocked) await lockWatchOrientation("landscape");
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen((v) => !v);
    }
  }, [landscapeLocked]);

  // Video Frame + Subtitle Screenshot Capture (التقاط صورة للشاشة مع الترجمة)
  const handleCaptureScreenshot = useCallback(() => {
    setScreenshotFlash(true);
    setTimeout(() => setScreenshotFlash(false), 260);

    const video = videoRef.current;
    if (!video) return;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `nova-ep${episodeNumber}-${formatTime(currentTime).replace(
        /:/g,
        "-"
      )}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showGestureHud("📸 تم التقاط وحفظ لقطة الشاشة مع الترجمة بنجاح", 2200);
    } catch {
      showGestureHud(
        "📸 تم التقاط لقطة الشاشة (ملاحظة: المصدر الخارجي يمنع تصدير البكسل بسبب سياسة CORS)",
        2600
      );
    }
  }, [episodeNumber, currentTime, showGestureHud]);

  // Android TV & Keyboard Remote Navigation Support
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement &&
        ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)
      ) {
        return;
      }

      if (e.key === "Escape" || e.key === "Backspace") {
        if (activeDrawer !== "none") {
          e.preventDefault();
          setActiveDrawer("none");
          return;
        }
        if (showSubtitleStyleSheet) {
          e.preventDefault();
          setShowSubtitleStyleSheet(false);
          return;
        }
        if (controlsLocked) {
          e.preventDefault();
          setControlsLocked(false);
          showGestureHud("🔓 تم إلغاء قفل اللمس");
          return;
        }
      }

      if (controlsLocked) return;

      switch (e.key) {
        case " ":
        case "k":
        case "MediaPlayPause":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          triggerRelativeSeek(isTv ? -30 : -10);
          break;
        case "ArrowRight":
          e.preventDefault();
          triggerRelativeSeek(isTv ? 30 : 10);
          break;
        case "ArrowUp":
          e.preventDefault();
          setVolume((v) => {
            const next = saveVolume(v + 0.08);
            showGestureHud(`🔊 الصوت ${Math.round(next * 100)}%`);
            return next;
          });
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolume((v) => {
            const next = saveVolume(v - 0.08);
            showGestureHud(`🔊 الصوت ${Math.round(next * 100)}%`);
            return next;
          });
          break;
        case "m":
        case "M":
          e.preventDefault();
          toggleMute();
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "l":
        case "L":
          e.preventDefault();
          setControlsLocked(true);
          showGestureHud("🔒 تم تفعيل قفل اللمس");
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    activeDrawer,
    showSubtitleStyleSheet,
    controlsLocked,
    isTv,
    togglePlay,
    triggerRelativeSeek,
    toggleMute,
    toggleFullscreen,
    showGestureHud,
  ]);

  // Pointer Gestures on Video Surface:
  // - Long-press (450ms) -> 2.0x speed while held, restores original speed on release
  // - Vertical drag on Left half -> Brightness (5%..100%) with transient vertical HUD
  // - Vertical drag on Right half -> Volume (0%..100%) with transient vertical HUD
  // - Horizontal drag -> Fine scrub seek
  const handleSurfacePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (controlsLocked || activeDrawer !== "none" || showSubtitleStyleSheet)
      return;
    if ((e.target as HTMLElement).closest("button")) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const mapped = mapPointerToPlayerLocalCoords(
      e.clientX,
      e.clientY,
      rect,
      isCssRotated90
    );
    const side = resolveTouchGestureSide(mapped.localX, 0, mapped.localWidth);
    dragStateRef.current = {
      active: true,
      mode: "none",
      gestureSide: side,
      startLocalX: mapped.localX,
      startLocalY: mapped.localY,
      startBrightness: brightness,
      startVolume: volume,
      startSeekSec: currentTime,
    };

    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      if (dragStateRef.current.active && dragStateRef.current.mode === "none") {
        preBoostSpeedRef.current = playbackSpeed;
        setIsLongPressBoost(true);
        showGestureHud("⚡ سرعة مضاعفة 2.0x (استمر بالضغط)", 10000);
      }
    }, 450);
  };

  const handleSurfacePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = dragStateRef.current;
    if (!state.active || controlsLocked) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const mapped = mapPointerToPlayerLocalCoords(
      e.clientX,
      e.clientY,
      rect,
      isCssRotated90
    );
    const dx = mapped.localX - state.startLocalX;
    const dy = mapped.localY - state.startLocalY;

    if (state.mode === "none") {
      if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return;
      // Cancel long-press boost if user starts dragging
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      if (Math.abs(dy) > Math.abs(dx)) {
        state.mode = state.gestureSide;
      } else {
        state.mode = "seek";
      }
    }

    if (state.mode === "brightness") {
      const nextB = saveBrightness(
        computeVerticalGestureLevel(state.startBrightness, dy, 220, 0.05, 1)
      );
      setBrightness(nextB);
      showTransientLevel("brightness", nextB * 100, 1200);
    } else if (state.mode === "volume") {
      const nextV = saveVolume(
        computeVerticalGestureLevel(state.startVolume, dy, 220, 0, 1)
      );
      setVolume(nextV);
      if (nextV > 0 && isMuted) setIsMuted(false);
      showTransientLevel("volume", nextV * 100, 1200);
    } else if (state.mode === "seek") {
      const deltaSec = Math.round(dx * 0.25);
      const target = Math.max(
        0,
        Math.min(duration, state.startSeekSec + deltaSec)
      );
      setScrubPreviewTime(target);
      showGestureHud(
        `${deltaSec >= 0 ? "⏩" : "⏪"} ${formatTime(target)} (${
          deltaSec >= 0 ? "+" : ""
        }${deltaSec}s)`
      );
    }
  };

  const handleSurfacePointerUpOrCancel = (
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    const wasLongPressBoost = isLongPressBoost;
    if (isLongPressBoost) {
      setIsLongPressBoost(false);
      setPlaybackSpeed(preBoostSpeedRef.current);
      showGestureHud(`⚡ عادت السرعة إلى ${preBoostSpeedRef.current}x`, 900);
    }
    const state = dragStateRef.current;
    if (state.active && state.mode === "seek" && scrubPreviewTime !== null) {
      seekToSeconds(scrubPreviewTime);
      setScrubPreviewTime(null);
    }

    // Instant tap response on touch/pen/mouse without 300ms click delay
    if (
      e.type === "pointerup" &&
      state.active &&
      state.mode === "none" &&
      !wasLongPressBoost &&
      !(e.target as HTMLElement).closest("button") &&
      !(e.target as HTMLElement).closest("[data-testid='player-timeline-scrubber']")
    ) {
      lastTapToggleTsRef.current = Date.now();
      setControlsVisible((v) => !v);
    }

    dragStateRef.current.active = false;
    dragStateRef.current.mode = "none";
  };

  // Interactive Timeline Scrubber Pointer Events (supports both normal & CSS-rotated landscape)
  const updateTimelineFromPointer = (
    clientX: number,
    clientY: number,
    commit = false
  ) => {
    const bar = timelineRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const mapped = mapPointerToPlayerLocalCoords(
      clientX,
      clientY,
      rect,
      isCssRotated90
    );
    const pct = Math.max(
      0,
      Math.min(1, mapped.localX / Math.max(1, mapped.localWidth))
    );
    const targetSec = Math.round(pct * duration);
    if (commit) {
      setIsScrubbing(false);
      setScrubPreviewTime(null);
      seekToSeconds(targetSec);
    } else {
      setScrubPreviewTime(targetSec);
      setCurrentTime(targetSec);
    }
  };

  const displayedTime =
    scrubPreviewTime !== null ? scrubPreviewTime : currentTime;
  const progressPct = Math.min(
    100,
    Math.max(0, (displayedTime / Math.max(duration, 1)) * 100)
  );

  // Yellow Skip Intro & Skip Outro Segments on the Seekbar
  const timelineSkipSegments = useMemo(
    () =>
      computeTimelineSkipSegments(
        duration,
        resolvedSkipTimes.intro,
        resolvedSkipTimes.outro
      ),
    [duration, resolvedSkipTimes.intro, resolvedSkipTimes.outro]
  );

  // Active Skip Intro / Skip Outro Interval
  const activeIntro = isPositionInSkipInterval(
    resolvedSkipTimes.intro,
    currentTime
  )
    ? resolvedSkipTimes.intro
    : null;
  const activeOutro = isPositionInSkipInterval(
    resolvedSkipTimes.outro,
    currentTime
  )
    ? resolvedSkipTimes.outro
    : null;
  const activeSkipInterval = activeIntro || activeOutro;

  const activeSubtitleTrackObj = allSubtitleTracks.find(
    (t) => t.id === selectedSubtitleId
  );

  // Format clean metadata line matching screenshot: "الحلقة 4 • العربية • مترجم • 1080P"
  const formattedMetadataLine = useMemo(() => {
    const isDubbed =
      audioTrackLabel.includes("مدبلج") ||
      subtitle.includes("مدبلج") ||
      audioModeLabel.includes("مدبلج");
    const qualityRaw =
      currentServerObj?.quality || initialQuality || "1080P";
    return formatPlayerSubtitleLine({
      episodeNumber,
      languageLabel: "العربية",
      modeLabel: isDubbed ? "مدبلج" : "مترجم",
      qualityLabel: qualityRaw,
    });
  }, [
    episodeNumber,
    audioTrackLabel,
    subtitle,
    audioModeLabel,
    currentServerObj?.quality,
    initialQuality,
  ]);

  const displayedSubtitleText = useMemo(() => {
    if (!activeSubtitleCue || selectedSubtitleId === "off") return null;
    if (autoTranslateEnabled && activeSubtitleTrackObj) {
      const cacheKey = `${activeSubtitleTrackObj.id}:${activeSubtitleCue.id}`;
      if (translatedCueCache[cacheKey]) {
        return translatedCueCache[cacheKey];
      }
      if (!activeSubtitleTrackObj.language.startsWith("ar")) {
        const arTrack = builtInTracks.find((t) => t.language === "ar");
        const arMatch = arTrack?.cues?.find(
          (c) =>
            currentTime >= c.startSeconds && currentTime <= c.endSeconds
        );
        if (arMatch) return arMatch.text;
      }
    }
    return activeSubtitleCue.text;
  }, [
    activeSubtitleCue,
    selectedSubtitleId,
    autoTranslateEnabled,
    activeSubtitleTrackObj,
    translatedCueCache,
    builtInTracks,
    currentTime,
  ]);

  return (
    <div
      ref={containerRef}
      dir="rtl"
      data-testid="rift-player-root"
      data-orientation={landscapeLocked ? "landscape" : "portrait"}
      onPointerDown={(e) => {
        resetControlsAutoHideTimer();
        handleSurfacePointerDown(e);
      }}
      onPointerMove={handleSurfacePointerMove}
      onPointerUp={handleSurfacePointerUpOrCancel}
      onPointerCancel={handleSurfacePointerUpOrCancel}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) {
          resetControlsAutoHideTimer();
          return;
        }
        if (controlsLocked) {
          revealLockPrompt();
          return;
        }
        if (activeDrawer !== "none") {
          setActiveDrawer("none");
          return;
        }
        if (showSubtitleStyleSheet) {
          setShowSubtitleStyleSheet(false);
          return;
        }
        // Prevent double-toggle if pointerUp already handled this tap
        if (Date.now() - lastTapToggleTsRef.current < 380) {
          return;
        }
        setControlsVisible((v) => !v);
      }}
      onDoubleClick={(e) => {
        if (controlsLocked) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const mapped = mapPointerToPlayerLocalCoords(
          e.clientX,
          e.clientY,
          rect,
          isCssRotated90
        );
        const isLeftHalf = mapped.localX < mapped.localWidth / 2;
        handleSideDoubleTap(isLeftHalf ? "left" : "right");
      }}
      className="z-50 bg-black flex flex-col justify-between select-none overflow-hidden touch-manipulation"
      style={
        isCssRotated90
          ? {
              position: "fixed",
              top: "50%",
              left: "50%",
              width: `${viewportSize.height}px`,
              height: `${viewportSize.width}px`,
              transform: "translate(-50%, -50%) rotate(90deg)",
              transformOrigin: "center center",
              touchAction: "manipulation",
            }
          : {
              position: "fixed",
              inset: 0,
              touchAction: "manipulation",
            }
      }
    >
      {/* ── Main Video Surface (RiftPlayerSurface) ── */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center bg-black overflow-hidden">
        <video
          ref={videoRef}
          poster={poster}
          playsInline
          onPlay={() => {
            setIsPlaying(true);
            setIsBuffering(false);
          }}
          onPause={() => setIsPlaying(false)}
          onWaiting={() => {
            setIsBuffering(true);
            if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
            stallTimerRef.current = setTimeout(() => {
              handleSourceFailure("تأخر استجابة البث (Stall)");
            }, 12000);
          }}
          onPlaying={() => {
            setIsBuffering(false);
            if (stallTimerRef.current) {
              clearTimeout(stallTimerRef.current);
              stallTimerRef.current = null;
            }
          }}
          onLoadedMetadata={(e) => {
            const vid = e.currentTarget;
            if (Number.isFinite(vid.duration) && vid.duration > 10) {
              setDuration(Math.floor(vid.duration));
            }
            if (initialPositionSec > 0 && vid.currentTime < 1) {
              try {
                vid.currentTime = initialPositionSec;
              } catch {}
            }
            setIsBuffering(false);
          }}
          onTimeUpdate={(e) => {
            if (isScrubbing) return;
            const vid = e.currentTarget;
            const pos = Math.floor(vid.currentTime);
            setCurrentTime(pos);
            if (vid.buffered.length > 0 && vid.duration > 0) {
              const bufEnd = vid.buffered.end(vid.buffered.length - 1);
              setBufferedRatio(Math.min(1, bufEnd / vid.duration));
            }
            if (onProgressUpdate && vid.duration > 0) {
              onProgressUpdate(pos, Math.floor(vid.duration));
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            setEpisodeEnded(true);
            setControlsVisible(true);
          }}
          onError={() => {
            handleSourceFailure(
              `تعذر تشغيل المصدر (${currentServerObj?.label || "الحالي"})`
            );
          }}
          className="transition-all duration-200"
          style={{
            width: fitMode === "CENTER" ? "84%" : "100%",
            height: fitMode === "CENTER" ? "84%" : "100%",
            objectFit:
              fitMode === "FIT" || fitMode === "CENTER"
                ? "contain"
                : fitMode === "FILL"
                ? "fill"
                : "cover",
            maxHeight: landscapeLocked ? "100%" : "52%",
            filter: `brightness(${brightness})`,
          }}
        />

        {/* Screenshot Camera Shutter Flash */}
        {screenshotFlash && (
          <div className="absolute inset-0 bg-white/80 z-50 pointer-events-none transition-opacity" />
        )}

        {/* Buffering / Stall Indicator */}
        {isBuffering && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 pointer-events-none z-30">
            <div
              className="animate-spin"
              style={{
                width: 48,
                height: 48,
                borderRadius: 999,
                border: "3px solid rgba(255, 255, 255, 0.22)",
                borderTopColor: "#7C3AED",
              }}
            />
          </div>
        )}

        {/* ── Stream Error / Failover Notice with Retry & Back ── */}
        {streamError && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-20 inset-x-4 max-w-md mx-auto z-40 flex items-center justify-between gap-3 p-3.5 rounded-2xl"
            style={{
              backgroundColor: "rgba(28, 12, 20, 0.94)",
              border: "1px solid rgba(244, 63, 94, 0.55)",
              boxShadow: "0 14px 32px rgba(0,0,0,0.8)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={18} color="#FB7185" />
              <span
                style={{
                  color: "#FFE4E6",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {streamError}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  refreshedServerIdsRef.current.clear();
                  setFailedServerIds(new Set());
                  setStreamError(null);
                  const vid = videoRef.current;
                  if (vid) {
                    vid.load();
                    vid.play().catch(() => {});
                  }
                }}
                className="px-3 py-1.5 rounded-xl cursor-pointer"
                style={{
                  backgroundColor: "#E50914",
                  color: "#FFFFFF",
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                إعادة المحاولة
              </button>
              <button
                onClick={onBack}
                className="px-2.5 py-1.5 rounded-xl cursor-pointer"
                style={{
                  backgroundColor: "rgba(255,255,255,0.12)",
                  color: "#FFFFFF",
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                رجوع
              </button>
            </div>
          </div>
        )}

        {/* ── Redesigned Vertical Volume & Brightness Gesture HUD (Matches Screenshot_20261029-133536_99976508.png 1:1 & Auto-Hides) ── */}
        {transientLevelIndicator && (
          <div
            dir="ltr"
            data-testid="transient-level-pill"
            className="absolute z-40 flex flex-col items-center gap-2 pointer-events-none transition-opacity duration-200"
            style={{
              ...(transientLevelIndicator.kind === "volume"
                ? { right: 18 }
                : { left: 18 }),
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            {/* Top Circular Icon Badge */}
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: 48,
                height: 48,
                backgroundColor: "rgba(28, 28, 36, 0.86)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.65)",
              }}
            >
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: "#F4F4F5",
                }}
              >
                {transientLevelIndicator.kind === "brightness" ? (
                  <BrightnessSunburstIcon color="#18181B" size={19} />
                ) : transientLevelIndicator.percent === 0 ? (
                  <VolumeX size={19} color="#18181B" />
                ) : (
                  <Volume2 size={19} color="#18181B" />
                )}
              </div>
            </div>

            {/* Vertical Progress Capsule */}
            <div
              className="flex flex-col items-center justify-between rounded-full"
              style={{
                width: 48,
                height: 176,
                paddingTop: 14,
                paddingBottom: 14,
                backgroundColor: "rgba(28, 28, 36, 0.86)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 10px 28px rgba(0, 0, 0, 0.68)",
              }}
            >
              <span
                style={{
                  color: "#FFFFFF",
                  fontSize: 12.5,
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {transientLevelIndicator.percent}%
              </span>

              {/* Vertical Bar Track */}
              <div
                className="relative overflow-hidden rounded-full flex items-end"
                style={{
                  width: 6,
                  height: 92,
                  backgroundColor: "rgba(255, 255, 255, 0.24)",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: `${transientLevelIndicator.percent}%`,
                    backgroundColor: "#FFFFFF",
                    borderRadius: 999,
                    transition: "height 60ms linear",
                  }}
                />
              </div>

              {/* Bottom Symbol (Music Note for Volume, Sun for Brightness) */}
              {transientLevelIndicator.kind === "volume" ? (
                <span
                  style={{
                    color: "#FFFFFF",
                    fontSize: 15,
                    fontWeight: 800,
                    lineHeight: 1,
                  }}
                >
                  ♪
                </span>
              ) : (
                <Sun size={15} color="#FFFFFF" />
              )}
            </div>
          </div>
        )}

        {/* ── Gesture & Action Feedback Pill (Seek / 2x Speed / Screenshot / Orientation) ── */}
        {(gestureHudText || isLongPressBoost) && (
          <div
            className="absolute top-6 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full pointer-events-none"
            style={{
              backgroundColor: "rgba(18, 18, 22, 0.88)",
              border: "1px solid rgba(255, 255, 255, 0.16)",
              boxShadow: "0 10px 28px rgba(0, 0, 0, 0.75)",
              backdropFilter: "blur(10px)",
            }}
          >
            <span
              style={{
                color: "#FFFFFF",
                fontSize: 12.5,
                fontWeight: 800,
              }}
            >
              {isLongPressBoost
                ? "⚡ سرعة مضاعفة 2.0x نشطة"
                : gestureHudText}
            </span>
          </div>
        )}

        {/* ── End-of-Episode Manual Overlay Card (No Auto-Play Countdown) ── */}
        {episodeEnded && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-4"
          >
            <div
              className="w-full max-w-sm rounded-3xl p-5 flex flex-col items-center gap-3.5 text-center"
              style={{
                backgroundColor: "rgba(18, 18, 24, 0.96)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                boxShadow: "0 20px 48px rgba(0,0,0,0.9)",
              }}
            >
              <span
                style={{
                  color: "#FFFFFF",
                  fontSize: 17,
                  fontWeight: 900,
                }}
              >
                انتهت الحلقة {episodeNumber}
              </span>
              <span
                style={{
                  color: "#E4E4E7",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {title}
              </span>
              <div className="flex items-center justify-center gap-2.5 flex-wrap mt-1">
                <button
                  onClick={() => {
                    setEpisodeEnded(false);
                    seekToSeconds(0);
                    const vid = videoRef.current;
                    if (vid) vid.play().catch(() => {});
                    setIsPlaying(true);
                  }}
                  className="px-4 py-2 rounded-xl cursor-pointer"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "#FFFFFF",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  ↺ إعادة التشغيل
                </button>
                {canGoNext && onChangeEpisode && (
                  <button
                    onClick={() => {
                      setEpisodeEnded(false);
                      onChangeEpisode(episodeNumber + 1);
                    }}
                    className="px-4 py-2 rounded-xl cursor-pointer"
                    style={{
                      backgroundColor: "#E50914",
                      color: "#FFFFFF",
                      fontSize: 12,
                      fontWeight: 900,
                    }}
                  >
                    الحلقة التالية ⏭
                  </button>
                )}
                <button
                  onClick={onBack}
                  className="px-4 py-2 rounded-xl cursor-pointer"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.16)",
                    color: "#CBD5E1",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  الرجوع
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Time-Synced Subtitle Caption Overlay (Matches Screenshot Clean Arabic Subtitle Placement) ── */}
        {displayedSubtitleText && (
          <div
            className="absolute inset-x-6 flex justify-center pointer-events-none z-20 transition-all"
            style={{
              ...(subtitleStyle.verticalPosition === "top"
                ? { top: Math.max(16, 54 + subtitleStyle.verticalOffsetPx) }
                : subtitleStyle.verticalPosition === "center"
                ? {
                    top: `calc(50% + ${subtitleStyle.verticalOffsetPx}px)`,
                    transform: "translateY(-50%)",
                  }
                : {
                    bottom: Math.max(
                      16,
                      (landscapeLocked
                        ? controlsVisible && !controlsLocked
                          ? 136
                          : 34
                        : 185) - subtitleStyle.verticalOffsetPx
                    ),
                  }),
            }}
          >
            <span
              style={{
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 3,
                paddingBottom: 3,
                borderRadius: 6,
                backgroundColor:
                  subtitleStyle.backgroundAlpha > 0.05
                    ? `rgba(5, 5, 10, ${subtitleStyle.backgroundAlpha * 0.45})`
                    : "transparent",
                color: subtitleStyle.textColor,
                fontSize: subtitleStyle.fontSizeSp * 0.78,
                fontWeight:
                  subtitleStyle.fontWeight === "extraBold"
                    ? 900
                    : subtitleStyle.fontWeight === "bold"
                    ? 700
                    : 500,
                textAlign: "center",
                lineHeight: 1.5,
                textShadow:
                  "0 2px 6px rgba(0,0,0,0.98), 0 0 3px rgba(0,0,0,0.95)",
                maxWidth: "90%",
                whiteSpace: "pre-line",
              }}
            >
              {displayedSubtitleText}
              {subtitleStyle.timingOffsetMs !== 0 &&
                ` (${subtitleStyle.timingOffsetMs > 0 ? "+" : ""}${(
                  subtitleStyle.timingOffsetMs / 1000
                ).toFixed(1)}s)`}
            </span>
          </div>
        )}

        {/* ── Sleek Skip Intro / Outro Floating Button on the RIGHT side when inside Yellow Segment ── */}
        {activeSkipInterval && !controlsLocked && (
          <button
            type="button"
            data-testid="skip-interval-btn"
            onClick={(e) => {
              e.stopPropagation();
              seekToSeconds(
                activeSkipInterval.endSeconds,
                activeIntro
                  ? "⏭ تم تخطي المقدمة"
                  : "⏭ تم تخطي شارة النهاية"
              );
            }}
            className="absolute z-30 flex items-center gap-2.5 pl-4 pr-3 py-2 rounded-2xl cursor-pointer active:scale-95 transition-transform touch-manipulation"
            style={{
              right: 20,
              bottom: controlsVisible ? (landscapeLocked ? 132 : 176) : 48,
              backgroundColor: "rgba(18, 18, 26, 0.94)",
              border: "1.5px solid rgba(245, 158, 11, 0.82)",
              boxShadow: "0 10px 26px rgba(0, 0, 0, 0.78)",
              touchAction: "manipulation",
            }}
          >
            <div
              className="flex items-center justify-center rounded-xl shrink-0"
              style={{
                width: 28,
                height: 28,
                backgroundColor: "rgba(245, 158, 11, 0.22)",
                border: "1px solid rgba(245, 158, 11, 0.55)",
              }}
            >
              <FastForward size={15} color="#FBBF24" fill="#FBBF24" />
            </div>
            <div className="flex flex-col items-start text-right">
              <span
                style={{
                  color: "#FFFFFF",
                  fontSize: 12.5,
                  fontWeight: 800,
                  lineHeight: 1.15,
                }}
              >
                {activeIntro ? "تخطي المقدمة" : "تخطي النهاية"}
              </span>
              <span
                dir="ltr"
                style={{
                  color: "#FCD34D",
                  fontSize: 10,
                  fontWeight: 700,
                  lineHeight: 1.1,
                }}
              >
                {formatTime(activeSkipInterval.endSeconds)}
              </span>
            </div>
          </button>
        )}

        {/* ── Improved Touch Locked Mode Overlay (Auto-Hiding Floating Unlock Shield) ── */}
        {controlsLocked && lockPromptVisible && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-0 top-7 flex items-center justify-center z-40 pointer-events-none"
          >
            <button
              data-testid="unlock-screen-btn"
              onClick={() => {
                setControlsLocked(false);
                setLockPromptVisible(false);
                setControlsVisible(true);
                showGestureHud("🔓 تم فتح قفل الشاشة");
              }}
              className="pointer-events-auto flex items-center gap-3 px-5 py-2.5 rounded-full cursor-pointer active:scale-95 transition-all"
              style={{
                backgroundColor: "rgba(14, 11, 24, 0.92)",
                border: "1.5px solid rgba(139, 92, 246, 0.65)",
                boxShadow: "0 12px 32px rgba(0, 0, 0, 0.85)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 28,
                  height: 28,
                  backgroundColor: "rgba(124, 58, 237, 0.28)",
                  border: "1px solid rgba(167, 139, 250, 0.5)",
                }}
              >
                <Lock size={14} color="#C4B5FD" />
              </div>
              <div className="flex flex-col items-start text-right">
                <span
                  style={{
                    color: "#FFFFFF",
                    fontSize: 12.5,
                    fontWeight: 800,
                  }}
                >
                  الشاشة مقفلة
                </span>
                <span
                  style={{
                    color: "#C4B5FD",
                    fontSize: 10.5,
                    fontWeight: 700,
                  }}
                >
                  اضغط هنا لإلغاء القفل
                </span>
              </div>
            </button>
          </div>
        )}

        {/* ── Full Nova Mobile RiftPlayer HUD (Matches Portrait & Landscape Reference Screenshots 1:1) ── */}
        {!controlsLocked && controlsVisible && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 flex flex-col justify-between z-20 pointer-events-none"
          >
            {/* Top Scrim */}
            <div
              className="absolute top-0 inset-x-0 pointer-events-none"
              style={{
                height: landscapeLocked ? 115 : 160,
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.42) 68%, transparent 100%)",
              }}
            />

            {/* Bottom Scrim */}
            <div
              className="absolute bottom-0 inset-x-0 pointer-events-none"
              style={{
                height: 195,
                background:
                  "linear-gradient(0deg, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.62) 68%, transparent 100%)",
              }}
            />

            {/* ── 1. TOP BAR (Restored Clean Title + Episode Subtitle Line & Uniform Dark Action Buttons) ── */}
            <div
              dir="ltr"
              className={
                landscapeLocked
                  ? "relative z-10 flex items-start justify-between px-5 pt-4 gap-3 pointer-events-auto"
                  : "relative z-10 flex flex-col-reverse items-stretch px-5 pt-4 gap-3 pointer-events-auto"
              }
            >
              {/* Title + Single Metadata Line ("الحلقة 4 • العربية • مترجم • 1080P" matching IMG_20261029_124852_710_6bfa22b1.jpg) */}
              <div className="flex flex-col min-w-0 text-left flex-1">
                <span
                  dir="auto"
                  data-testid="player-title-heading"
                  className="line-clamp-1"
                  style={{
                    color: "#FFFFFF",
                    fontSize: landscapeLocked ? 18 : 20,
                    fontWeight: 800,
                    letterSpacing: "normal",
                  }}
                >
                  {title}
                </span>
                <span
                  dir="rtl"
                  data-testid="player-subtitle-metadata"
                  className="line-clamp-1 mt-1"
                  style={{
                    color: "#E4E4E7",
                    fontSize: 13.5,
                    fontWeight: 600,
                  }}
                >
                  {formattedMetadataLine}
                </span>
              </div>

              {/* Right side: 4 Circular Action Buttons (Camera, CC Subtitles, Rotate Screen, Close) — All uniform dark style */}
              <div className="flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCaptureScreenshot}
                  aria-label="التقاط صورة للشاشة"
                  title="التقاط صورة للشاشة"
                  className="flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 999,
                    backgroundColor: "rgba(22, 22, 30, 0.84)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                  }}
                >
                  <Camera size={19} color="#FFFFFF" />
                </button>

                <button
                  type="button"
                  data-testid="top-subtitle-settings-btn"
                  onClick={() => {
                    setActiveDrawer("none");
                    setShowSubtitleStyleSheet((s) => !s);
                  }}
                  aria-label="إعدادات الترجمة"
                  title="إعدادات الترجمة"
                  className="flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 999,
                    backgroundColor: "rgba(22, 22, 30, 0.84)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                  }}
                >
                  <CcBadgeIcon active={selectedSubtitleId !== "off"} />
                </button>

                <button
                  type="button"
                  data-testid="rotate-screen-btn"
                  onClick={handleToggleOrientation}
                  aria-label="تدوير الشاشة"
                  title="تدوير الشاشة"
                  className="flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 999,
                    backgroundColor: "rgba(22, 22, 30, 0.84)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                  }}
                >
                  <RotatePhoneIcon isLandscape={landscapeLocked} />
                </button>

                <button
                  type="button"
                  onClick={onBack}
                  aria-label="إغلاق المشغل"
                  title="إغلاق المشغل"
                  className="flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 999,
                    backgroundColor: "rgba(22, 22, 30, 0.84)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                  }}
                >
                  <X size={20} color="#FFFFFF" />
                </button>
              </div>
            </div>

            {/* ── 2. CENTER OVERLAY (Zero White Halos & 100% Vertically Aligned on One Horizontal Line) ── */}
            <div
              dir="ltr"
              data-testid="center-controls-group"
              className="relative z-10 flex items-center justify-center gap-8 my-auto pointer-events-auto"
            >
              {!landscapeLocked && (
                <Seek10Button
                  direction="back"
                  size={54}
                  onClick={() => triggerRelativeSeek(-10)}
                />
              )}

              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
                className="flex items-center justify-center rounded-full cursor-pointer active:scale-90 transition-transform shrink-0"
                style={{
                  width: 66,
                  height: 66,
                  borderRadius: 999,
                  backgroundColor: "rgba(22, 22, 30, 0.86)",
                  border: "2px solid rgba(255, 255, 255, 0.85)",
                }}
              >
                {isPlaying ? (
                  <Pause size={27} color="#FFFFFF" fill="#FFFFFF" />
                ) : (
                  <Play
                    size={27}
                    color="#FFFFFF"
                    fill="#FFFFFF"
                    style={{ marginLeft: 3 }}
                  />
                )}
              </button>

              {!landscapeLocked && (
                <Seek10Button
                  direction="forward"
                  size={54}
                  onClick={() => triggerRelativeSeek(10)}
                />
              )}
            </div>

            {/* ── 3. BOTTOM TIMELINE & CONTROLS BAR (100% Aligned on One Horizontal Axis) ── */}
            <div className="relative z-10 flex flex-col px-5 pb-4 gap-2.5 pointer-events-auto">
              {/* Timestamps Row ABOVE the Seekbar (Left = Current Time, Right = Duration) */}
              <div
                dir="ltr"
                className="flex items-center justify-between px-1"
              >
                <span
                  style={{
                    color: "#FFFFFF",
                    fontSize: 14,
                    fontWeight: 800,
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: "0.3px",
                  }}
                >
                  {formatTime(displayedTime)}
                </span>
                <span
                  style={{
                    color: "rgba(244, 244, 245, 0.9)",
                    fontSize: 14,
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: "0.3px",
                  }}
                >
                  {formatTime(duration)}
                </span>
              </div>

              {/* Enlarged & Refined Timeline Scrubber Track (Vibrant Progress + Crisp Yellow Intro/Outro Segments + Sleek Thumb) */}
              <div
                dir="ltr"
                ref={timelineRef}
                data-testid="player-timeline-scrubber"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setIsScrubbing(true);
                  e.currentTarget.setPointerCapture(e.pointerId);
                  updateTimelineFromPointer(e.clientX, e.clientY, false);
                }}
                onPointerMove={(e) => {
                  if (!isScrubbing) return;
                  e.stopPropagation();
                  updateTimelineFromPointer(e.clientX, e.clientY, false);
                }}
                onPointerUp={(e) => {
                  if (!isScrubbing) return;
                  e.stopPropagation();
                  e.currentTarget.releasePointerCapture(e.pointerId);
                  updateTimelineFromPointer(e.clientX, e.clientY, true);
                }}
                className="w-full relative flex items-center cursor-pointer"
                style={{ height: 32 }}
              >
                {/* Floating Scrub Preview Timestamp Bubble */}
                {isScrubbing && scrubPreviewTime !== null && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 34,
                      left: `calc(${progressPct}% - 28px)`,
                      padding: "4px 10px",
                      borderRadius: 8,
                      backgroundColor: "rgba(20, 20, 28, 0.96)",
                      border: "1px solid rgba(255, 255, 255, 0.25)",
                      color: "#FFFFFF",
                      fontSize: 12,
                      fontWeight: 800,
                      fontVariantNumeric: "tabular-nums",
                      pointerEvents: "none",
                    }}
                  >
                    {formatTime(scrubPreviewTime)}
                  </div>
                )}

                <div
                  className="w-full relative overflow-hidden"
                  style={{
                    height: isScrubbing ? 10 : 7.5,
                    borderRadius: 999,
                    backgroundColor: "rgba(255, 255, 255, 0.24)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                  }}
                >
                  {/* Buffered Track */}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${Math.min(100, bufferedRatio * 100)}%`,
                      backgroundColor: "rgba(255, 255, 255, 0.44)",
                      borderRadius: 999,
                    }}
                  />

                  {/* Played Track (Eye-friendly soothing Cyan-Emerald gradient) */}
                  <div
                    data-testid="player-timeline-played-fill"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${progressPct}%`,
                      background:
                        "linear-gradient(90deg, #06B6D4 0%, #10B981 100%)",
                      borderRadius: 999,
                    }}
                  />

                  {/* Yellow / Amber Skip Intro & Skip Outro Segments on Timeline (تنبيه الخط الأصفر لمكان تخطي المقدمة والنهاية) */}
                  {timelineSkipSegments.map((seg) => (
                    <div
                      key={seg.kind}
                      data-testid={`timeline-skip-${seg.kind}`}
                      title={
                        seg.kind === "intro"
                          ? "منطقة تخطي المقدمة"
                          : "منطقة تخطي النهاية"
                      }
                      style={{
                        position: "absolute",
                        left: `${seg.leftPct}%`,
                        width: `${seg.widthPct}%`,
                        top: 0,
                        bottom: 0,
                        backgroundColor: "#FBBF24",
                        borderRadius: 999,
                      }}
                    />
                  ))}
                </div>

                {/* Enlarged Sleek Scrubber Thumb (Eye-friendly Emerald-Teal) */}
                <div
                  data-testid="player-timeline-thumb"
                  style={{
                    position: "absolute",
                    left: `calc(${progressPct}% - ${isScrubbing ? 10 : 9}px)`,
                    width: isScrubbing ? 20 : 18,
                    height: isScrubbing ? 20 : 18,
                    borderRadius: 999,
                    backgroundColor: "#10B981",
                    border: "2.5px solid #FFFFFF",
                    boxShadow: "0 0 10px rgba(16, 185, 129, 0.55)",
                  }}
                />
              </div>

              {/* Bottom Controls Bar (All buttons aligned on one exact horizontal axis) */}
              <div
                dir="ltr"
                data-testid="bottom-controls-bar"
                className="flex items-center justify-between pt-1"
                style={{ minHeight: 54 }}
              >
                {/* Far Left: Playback Speed Button (1x) + Mute/Unmute Speaker Button */}
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    data-testid="speed-cycle-btn"
                    onClick={cycleSpeed}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setActiveDrawer((d) =>
                        d === "settings" ? "none" : "settings"
                      );
                    }}
                    aria-label="سرعة التشغيل"
                    title={`السرعة (${playbackSpeed}x)`}
                    className="flex items-center justify-center rounded-full cursor-pointer active:scale-90 transition-transform shrink-0"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 999,
                      backgroundColor: "rgba(22, 22, 30, 0.86)",
                      border: "1px solid rgba(255, 255, 255, 0.18)",
                      color: "#FFFFFF",
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    {playbackSpeed}x
                  </button>

                  <button
                    type="button"
                    data-testid="mute-toggle-btn"
                    onClick={toggleMute}
                    aria-label={isMuted ? "إلغاء كتم الصوت" : "كتم الصوت"}
                    title={isMuted ? "إلغاء كتم الصوت" : "كتم الصوت"}
                    className="flex items-center justify-center rounded-full cursor-pointer active:scale-90 transition-transform shrink-0"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 999,
                      backgroundColor: isMuted
                        ? "rgba(225, 29, 72, 0.28)"
                        : "rgba(22, 22, 30, 0.86)",
                      border: `1px solid ${
                        isMuted
                          ? "rgba(244, 63, 94, 0.55)"
                          : "rgba(255, 255, 255, 0.18)"
                      }`,
                    }}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX size={19} color="#FDA4AF" />
                    ) : (
                      <Volume2 size={19} color="#FFFFFF" />
                    )}
                  </button>
                </div>

                {/* Center: In Landscape mode, the 10s Seek Buttons move here flanking Play/Pause on the exact same horizontal line */}
                <div
                  data-testid="bottom-center-controls"
                  className="flex items-center justify-center gap-3.5"
                >
                  {landscapeLocked && (
                    <Seek10Button
                      direction="back"
                      size={44}
                      onClick={() => triggerRelativeSeek(-10)}
                    />
                  )}

                  <button
                    type="button"
                    data-testid="bottom-play-pause-btn"
                    onClick={togglePlay}
                    aria-label={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
                    className="flex items-center justify-center rounded-full cursor-pointer active:scale-90 transition-transform shrink-0"
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 999,
                      backgroundColor: "rgba(22, 22, 30, 0.88)",
                      border: "2px solid rgba(255, 255, 255, 0.88)",
                    }}
                  >
                    {isPlaying ? (
                      <Pause size={22} color="#FFFFFF" fill="#FFFFFF" />
                    ) : (
                      <Play
                        size={22}
                        color="#FFFFFF"
                        fill="#FFFFFF"
                        style={{ marginLeft: 2 }}
                      />
                    )}
                  </button>

                  {landscapeLocked && (
                    <Seek10Button
                      direction="forward"
                      size={44}
                      onClick={() => triggerRelativeSeek(10)}
                    />
                  )}
                </div>

                {/* Far Right: Aspect Ratio Button [⛶] + Touch Lock Button [🔒] */}
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    data-testid="aspect-ratio-btn"
                    onClick={cycleFitMode}
                    aria-label="نسبة العرض إلى الارتفاع"
                    title={`نسبة العرض إلى الارتفاع: ${fitModeLabelAr}`}
                    className="flex items-center justify-center rounded-full cursor-pointer active:scale-90 transition-transform shrink-0"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 999,
                      backgroundColor:
                        activeDrawer === "aspect"
                          ? "rgba(109, 40, 217, 0.38)"
                          : "rgba(22, 22, 30, 0.84)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                    }}
                  >
                    <AspectCornersIcon />
                  </button>

                  <button
                    type="button"
                    data-testid="lock-controls-btn"
                    onClick={() => {
                      setActiveDrawer("none");
                      setShowSubtitleStyleSheet(false);
                      setControlsLocked(true);
                      revealLockPrompt();
                    }}
                    aria-label="قفل الشاشة"
                    title="قفل الشاشة"
                    className="flex items-center justify-center rounded-full cursor-pointer active:scale-90 transition-transform shrink-0"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 999,
                      backgroundColor: "rgba(22, 22, 30, 0.84)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                    }}
                  >
                    <Lock size={18} color="#FFFFFF" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 4. LEFT-SIDE SUBTITLE SETTINGS DRAWER (Smooth Touch Scrolling & Instant Button Taps in Portrait & Landscape) ── */}
        {showSubtitleStyleSheet && (
          <div
            className="absolute inset-0 z-40 flex justify-end"
            dir="rtl"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerMove={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setShowSubtitleStyleSheet(false);
            }}
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.45)",
            }}
          >
            <div
              dir="rtl"
              data-testid="subtitle-settings-drawer"
              onClick={(e) => e.stopPropagation()}
              className="relative h-full flex flex-col overflow-hidden select-none"
              style={{
                width: landscapeLocked
                  ? "min(350px, 58%)"
                  : "min(335px, 86%)",
                backgroundColor: "#0B0914",
                borderRight: "1px solid rgba(139, 92, 246, 0.25)",
                boxShadow: "16px 0 44px rgba(0, 0, 0, 0.9)",
              }}
            >
              {/* Header: Title on the right, Close button on the left */}
              <div
                className="flex items-center justify-between px-4 py-3.5 shrink-0"
                style={{
                  backgroundColor: "#110E1E",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <span
                  style={{
                    color: "#FFFFFF",
                    fontSize: 16.5,
                    fontWeight: 800,
                  }}
                >
                  إعدادات الترجمة
                </span>
                <button
                  type="button"
                  data-testid="close-subtitle-drawer-btn"
                  onClick={() => setShowSubtitleStyleSheet(false)}
                  className="flex items-center justify-center rounded-full cursor-pointer active:scale-90 transition-transform"
                  style={{
                    width: 34,
                    height: 34,
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.14)",
                  }}
                >
                  <X size={16} color="#FFFFFF" />
                </button>
              </div>

              {/* Scrollable Settings Content — Supports both Native Scroll & Rotated-Landscape Pointer Drag-Scroll */}
              <div
                ref={subtitleScrollRef}
                data-testid="subtitle-settings-scroll-body"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  const el = subtitleScrollRef.current;
                  if (!el) return;
                  const rect = el.getBoundingClientRect();
                  const mapped = mapPointerToPlayerLocalCoords(
                    e.clientX,
                    e.clientY,
                    rect,
                    isCssRotated90
                  );
                  drawerScrollDragRef.current = {
                    active: true,
                    moved: false,
                    startLocalY: mapped.localY,
                    startScrollTop: el.scrollTop,
                  };
                }}
                onPointerMove={(e) => {
                  e.stopPropagation();
                  const state = drawerScrollDragRef.current;
                  const el = subtitleScrollRef.current;
                  if (!state.active || !el) return;
                  const rect = el.getBoundingClientRect();
                  const mapped = mapPointerToPlayerLocalCoords(
                    e.clientX,
                    e.clientY,
                    rect,
                    isCssRotated90
                  );
                  const dy = mapped.localY - state.startLocalY;
                  if (Math.abs(dy) > 6) {
                    state.moved = true;
                  }
                  if (state.moved) {
                    el.scrollTop = state.startScrollTop - dy;
                  }
                }}
                onPointerUp={(e) => {
                  e.stopPropagation();
                  drawerScrollDragRef.current.active = false;
                }}
                onPointerCancel={(e) => {
                  e.stopPropagation();
                  drawerScrollDragRef.current.active = false;
                }}
                onClickCapture={(e) => {
                  if (drawerScrollDragRef.current.moved) {
                    e.stopPropagation();
                    e.preventDefault();
                    drawerScrollDragRef.current.moved = false;
                  }
                }}
                className="flex-1 min-h-0 overflow-y-auto px-4 py-3.5 flex flex-col gap-3.5"
                style={{
                  WebkitOverflowScrolling: "touch",
                  touchAction: isCssRotated90 ? "none" : "pan-y",
                  overscrollBehavior: "contain",
                }}
              >
                {/* 1. Master Subtitle Toggle Row (الترجمة) */}
                <div
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl shrink-0"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <Subtitles size={18} color="#C4B5FD" />
                    <span
                      style={{
                        color: "#FFFFFF",
                        fontSize: 14.5,
                        fontWeight: 800,
                      }}
                    >
                      الترجمة
                    </span>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={selectedSubtitleId !== "off"}
                    onClick={() => {
                      if (selectedSubtitleId !== "off") {
                        lastActiveSubtitleIdRef.current = selectedSubtitleId;
                        setSelectedSubtitleId("off");
                      } else {
                        setSelectedSubtitleId(
                          lastActiveSubtitleIdRef.current ||
                            allSubtitleTracks[0]?.id ||
                            "ar-main"
                        );
                      }
                    }}
                    className="relative rounded-full cursor-pointer transition-colors shrink-0"
                    style={{
                      width: 48,
                      height: 26,
                      backgroundColor:
                        selectedSubtitleId !== "off"
                          ? "#7C3AED"
                          : "rgba(255, 255, 255, 0.16)",
                    }}
                  >
                    <span
                      className="block rounded-full bg-white transition-transform"
                      style={{
                        width: 20,
                        height: 20,
                        position: "absolute",
                        top: 3,
                        left: selectedSubtitleId !== "off" ? 4 : 24,
                      }}
                    />
                  </button>
                </div>

                {/* 2. Language Selection (اللغة: عربي / إنجليزي) */}
                <div className="flex flex-col gap-2 shrink-0">
                  <span
                    style={{
                      color: "#A1A1AA",
                      fontSize: 12.5,
                      fontWeight: 700,
                    }}
                  >
                    اللغة
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {allSubtitleTracks.map((tr) => {
                      const active = selectedSubtitleId === tr.id;
                      const shortLabel = tr.language.startsWith("ar")
                        ? "عربي"
                        : tr.language.startsWith("en")
                        ? "إنجليزي"
                        : tr.label;
                      return (
                        <button
                          type="button"
                          key={tr.id}
                          onClick={() => {
                            lastActiveSubtitleIdRef.current = tr.id;
                            setSelectedSubtitleId(tr.id);
                          }}
                          className="py-2 px-3 rounded-xl cursor-pointer transition-all text-center"
                          style={{
                            backgroundColor: active
                              ? "rgba(124, 58, 237, 0.34)"
                              : "rgba(255, 255, 255, 0.05)",
                            border: `1.5px solid ${
                              active ? "#8B5CF6" : "rgba(255, 255, 255, 0.1)"
                            }`,
                            color: "#FFFFFF",
                            fontSize: 13,
                            fontWeight: 800,
                          }}
                        >
                          {shortLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Font Size Cards (حجم الخط: ص / م / ك / ع / ع+ in a clean 5-col row) */}
                <div className="flex flex-col gap-2 shrink-0">
                  <span
                    style={{
                      color: "#A1A1AA",
                      fontSize: 12.5,
                      fontWeight: 700,
                    }}
                  >
                    حجم الخط
                  </span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { sz: 15, letter: "ص", label: "صغير", previewPx: 13 },
                      { sz: 20, letter: "م", label: "متوسط", previewPx: 15 },
                      { sz: 24, letter: "ك", label: "كبير", previewPx: 17 },
                      { sz: 28, letter: "ع", label: "عملاق", previewPx: 19 },
                      { sz: 33, letter: "ع+", label: "عملاق جدًا", previewPx: 20 },
                    ].map((item) => {
                      const active = subtitleStyle.fontSizeSp === item.sz;
                      return (
                        <button
                          type="button"
                          key={item.sz}
                          onClick={() =>
                            setSubtitleStyle((s) => ({
                              ...s,
                              fontSizeSp: item.sz,
                            }))
                          }
                          className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl cursor-pointer transition-all"
                          style={{
                            minHeight: 62,
                            backgroundColor: active
                              ? "rgba(124, 58, 237, 0.34)"
                              : "rgba(255, 255, 255, 0.05)",
                            border: `1.5px solid ${
                              active ? "#8B5CF6" : "rgba(255, 255, 255, 0.1)"
                            }`,
                          }}
                        >
                          <span
                            style={{
                              color: active ? "#DDD6FE" : "#FFFFFF",
                              fontSize: item.previewPx,
                              fontWeight: 800,
                              lineHeight: 1.1,
                            }}
                          >
                            {item.letter}
                          </span>
                          <span
                            style={{
                              color: active ? "#DDD6FE" : "#A1A1AA",
                              fontSize: 10,
                              fontWeight: 700,
                              lineHeight: 1.1,
                              textAlign: "center",
                            }}
                          >
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Color Swatches (اللون: 5 دوائر مع علامة صح) */}
                <div className="flex flex-col gap-2 shrink-0">
                  <span
                    style={{
                      color: "#A1A1AA",
                      fontSize: 12.5,
                      fontWeight: 700,
                    }}
                  >
                    اللون
                  </span>
                  <div className="flex items-center gap-3">
                    {[
                      "#FFFFFF",
                      "#FACC15",
                      "#67E8F9",
                      "#86EFAC",
                      "#FCA5A5",
                    ].map((hex) => {
                      const active = subtitleStyle.textColor === hex;
                      return (
                        <button
                          type="button"
                          key={hex}
                          onClick={() =>
                            setSubtitleStyle((s) => ({
                              ...s,
                              textColor: hex,
                            }))
                          }
                          aria-label={`لون الترجمة ${hex}`}
                          className="flex items-center justify-center rounded-full cursor-pointer active:scale-90 transition-transform"
                          style={{
                            width: 36,
                            height: 36,
                            backgroundColor: hex,
                            border: active
                              ? "2.5px solid #8B5CF6"
                              : "1px solid rgba(255,255,255,0.22)",
                          }}
                        >
                          {active && (
                            <Check size={16} color="#09090B" strokeWidth={3} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Position (الموضع: أعلى / وسط / أسفل) */}
                <div className="flex flex-col gap-2 shrink-0">
                  <span
                    style={{
                      color: "#A1A1AA",
                      fontSize: 12.5,
                      fontWeight: 700,
                    }}
                  >
                    الموضع
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { pos: "top", label: "أعلى", icon: "↑" },
                        { pos: "center", label: "وسط", icon: "⊡" },
                        { pos: "bottom", label: "أسفل", icon: "↓" },
                      ] as {
                        pos: RiftSubtitleVerticalPos;
                        label: string;
                        icon: string;
                      }[]
                    ).map((item) => {
                      const active = subtitleStyle.verticalPosition === item.pos;
                      return (
                        <button
                          type="button"
                          key={item.pos}
                          onClick={() =>
                            setSubtitleStyle((s) => ({
                              ...s,
                              verticalPosition: item.pos,
                            }))
                          }
                          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl cursor-pointer transition-all"
                          style={{
                            backgroundColor: active
                              ? "rgba(124, 58, 237, 0.34)"
                              : "rgba(255, 255, 255, 0.05)",
                            border: `1.5px solid ${
                              active ? "#8B5CF6" : "rgba(255, 255, 255, 0.1)"
                            }`,
                            color: "#FFFFFF",
                            fontSize: 12.5,
                            fontWeight: 800,
                          }}
                        >
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 6. Vertical Fine Movement (التحريك لأعلى وأسفل: 0px | ↑ رفع | الافتراضي | ↓ خفض) */}
                <div className="flex flex-col gap-2 shrink-0">
                  <div className="flex items-center justify-between">
                    <span
                      style={{
                        color: "#A1A1AA",
                        fontSize: 12.5,
                        fontWeight: 700,
                      }}
                    >
                      التحريك لأعلى وأسفل
                    </span>
                    <span
                      dir="ltr"
                      style={{
                        color: "#C4B5FD",
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {subtitleStyle.verticalOffsetPx}px
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSubtitleStyle((s) => ({
                          ...s,
                          verticalOffsetPx: Math.min(80, s.verticalOffsetPx + 6),
                        }))
                      }
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl cursor-pointer active:scale-95 transition-transform"
                      style={{
                        backgroundColor: "rgba(124, 58, 237, 0.24)",
                        border: "1px solid rgba(139, 92, 246, 0.5)",
                        color: "#FFFFFF",
                        fontSize: 12.5,
                        fontWeight: 800,
                      }}
                    >
                      <span>↑</span>
                      <span>رفع</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setSubtitleStyle((s) => ({
                          ...s,
                          verticalOffsetPx: 0,
                        }))
                      }
                      className="flex items-center justify-center py-2.5 rounded-xl cursor-pointer active:scale-95 transition-transform"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        color: "#FFFFFF",
                        fontSize: 12.5,
                        fontWeight: 800,
                      }}
                    >
                      الافتراضي
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setSubtitleStyle((s) => ({
                          ...s,
                          verticalOffsetPx: Math.max(-80, s.verticalOffsetPx - 6),
                        }))
                      }
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl cursor-pointer active:scale-95 transition-transform"
                      style={{
                        backgroundColor: "rgba(124, 58, 237, 0.24)",
                        border: "1px solid rgba(139, 92, 246, 0.5)",
                        color: "#FFFFFF",
                        fontSize: 12.5,
                        fontWeight: 800,
                      }}
                    >
                      <span>↓</span>
                      <span>خفض</span>
                    </button>
                  </div>
                </div>

                {/* 7. Text Background (خلفية النص: بلا / خفيفة / داكنة) */}
                <div className="flex flex-col gap-2 shrink-0">
                  <span
                    style={{
                      color: "#A1A1AA",
                      fontSize: 12.5,
                      fontWeight: 700,
                    }}
                  >
                    خلفية النص
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { alpha: 0, label: "بلا" },
                      { alpha: 0.45, label: "خفيفة" },
                      { alpha: 0.85, label: "داكنة" },
                    ].map((bg) => {
                      const active =
                        Math.abs(subtitleStyle.backgroundAlpha - bg.alpha) < 0.15;
                      return (
                        <button
                          type="button"
                          key={bg.label}
                          onClick={() =>
                            setSubtitleStyle((s) => ({
                              ...s,
                              backgroundAlpha: bg.alpha,
                            }))
                          }
                          className="py-2 px-3 rounded-xl cursor-pointer transition-all text-center"
                          style={{
                            backgroundColor: active
                              ? "rgba(124, 58, 237, 0.34)"
                              : "rgba(255, 255, 255, 0.05)",
                            border: `1.5px solid ${
                              active ? "#8B5CF6" : "rgba(255, 255, 255, 0.1)"
                            }`,
                            color: "#FFFFFF",
                            fontSize: 12.5,
                            fontWeight: 800,
                          }}
                        >
                          {bg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 8. Bold & Extra-Bold Toggles (نص عريض & نص عريض جدًا) */}
                <div
                  className="flex flex-col gap-2.5 p-3 rounded-2xl shrink-0"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        style={{
                          color: "#C4B5FD",
                          fontSize: 14,
                          fontWeight: 800,
                        }}
                      >
                        ع
                      </span>
                      <span
                        style={{
                          color: "#FFFFFF",
                          fontSize: 13.5,
                          fontWeight: 700,
                        }}
                      >
                        نص عريض
                      </span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={subtitleStyle.fontWeight === "bold"}
                      onClick={() =>
                        setSubtitleStyle((s) => ({
                          ...s,
                          fontWeight: s.fontWeight === "bold" ? "normal" : "bold",
                        }))
                      }
                      className="relative rounded-full cursor-pointer transition-colors shrink-0"
                      style={{
                        width: 46,
                        height: 25,
                        backgroundColor:
                          subtitleStyle.fontWeight === "bold"
                            ? "#7C3AED"
                            : "rgba(255, 255, 255, 0.16)",
                      }}
                    >
                      <span
                        className="block rounded-full bg-white transition-transform"
                        style={{
                          width: 19,
                          height: 19,
                          position: "absolute",
                          top: 3,
                          left: subtitleStyle.fontWeight === "bold" ? 4 : 23,
                        }}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        style={{
                          color: "#C4B5FD",
                          fontSize: 14,
                          fontWeight: 900,
                        }}
                      >
                        ع+
                      </span>
                      <span
                        style={{
                          color: "#FFFFFF",
                          fontSize: 13.5,
                          fontWeight: 800,
                        }}
                      >
                        نص عريض جدًا
                      </span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={subtitleStyle.fontWeight === "extraBold"}
                      onClick={() =>
                        setSubtitleStyle((s) => ({
                          ...s,
                          fontWeight:
                            s.fontWeight === "extraBold" ? "normal" : "extraBold",
                        }))
                      }
                      className="relative rounded-full cursor-pointer transition-colors shrink-0"
                      style={{
                        width: 46,
                        height: 25,
                        backgroundColor:
                          subtitleStyle.fontWeight === "extraBold"
                            ? "#7C3AED"
                            : "rgba(255, 255, 255, 0.16)",
                      }}
                    >
                      <span
                        className="block rounded-full bg-white transition-transform"
                        style={{
                          width: 19,
                          height: 19,
                          position: "absolute",
                          top: 3,
                          left:
                            subtitleStyle.fontWeight === "extraBold" ? 4 : 23,
                        }}
                      />
                    </button>
                  </div>
                </div>

                {/* 9. Timing Offset (إزاحة التوقيت: 0.0s | -0.5s | تصفير | +0.5s) */}
                <div className="flex flex-col gap-2 pb-4 shrink-0">
                  <div className="flex items-center justify-between">
                    <span
                      style={{
                        color: "#A1A1AA",
                        fontSize: 12.5,
                        fontWeight: 700,
                      }}
                    >
                      إزاحة التوقيت
                    </span>
                    <span
                      dir="ltr"
                      style={{
                        color: "#C4B5FD",
                        fontSize: 12.5,
                        fontWeight: 800,
                      }}
                    >
                      {(subtitleStyle.timingOffsetMs / 1000).toFixed(1)}s
                    </span>
                  </div>
                  <div dir="ltr" className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSubtitleStyle((s) => ({
                          ...s,
                          timingOffsetMs: Math.min(10000, s.timingOffsetMs + 500),
                        }))
                      }
                      className="py-2.5 rounded-xl cursor-pointer text-center active:scale-95 transition-transform"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        color: "#FFFFFF",
                        fontSize: 12.5,
                        fontWeight: 800,
                      }}
                    >
                      +0.5s
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setSubtitleStyle((s) => ({
                          ...s,
                          timingOffsetMs: 0,
                        }))
                      }
                      className="py-2.5 rounded-xl cursor-pointer text-center active:scale-95 transition-transform"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        color: "#FFFFFF",
                        fontSize: 12.5,
                        fontWeight: 800,
                      }}
                    >
                      تصفير
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setSubtitleStyle((s) => ({
                          ...s,
                          timingOffsetMs: Math.max(
                            -10000,
                            s.timingOffsetMs - 500
                          ),
                        }))
                      }
                      className="py-2.5 rounded-xl cursor-pointer text-center active:scale-95 transition-transform"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        color: "#FFFFFF",
                        fontSize: 12.5,
                        fontWeight: 800,
                      }}
                    >
                      -0.5s
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 5. RIGHT-SIDE ASPECT RATIO DRAWER (Matches IMG_20261029_133244_263_9b4fcab6.jpg 1:1) ── */}
        {activeDrawer === "aspect" && (
          <div
            dir="rtl"
            data-testid="aspect-ratio-drawer"
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-y-0 right-0 z-40 flex flex-col overflow-hidden"
            style={{
              width: "min(310px, 80vw)",
              backgroundColor: "rgba(10, 10, 14, 0.94)",
              borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(16px)",
              boxShadow: "-16px 0 40px rgba(0, 0, 0, 0.85)",
            }}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <span
                style={{
                  color: "#FFFFFF",
                  fontSize: 17,
                  fontWeight: 800,
                }}
              >
                نسبة العرض إلى الارتفاع
              </span>
              <button
                onClick={() => setActiveDrawer("none")}
                className="flex items-center justify-center w-8 h-8 rounded-full cursor-pointer"
              >
                <X size={18} color="#FFFFFF" />
              </button>
            </div>

            <div className="flex flex-col py-2">
              {(
                [
                  { id: "FIT", label: "ملاءمة الشاشة" },
                  { id: "ZOOM", label: "ملء الشاشة" },
                  { id: "FILL", label: "تمديد" },
                  { id: "CENTER", label: "وسط" },
                ] as { id: RiftAspectFitMode; label: string }[]
              ).map((m) => {
                const active = fitMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setFitMode(m.id);
                      setActiveDrawer("none");
                    }}
                    className="flex items-center justify-between px-6 py-4 cursor-pointer text-right transition-colors"
                    style={{
                      backgroundColor: active
                        ? "rgba(153, 27, 27, 0.36)"
                        : "transparent",
                    }}
                  >
                    <span
                      style={{
                        color: "#FFFFFF",
                        fontSize: 15,
                        fontWeight: active ? 800 : 600,
                      }}
                    >
                      {m.label}
                    </span>
                    {active && (
                      <Check size={18} color="#EF4444" strokeWidth={2.6} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 6. PLAYER SETTINGS DRAWER (Speed, Aspect Mode, Volume & Brightness) ── */}
        {activeDrawer === "settings" && (
          <div
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-y-0 right-0 z-40 flex flex-col overflow-hidden"
            style={{
              width: "min(340px, 86vw)",
              backgroundColor: "rgba(9, 10, 12, 0.96)",
              borderLeft: "1px solid rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(20px)",
              boxShadow: "-16px 0 40px rgba(0, 0, 0, 0.85)",
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-3.5"
              style={{
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <div className="flex items-center gap-2">
                <Settings size={17} color="#A78BFA" />
                <span
                  style={{
                    color: "#FFFFFF",
                    fontSize: 14,
                    fontWeight: 900,
                  }}
                >
                  إعدادات المشغل (RiftPlayer)
                </span>
              </div>
              <button
                onClick={() => setActiveDrawer("none")}
                className="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer"
                style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
              >
                <X size={16} color="#FFFFFF" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-4">
              {/* Volume & Brightness Sliders */}
              <div
                className="p-3 rounded-xl flex flex-col gap-3"
                style={{
                  backgroundColor: "#14171C",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Volume2 size={14} color="#A78BFA" />
                    <span
                      style={{
                        color: "#FFFFFF",
                        fontSize: 11.5,
                        fontWeight: 800,
                      }}
                    >
                      مستوى الصوت ({Math.round(volume * 100)}%)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      const v = saveVolume(Number(e.target.value));
                      setVolume(v);
                      if (v > 0) setIsMuted(false);
                    }}
                    className="w-32 accent-purple-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Sun size={14} color="#FBBF24" />
                    <span
                      style={{
                        color: "#FFFFFF",
                        fontSize: 11.5,
                        fontWeight: 800,
                      }}
                    >
                      سطوع المشغل ({Math.round(brightness * 100)}%)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.2}
                    max={1}
                    step={0.05}
                    value={brightness}
                    onChange={(e) => {
                      const b = saveBrightness(Number(e.target.value));
                      setBrightness(b);
                    }}
                    className="w-32 accent-amber-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Playback Speed: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x */}
              <div>
                <div
                  style={{
                    color: "#94A3B8",
                    fontSize: 11.5,
                    fontWeight: 800,
                    marginBottom: 8,
                  }}
                >
                  سرعة التشغيل (مع حفظ الاختيار في الجلسة وطبقة صوت طبيعية)
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {SUPPORTED_SPEEDS.map((sp) => {
                    const active = playbackSpeed === sp;
                    return (
                      <button
                        key={sp}
                        onClick={() => {
                          sessionRememberedSpeed = sp;
                          setPlaybackSpeed(sp);
                        }}
                        className="py-2 rounded-xl cursor-pointer text-center"
                        style={{
                          backgroundColor: active
                            ? "rgba(124, 58, 237, 0.22)"
                            : "#14171C",
                          border: `1px solid ${
                            active ? "#7C3AED" : "rgba(255,255,255,0.08)"
                          }`,
                          color: "#FFFFFF",
                          fontSize: 11.5,
                          fontWeight: 800,
                        }}
                      >
                        {sp}x
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RiftPlayer;
