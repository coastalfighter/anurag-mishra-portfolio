"use client";

import Lenis from "lenis";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { registerGsap } from "@/lib/gsapConfig";

interface SmoothScrollApi {
  /** Lenis instance when smooth scrolling is active, otherwise null (native scroll). */
  lenis: Lenis | null;
  /** Scroll to a section id (without '#'). The guide walks there as the page scrolls. */
  scrollToId: (id: string, opts?: { immediate?: boolean }) => void;
  /** Pause / resume user scrolling (used while the loader is visible or a menu is open). */
  setLocked: (locked: boolean) => void;
}

const SmoothScrollContext = createContext<SmoothScrollApi>({
  lenis: null,
  scrollToId: () => {},
  setLocked: () => {},
});

export function useSmoothScroll(): SmoothScrollApi {
  return useContext(SmoothScrollContext);
}

interface Props {
  children: ReactNode;
  /** Disable Lenis entirely (reduced motion) — native scrolling is used instead. */
  enabled: boolean;
}

/**
 * Lenis smooth-scroll wrapper, driven by GSAP's ticker so ScrollTrigger, Lenis
 * and the WebGL render loop all advance in the same frame.
 */
export function SmoothScroll({ children, enabled }: Props) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const lockedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const { gsap, ScrollTrigger } = registerGsap();

    const instance = new Lenis({
      lerp: 0.085,
      wheelMultiplier: 0.9,
      smoothWheel: true,
      syncTouch: false,
      anchors: false,
    });

    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    if (lockedRef.current) instance.stop();
    // Publishing the external Lenis instance to context is the purpose of this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLenis(instance);

    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      setLenis(null);
    };
  }, [enabled]);

  const scrollToId = useCallback(
    (id: string, opts?: { immediate?: boolean }) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (lenis) {
        const distance = Math.abs(el.getBoundingClientRect().top);
        // Long jumps take longer so the walk reads as a journey, capped for usability.
        const duration = opts?.immediate ? 0 : Math.min(3.2, 1.1 + distance / 4000);
        lenis.scrollTo(el, {
          duration,
          immediate: opts?.immediate,
          easing: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
          force: true,
        });
      } else {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ behavior: reduce || opts?.immediate ? "auto" : "smooth", block: "start" });
      }
      // Move focus for keyboard & screen-reader users without a second scroll jump.
      const focusTarget = el.querySelector<HTMLElement>("[data-section-heading]") ?? el;
      if (!focusTarget.hasAttribute("tabindex")) focusTarget.setAttribute("tabindex", "-1");
      focusTarget.focus({ preventScroll: true });
      history.replaceState(null, "", id === "hero" ? window.location.pathname : `#${id}`);
    },
    [lenis],
  );

  const setLocked = useCallback(
    (locked: boolean) => {
      lockedRef.current = locked;
      document.documentElement.classList.toggle("scroll-locked", locked);
      if (!lenis) return;
      if (locked) lenis.stop();
      else lenis.start();
    },
    [lenis],
  );

  const value = useMemo<SmoothScrollApi>(() => ({ lenis, scrollToId, setLocked }), [lenis, scrollToId, setLocked]);

  return <SmoothScrollContext.Provider value={value}>{children}</SmoothScrollContext.Provider>;
}
