"use client";

import { useEffect } from "react";
import { buildJourneyMap, computeJourneyState, type JourneyMap, type SectionMeasurement } from "@/lib/journey";
import { registerGsap } from "@/lib/gsapConfig";
import { stopU } from "@/lib/characterPath";
import { SECTIONS, type SectionId } from "@/lib/sectionData";
import { journey } from "@/store/journeyStore";
import { useSmoothScroll } from "./SmoothScroll";

/** Per-section hold windows (fraction of the centred window where the guide stands still). */
const HOLDS: Partial<Record<SectionId, readonly [number, number]>> = {
  // The guide walks in during the first half of the hero, then holds.
  hero: [0.55, 1],
  work: [0.1, 0.92],
  awards: [0.12, 0.9],
  contact: [0.25, 1],
};

interface Props {
  /** Enables GSAP reveal animations for [data-reveal] elements. */
  animate: boolean;
}

/**
 * Coordinates scroll → journey state:
 *  1. Measures every `[data-journey-section]` and builds the scroll→path map.
 *  2. On every scroll frame, writes the journey state to the shared store (read by WebGL).
 *  3. Registers ScrollTrigger reveal animations for section content.
 */
export function ScrollManager({ animate }: Props) {
  const { lenis } = useSmoothScroll();

  // 1 + 2: measurement and state updates.
  useEffect(() => {
    let map: JourneyMap | null = null;
    let raf = 0;
    let lastScroll = window.scrollY;
    let lastTime = performance.now();

    const measure = () => {
      const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-journey-section]"));
      const scrollY = window.scrollY;
      const measurements: SectionMeasurement[] = nodes
        .map((node) => {
          const id = node.dataset.journeySection as SectionId;
          const rect = node.getBoundingClientRect();
          return { id, top: rect.top + scrollY, height: rect.height, u: stopU(id), hold: HOLDS[id] };
        })
        .filter((m) => SECTIONS.some((s) => s.id === m.id))
        .sort((a, b) => a.top - b.top);
      map = buildJourneyMap(measurements, window.innerHeight, document.documentElement.scrollHeight);
      update();
    };

    const update = () => {
      if (!map) return;
      const scroll = window.scrollY;
      const now = performance.now();
      const dt = Math.max(1, now - lastTime) / 1000;
      const velocity = lenis ? lenis.velocity * 60 : (scroll - lastScroll) / dt;
      lastScroll = scroll;
      lastTime = now;
      const s = computeJourneyState(map, scroll);
      const activeSection = map.windows[s.activeIndex]?.id ?? "hero";
      journey.set({ ...s, activeSection, velocity, ready: true });
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(document.body);
    window.addEventListener("resize", measure);
    // Lenis emits on its own ticker; native scroll covers reduced-motion / no-Lenis mode.
    const offLenis = lenis?.on("scroll", update);
    window.addEventListener("scroll", onScroll, { passive: true });
    // Fonts & images change layout after first paint.
    void document.fonts?.ready.then(measure);
    window.addEventListener("load", measure);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      offLenis?.();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("load", measure);
    };
  }, [lenis]);

  // 3: reveal animations.
  useEffect(() => {
    const root = document.documentElement;
    if (!animate) {
      root.classList.remove("motion-ok");
      return;
    }
    root.classList.add("motion-ok");
    const { gsap, ScrollTrigger } = registerGsap();

    const ctx = gsap.context(() => {
      ScrollTrigger.batch("[data-reveal]", {
        start: "top 88%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            duration: 1.1,
            ease: "expo.out",
            stagger: 0.08,
            overwrite: true,
          }),
      });

      // Subtle parallax for elements that opt in with data-parallax="<speed>".
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        const speed = Number(el.dataset.parallax ?? "0.15");
        gsap.fromTo(
          el,
          { yPercent: speed * 50 },
          {
            yPercent: -speed * 50,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });
    });

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    return () => {
      window.removeEventListener("load", refresh);
      ctx.revert();
      root.classList.remove("motion-ok");
    };
  }, [animate]);

  return null;
}
