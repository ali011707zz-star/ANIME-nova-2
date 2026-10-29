import { useEffect, useState } from "react";

/**
 * Mirrors artifacts/nova-mobile/utils/tv.tsx:
 * Automatically detects Android TV / Smart TV runtimes via User-Agent,
 * platform constants, URL query (?tv=1), or landscape TV window dimensions
 * (longEdge >= 900 && shortEdge >= 500).
 */
export function isTvDevice(width?: number, height?: number): boolean {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tv") === "1" || params.get("tv") === "true") {
      return true;
    }
    if (params.get("tv") === "0" || params.get("tv") === "false") {
      return false;
    }

    const ua = String(window.navigator?.userAgent ?? "").toLowerCase();
    if (
      ua.includes("android tv") ||
      ua.includes("smart-tv") ||
      ua.includes("smarttv") ||
      ua.includes("googletv") ||
      ua.includes("bravia") ||
      ua.includes("aft") ||
      ua.includes("crkey") ||
      ua.includes("tizen") ||
      ua.includes("web0s") ||
      ua.includes("netcast")
    ) {
      return true;
    }
  }

  const measuredWidth =
    width ?? (typeof window !== "undefined" ? window.innerWidth : 390);
  const measuredHeight =
    height ?? (typeof window !== "undefined" ? window.innerHeight : 844);

  const longEdge = Math.max(measuredWidth, measuredHeight);
  const shortEdge = Math.min(measuredWidth, measuredHeight);

  // Android TV commonly reports a logical 960x540 or 1280x720 landscape window
  // even when its physical output is 1080p/4K. Keep the short edge high enough
  // to avoid classifying a normal phone as a TV.
  return measuredWidth > measuredHeight && longEdge >= 900 && shortEdge >= 500;
}

export function responsiveScale(
  phoneValue: number,
  width: number,
  tv: boolean,
  tvValue?: number
): number {
  if (!tv) return phoneValue;
  const tvScale = Math.max(1.45, Math.min(1.8, width / 960));
  return Math.round(tvValue ?? phoneValue * tvScale);
}

export function getRailCardWidth(
  windowWidth: number,
  visibleCards = 3,
  gap = 10
): number {
  const wideLayout = windowWidth >= 700;
  const maxRailWidth = wideLayout ? 1400 : 960;
  const railWidth = Math.min(
    Math.max(windowWidth - (wideLayout ? 80 : 32), 0),
    maxRailWidth
  );
  const targetVisibleCards = wideLayout
    ? windowWidth >= 1200
      ? 6
      : 5
    : visibleCards;
  const minCardWidth = wideLayout ? 128 : 96;
  const maxCardWidth = wideLayout ? 185 : 180;
  const calculated = Math.floor(
    (railWidth - gap * (targetVisibleCards - 1)) / targetVisibleCards
  );
  return Math.max(minCardWidth, Math.min(maxCardWidth, calculated));
}

export function getRailSidePadding(windowWidth: number): number {
  const wideLayout = windowWidth >= 700;
  const maxRailWidth = wideLayout ? 1400 : 960;
  const railWidth = Math.min(
    Math.max(windowWidth - (wideLayout ? 80 : 32), 0),
    maxRailWidth
  );
  return Math.max(
    wideLayout ? 40 : 16,
    Math.floor((windowWidth - railWidth) / 2)
  );
}

export function getGridColumnCount(
  windowWidth: number,
  windowHeight: number
): number {
  if (isTvDevice(windowWidth, windowHeight)) {
    const contentWidth = Math.min(Math.max(windowWidth - 80, 0), 1440);
    return Math.max(5, Math.min(7, Math.floor((contentWidth + 10) / 205)));
  }
  if (windowWidth >= 1024) return 5;
  if (windowWidth >= 600) return 4;
  return 3;
}

export function useTvMetrics() {
  const [dims, setDims] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 390,
    height: typeof window !== "undefined" ? window.innerHeight : 844,
  }));

  useEffect(() => {
    const handleResize = () => {
      setDims({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const tv = isTvDevice(dims.width, dims.height);
  const size = (phoneValue: number, tvValue?: number) =>
    responsiveScale(phoneValue, dims.width, tv, tvValue);

  return {
    width: dims.width,
    height: dims.height,
    tv,
    size,
    contentWidth: tv
      ? Math.min(Math.max(dims.width - 80, 0), 1440)
      : Math.min(dims.width, 540),
    horizontalPadding: size(16, 40),
    controlTarget: size(44, 58),
  };
}

/**
 * Spatial D-Pad / Arrow-key navigation for TV remote control.
 * Moves focus between focusable buttons/cards and scrolls them into view.
 */
export function useTvSpatialNavigation(tv: boolean, onBackPress: () => void) {
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.classList.toggle("nova-tv-mode", tv);
    }
  }, [tv]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (e.key === "Escape" || (e.key === "Backspace" && !isInput)) {
        e.preventDefault();
        onBackPress();
        return;
      }

      if (!tv || isInput) return;

      const dirMap: Record<string, { dx: number; dy: number }> = {
        ArrowUp: { dx: 0, dy: -1 },
        ArrowDown: { dx: 0, dy: 1 },
        ArrowLeft: { dx: -1, dy: 0 },
        ArrowRight: { dx: 1, dy: 0 },
      };

      const dir = dirMap[e.key];
      if (!dir) return;

      const focusables = Array.from(
        document.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [data-tv-focusable="true"], input:not([disabled])'
        )
      ).filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });

      if (focusables.length === 0) return;

      e.preventDefault();
      const active = document.activeElement as HTMLElement | null;
      if (!active || !focusables.includes(active)) {
        focusables[0].focus();
        return;
      }

      const curRect = active.getBoundingClientRect();
      const curCx = curRect.left + curRect.width / 2;
      const curCy = curRect.top + curRect.height / 2;

      let bestCandidate: HTMLElement | null = null;
      let bestScore = Infinity;

      for (const cand of focusables) {
        if (cand === active) continue;
        const r = cand.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const vx = cx - curCx;
        const vy = cy - curCy;

        const primary = vx * dir.dx + vy * dir.dy;
        if (primary <= 4) continue;

        const secondary = Math.abs(vx * dir.dy + vy * dir.dx);
        const score = primary + secondary * 2.6;
        if (score < bestScore) {
          bestScore = score;
          bestCandidate = cand;
        }
      }

      if (bestCandidate) {
        bestCandidate.focus();
        bestCandidate.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tv, onBackPress]);
}
