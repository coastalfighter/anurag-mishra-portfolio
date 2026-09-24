"use client";

import { MotionConfig } from "framer-motion";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { useDeviceDetect } from "@/hooks/useDeviceDetect";
import { registerGsap } from "@/lib/gsapConfig";
import { guide } from "@/components/3d/guideState";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { Navbar } from "@/components/ui/Navbar";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { SectionIndicator } from "@/components/ui/SectionIndicator";
import { ScrollManager } from "./ScrollManager";
import { SmoothScroll, useSmoothScroll } from "./SmoothScroll";
import { TierContext } from "./TierContext";

/**
 * The WebGL world is code-split and never rendered on the server — the HTML
 * content is fully server-rendered and readable without it.
 */
const Scene = dynamic(() => import("@/components/3d/Scene"), { ssr: false, loading: () => null });

/** Locks scrolling while the loader is up, then plays the guide's walk-in. */
function IntroController({ tier, children }: { tier: ReturnType<typeof useDeviceDetect>; children: ReactNode }) {
  const { setLocked, scrollToId } = useSmoothScroll();
  const lockedOnce = useRef(false);

  useEffect(() => {
    if (lockedOnce.current || !tier) return;
    lockedOnce.current = true;
    if (tier.tier !== "static") setLocked(true);
    // Always start the journey from the top unless a deep link asks otherwise.
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  }, [tier, setLocked]);

  const onComplete = useCallback(() => {
    setLocked(false);
    const hash = window.location.hash.slice(1);
    if (hash && document.getElementById(hash)) {
      scrollToId(hash, { immediate: true });
    }
    if (tier && (tier.tier === "full" || tier.tier === "lite")) {
      const { gsap } = registerGsap();
      gsap.to(guide, { intro: 1, duration: 3.4, ease: "power2.inOut", delay: 0.2 });
    }
  }, [scrollToId, setLocked, tier]);

  return (
    <>
      <LoadingScreen tier={tier?.tier ?? null} onComplete={onComplete} />
      {children}
    </>
  );
}

/**
 * Client shell for the home page: picks the rendering tier, boots smooth
 * scrolling + scroll coordination, mounts the 3D world and the floating UI.
 * `children` are the server-rendered content sections.
 */
export function ExperienceShell({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  const device = useDeviceDetect();
  const tier = device?.tier ?? null;
  const is3D = tier === "full" || tier === "lite";
  const motionOk = tier !== null && tier !== "static";

  return (
    <MotionConfig reducedMotion="user">
    <TierContext.Provider value={tier}>
      <SmoothScroll enabled={motionOk}>
        <ScrollManager animate={motionOk} />
        {is3D && <Scene tier={tier} parallax={tier === "full" && !device?.isTouch} />}
        {tier === "fallback" && (
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(180deg,#1b1f8f_0%,#6a2cf5_38%,#e0409a_72%,#ff9a4d_100%)] opacity-60"
          />
        )}
        <IntroController tier={device}>
          <ScrollProgress />
          <Navbar mode="home" />
          <SectionIndicator />
          <main id="main" className="relative z-10">
            {children}
          </main>
          {footer}
        </IntroController>
      </SmoothScroll>
    </TierContext.Provider>
    </MotionConfig>
  );
}
