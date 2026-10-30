import { useEffect, useState } from "react";

/**
 * Automatically detects Android TV / Smart TV runtimes via User-Agent,
 * platform constants, URL query (?tv=1), or landscape TV window dimensions
 * (longEdge >= 960 && shortEdge >= 500).
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

  // Landscape large screen / Android TV (960x540, 1280x720, 1920x1080)
  return measuredWidth > measuredHeight && longEdge >= 960 && shortEdge >= 500;
}

export function isTabletDevice(width?: number, height?: number): boolean {
  const measuredWidth =
    width ?? (typeof window !== "undefined" ? window.innerWidth : 390);
  const measuredHeight =
    height ?? (typeof window !== "undefined" ? window.innerHeight : 844);
  if (isTvDevice(measuredWidth, measuredHeight)) return false;
  return measuredWidth >= 600;
}

export function responsiveScale(
  phoneValue: number,
  width: number,
  tv: boolean,
  tvValue?: number
): number {
  if (tv) {
    const tvScale = Math.max(1.22, Math.min(1.5, width / 960));
    return Math.round(tvValue ? Math.min(tvValue, phoneValue * 1.45) : phoneValue * tvScale);
  }
  if (width >= 600) {
    const tabletScale = Math.max(1.08, Math.min(1.22, width / 700));
    return Math.round(phoneValue * tabletScale);
  }
  return phoneValue;
}

export function getRailCardWidth(
  windowWidth: number,
  visibleCards = 3,
  gap = 12
): number {
  const sidePadding = getRailSidePadding(windowWidth);
  const availableWidth = Math.max(280, windowWidth - sidePadding * 2);

  let targetVisibleCards = visibleCards;
  if (windowWidth >= 1400) {
    targetVisibleCards = 7;
  } else if (windowWidth >= 1100) {
    targetVisibleCards = 6;
  } else if (windowWidth >= 820) {
    targetVisibleCards = 5;
  } else if (windowWidth >= 600) {
    targetVisibleCards = 4;
  }

  const minCardWidth = windowWidth >= 960 ? 145 : windowWidth >= 600 ? 130 : 104;
  const maxCardWidth = windowWidth >= 960 ? 205 : windowWidth >= 600 ? 185 : 165;
  const calculated = Math.floor(
    (availableWidth - gap * (targetVisibleCards - 1)) / targetVisibleCards
  );
  return Math.max(minCardWidth, Math.min(maxCardWidth, calculated));
}

export function getRailSidePadding(windowWidth: number): number {
  if (windowWidth >= 960) return 24;
  if (windowWidth >= 600) return 20;
  return 16;
}

export function getGridColumnCount(
  windowWidth: number,
  windowHeight: number
): number {
  if (isTvDevice(windowWidth, windowHeight) || windowWidth >= 1200) {
    return windowWidth >= 1500 ? 6 : 5;
  }
  if (windowWidth >= 840) return 5;
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
  const tablet = isTabletDevice(dims.width, dims.height);
  const size = (phoneValue: number, tvValue?: number) =>
    responsiveScale(phoneValue, dims.width, tv, tvValue);

  return {
    width: dims.width,
    height: dims.height,
    tv,
    tablet,
    size,
    contentWidth: dims.width,
    horizontalPadding: getRailSidePadding(dims.width),
    controlTarget: tv ? 52 : tablet ? 48 : 44,
  };
}

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "a[href]",
  '[data-tv-focusable="true"]',
  '[role="button"]',
  ".cursor-pointer",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[data-testid='player-timeline-scrubber']",
].join(", ");

/**
 * Spatial D-Pad / Arrow-key navigation for TV remote control and keyboard navigation.
 * Keeps the exact same UI while making every card, button, tab, episode, and modal item
 * smoothly navigable and activatable via D-Pad Up/Down/Left/Right, Enter/OK, and Back.
 */
export function useTvSpatialNavigation(tv: boolean, onBackPress: () => void) {
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.classList.toggle("nova-tv-mode", tv);
    }
  }, [tv]);

  // Ensure all interactive clickable cards/pills are keyboard & D-Pad focusable
  useEffect(() => {
    if (typeof document === "undefined") return;

    const upgradeFocusables = () => {
      const nodes = document.querySelectorAll<HTMLElement>(
        '[data-tv-focusable="true"], [role="button"], .cursor-pointer'
      );
      nodes.forEach((el) => {
        if (
          el.tagName !== "BUTTON" &&
          el.tagName !== "INPUT" &&
          el.tagName !== "SELECT" &&
          el.tagName !== "TEXTAREA" &&
          el.tagName !== "A" &&
          !el.hasAttribute("tabindex")
        ) {
          el.setAttribute("tabindex", "0");
        }
      });
    };

    upgradeFocusables();
    const observer = new MutationObserver(() => {
      upgradeFocusables();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const getVisibleFocusables = (): HTMLElement[] => {
      // If a modal or drawer overlay is open, scope D-Pad navigation to the topmost visible overlay
      const modalOverlays = Array.from(
        document.querySelectorAll<HTMLElement>(
          '[data-testid="brand-splash-screen"], [data-testid="telegram-announcement-modal"], [data-tv-modal="true"], [role="dialog"], .fixed.inset-0'
        )
      ).filter((el) => {
        const s = window.getComputedStyle(el);
        return (
          s.display !== "none" &&
          s.visibility !== "hidden" &&
          s.pointerEvents !== "none" &&
          Number(s.opacity) > 0.05
        );
      });

      const scopeRoot: ParentNode =
        modalOverlays.length > 0
          ? modalOverlays[modalOverlays.length - 1]
          : document;

      const allCandidates = Array.from(
        scopeRoot.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => {
        const style = window.getComputedStyle(el);
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          style.pointerEvents === "none" ||
          Number(style.opacity) === 0
        ) {
          return false;
        }
        // Skip elements inside hidden tab containers
        if (el.closest('[style*="visibility: hidden"]')) return false;
        // Skip full-screen backdrop containers that have onClick={handleClose}
        if (el.classList.contains("fixed") && el.classList.contains("inset-0")) {
          return false;
        }
        const rect = el.getBoundingClientRect();
        return rect.width > 4 && rect.height > 4;
      });

      return allCandidates;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      // Handle Back / Escape key
      if (e.key === "Escape" || e.key === "GoBack" || e.key === "BrowserBack") {
        if (isInput && target) {
          target.blur();
          e.preventDefault();
          return;
        }
        e.preventDefault();
        onBackPress();
        return;
      }

      if (e.key === "Backspace" && !isInput) {
        e.preventDefault();
        onBackPress();
        return;
      }

      // Allow exiting input fields using ArrowDown or ArrowUp on TV remote
      if (isInput && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
        e.preventDefault();
        target?.blur();
      } else if (isInput) {
        return;
      }

      // Activate focusables (buttons, links, cards, episode rows, pills) on Enter / D-Pad Center
      if (
        e.key === "Enter" ||
        e.key === "NumpadEnter" ||
        e.key === "Select" ||
        (e.key === " " &&
          target &&
          target.tagName !== "INPUT" &&
          target.tagName !== "TEXTAREA")
      ) {
        const activeEl =
          target && target !== document.body
            ? target
            : (document.activeElement as HTMLElement | null);
        if (activeEl && activeEl !== document.body) {
          if (
            activeEl.tagName === "INPUT" ||
            activeEl.tagName === "TEXTAREA"
          ) {
            activeEl.focus();
            try {
              (window as any).NovaAndroid?.showKeyboard?.();
            } catch {}
            return;
          }
          if (activeEl.tagName !== "SELECT") {
            e.preventDefault();
            activeEl.click();
            return;
          }
        }
      }

      // When RiftPlayer is active and its HUD is hidden, let RiftPlayer handle D-Pad shortcuts directly
      const playerRoot = document.querySelector('[data-testid="rift-player-root"]');
      if (playerRoot && playerRoot.getAttribute("data-hud-visible") === "false") {
        return;
      }

      const dirMap: Record<string, { dx: number; dy: number }> = {
        ArrowUp: { dx: 0, dy: -1 },
        ArrowDown: { dx: 0, dy: 1 },
        ArrowLeft: { dx: -1, dy: 0 },
        ArrowRight: { dx: 1, dy: 0 },
      };

      const dir = dirMap[e.key];
      if (!dir) return;

      const focusables = getVisibleFocusables();
      if (focusables.length === 0) return;

      e.preventDefault();
      document.body.classList.add("nova-tv-mode");

      const active = document.activeElement as HTMLElement | null;
      if (!active || !focusables.includes(active)) {
        focusables[0].focus({ preventScroll: true });
        focusables[0].scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
        return;
      }

      const curRect = active.getBoundingClientRect();
      const curCx = curRect.left + curRect.width / 2;
      const curCy = curRect.top + curRect.height / 2;

      let bestCandidate: HTMLElement | null = null;
      let bestScore = Infinity;

      for (const cand of focusables) {
        if (cand === active) continue;
        // Do not focus a parent/child of the currently active element
        if (cand.contains(active) || active.contains(cand)) continue;

        const r = cand.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const vx = cx - curCx;
        const vy = cy - curCy;

        const primary = vx * dir.dx + vy * dir.dy;
        if (primary <= 4) continue;

        const secondary = Math.abs(vx * dir.dy + vy * dir.dx);
        // Prefer candidates in the same horizontal rail or vertical column
        const score = primary + secondary * 2.35;
        if (score < bestScore) {
          bestScore = score;
          bestCandidate = cand;
        }
      }

      if (bestCandidate) {
        bestCandidate.focus({ preventScroll: true });
        bestCandidate.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      } else if (dir.dy !== 0) {
        // Scroll the active scrollable container if no candidate is immediately in range
        const scroller =
          active.closest(".overflow-y-auto, .nova-ep-scroll") ||
          document.querySelector(".overflow-y-auto, .nova-ep-scroll");
        if (scroller) {
          scroller.scrollBy({ top: dir.dy * 240, behavior: "smooth" });
        }
      }
    };

    (window as any).__novaDispatchTvKey = (key: string) => {
      const target =
        (document.activeElement as HTMLElement | null) || document.body;
      const ev = new KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
      });
      target.dispatchEvent(ev);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      delete (window as any).__novaDispatchTvKey;
    };
  }, [tv, onBackPress]);
}
