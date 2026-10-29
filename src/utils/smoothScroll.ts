import { useEffect, useState, useCallback, RefObject } from "react";

/**
 * Universal Smooth Drag-to-Scroll, Wheel Routing & Momentum Engine + Scroll-to-Top Tracker
 * - Prioritizes vertical page scrolling (.overflow-y-auto) so horizontal rails (.overflow-x-auto)
 *   never trap vertical swipes, mouse drags, or diagonal wheel/trackpad gestures.
 * - Uses Exponential Moving Average (EMA) velocity tracking + 60fps requestAnimationFrame
 *   inertia coasting on release.
 * - Prevents accidental card/episode clicks when dragging > 6px.
 */
export function useSmoothNavigationScroll(rootRef: RefObject<HTMLElement | null>) {
  const [showScrollTop, setShowScrollTop] = useState(false);

  const scrollToTop = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const scrollers = Array.from(
      root.querySelectorAll<HTMLElement>(".overflow-y-auto")
    );
    for (const el of scrollers) {
      if (el.offsetParent !== null && el.scrollTop > 0) {
        el.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, [rootRef]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let isDown = false;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let lastTime = 0;
    let velocityX = 0;
    let velocityY = 0;
    let movedDistance = 0;
    let lockedAxis: "x" | "y" | null = null;
    let vScroller: HTMLElement | null = null;
    let hScroller: HTMLElement | null = null;
    let momentumRaf: number | null = null;
    let suppressNextClick = false;

    const cancelMomentum = () => {
      if (momentumRaf !== null) {
        cancelAnimationFrame(momentumRaf);
        momentumRaf = null;
      }
    };

    const findScrollParents = (target: EventTarget | null) => {
      let el = target as HTMLElement | null;
      let foundH: HTMLElement | null = null;
      let foundV: HTMLElement | null = null;

      while (el && el !== root && el !== document.body) {
        const cls = el.className;
        if (typeof cls === "string") {
          if (
            !foundH &&
            cls.includes("overflow-x-auto") &&
            el.scrollWidth > el.clientWidth + 2
          ) {
            foundH = el;
          }
          if (
            !foundV &&
            cls.includes("overflow-y-auto") &&
            el.scrollHeight > el.clientHeight + 2
          ) {
            foundV = el;
          }
        }
        el = el.parentElement;
      }
      return { foundH, foundV };
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") {
        return;
      }

      cancelMomentum();
      const { foundH, foundV } = findScrollParents(target);
      if (!foundH && !foundV) return;

      isDown = true;
      lockedAxis = null;
      movedDistance = 0;
      startX = e.clientX;
      startY = e.clientY;
      lastX = e.clientX;
      lastY = e.clientY;
      lastTime = performance.now();
      velocityX = 0;
      velocityY = 0;
      hScroller = foundH;
      vScroller = foundV;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;

      const now = performance.now();
      const dt = Math.max(4, Math.min(48, now - lastTime));
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const totalDx = Math.abs(e.clientX - startX);
      const totalDy = Math.abs(e.clientY - startY);

      if (!lockedAxis) {
        // Strongly favor vertical scrolling so horizontal rails never trap vertical drags
        if (totalDy > 4 && vScroller && totalDy >= totalDx * 0.7) {
          lockedAxis = "y";
        } else if (totalDx > 8 && hScroller && totalDx > totalDy * 1.45) {
          lockedAxis = "x";
        } else if (totalDy > 6 && vScroller) {
          lockedAxis = "y";
        } else if (totalDx > 6 && !vScroller && hScroller) {
          lockedAxis = "x";
        }
      }

      if (lockedAxis === "y" && vScroller) {
        e.preventDefault();
        vScroller.scrollTop -= dy;
        const instVy = (dy / dt) * 16.67;
        velocityY = velocityY * 0.55 + instVy * 0.45;
        movedDistance += Math.abs(dy);
      } else if (lockedAxis === "x" && hScroller) {
        e.preventDefault();
        hScroller.scrollLeft -= dx;
        const instVx = (dx / dt) * 16.67;
        velocityX = velocityX * 0.55 + instVx * 0.45;
        movedDistance += Math.abs(dx);
      }

      lastX = e.clientX;
      lastY = e.clientY;
      lastTime = now;
    };

    const startMomentum = () => {
      const activeAxis = lockedAxis;
      const targetV = vScroller;
      const targetH = hScroller;
      // If user held cursor still for > 65ms before releasing, do not fling
      if (performance.now() - lastTime > 65) return;

      let vx = Math.max(-54, Math.min(54, velocityX * 1.15));
      let vy = Math.max(-64, Math.min(64, velocityY * 1.15));

      const step = () => {
        if (activeAxis === "y" && targetV) {
          if (Math.abs(vy) < 0.35) {
            momentumRaf = null;
            return;
          }
          const prev = targetV.scrollTop;
          targetV.scrollTop -= vy;
          vy *= 0.945;
          if (targetV.scrollTop === prev && Math.abs(vy) > 1) {
            momentumRaf = null;
            return;
          }
          momentumRaf = requestAnimationFrame(step);
        } else if (activeAxis === "x" && targetH) {
          if (Math.abs(vx) < 0.35) {
            momentumRaf = null;
            return;
          }
          targetH.scrollLeft -= vx;
          vx *= 0.935;
          momentumRaf = requestAnimationFrame(step);
        }
      };

      if (
        (activeAxis === "y" && Math.abs(vy) > 0.9) ||
        (activeAxis === "x" && Math.abs(vx) > 0.9)
      ) {
        momentumRaf = requestAnimationFrame(step);
      }
    };

    const onMouseUp = () => {
      if (!isDown) return;
      isDown = false;
      if (movedDistance > 6) {
        suppressNextClick = true;
        setTimeout(() => {
          suppressNextClick = false;
        }, 65);
        startMomentum();
      }
    };

    const onClickCapture = (e: MouseEvent) => {
      if (suppressNextClick) {
        e.stopPropagation();
        e.preventDefault();
        suppressNextClick = false;
      }
    };

    // Route vertical wheel gestures over horizontal rails directly to the vertical page scroller
    const onWheel = (e: WheelEvent) => {
      cancelMomentum();
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const { foundH, foundV } = findScrollParents(e.target);
      if (foundH && foundV && Math.abs(e.deltaX) > 0) {
        e.preventDefault();
        foundV.scrollTop += e.deltaY;
      }
    };

    const onScrollCapture = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        typeof target.className === "string" &&
        target.className.includes("overflow-y-auto")
      ) {
        const shouldShow = target.scrollTop > 320;
        setShowScrollTop((prev) => (prev !== shouldShow ? shouldShow : prev));
      }
    };

    root.addEventListener("mousedown", onMouseDown, { passive: true });
    window.addEventListener("mousemove", onMouseMove, { passive: false });
    window.addEventListener("mouseup", onMouseUp, { passive: true });
    root.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("click", onClickCapture, true);
    root.addEventListener("scroll", onScrollCapture, true);

    return () => {
      cancelMomentum();
      root.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("click", onClickCapture, true);
      root.removeEventListener("scroll", onScrollCapture, true);
    };
  }, [rootRef]);

  return { showScrollTop, scrollToTop };
}
