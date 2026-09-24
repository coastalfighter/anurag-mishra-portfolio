"use client";

import { useProgress } from "@react-three/drei";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { RenderTier } from "@/hooks/useDeviceDetect";
import { EASE } from "@/lib/gsapConfig";
import { CHARACTER } from "@/lib/characterConfig";
import { PERSON } from "@/lib/sectionData";
import { loadStore, useLoadState } from "@/store/loadStore";

interface Props {
  tier: RenderTier | null;
  /** Called once the exit animation has completed. */
  onComplete: () => void;
}

const MIN_DURATION_MS = 1400;
const MAX_DURATION_MS = 12000; // never trap visitors behind a stalled download

/** Preloads the images the 2D fallback needs and reports 0‥100. */
function usePreloadImages(urls: string[], enabled: boolean): number {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let done = 0;
    let alive = true;
    urls.forEach((src) => {
      const img = new Image();
      const finish = () => {
        done += 1;
        if (alive) setPct(Math.round((done / urls.length) * 100));
      };
      img.onload = finish;
      img.onerror = finish;
      img.src = src;
    });
    return () => {
      alive = false;
    };
  }, [urls, enabled]);
  return pct;
}

const FALLBACK_ASSETS = [CHARACTER.sprite.url, "/assets/videos/character-walk-poster.jpg"];

/**
 * Cinematic loader: the guide's silhouette fills from the feet up as assets
 * stream in, then the curtain lifts onto the hero.
 */
export function LoadingScreen({ tier, onComplete }: Props) {
  const three = useProgress();
  const sceneReady = useLoadState((s) => s.sceneReady);
  const is3D = tier === "full" || tier === "lite";
  const fallbackPct = usePreloadImages(FALLBACK_ASSETS, tier === "fallback");
  const [visible, setVisible] = useState(true);
  const [display, setDisplay] = useState(0);
  const [tick, setTick] = useState(0);
  const start = useRef<number>(0);
  const completed = useRef(false);

  useEffect(() => {
    start.current = performance.now();
    // Heartbeat so the timeout path is re-evaluated even if progress stalls.
    const id = window.setInterval(() => setTick((t) => t + 1), 500);
    return () => window.clearInterval(id);
  }, []);

  // Real progress for the current tier.
  let target = 0;
  if (tier === "static") target = 100;
  else if (tier === "fallback") target = fallbackPct;
  else if (is3D) {
    const assets = three.total > 0 ? three.progress : sceneReady ? 100 : 0;
    target = Math.min(assets, sceneReady ? 100 : 92);
  }

  // Ease the displayed number toward the target.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setDisplay((d) => {
        const next = d + (target - d) * 0.12;
        return Math.abs(target - next) < 0.5 ? target : next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  // Finish when fully loaded (and the minimum duration has elapsed) or on timeout.
  useEffect(() => {
    if (tier === null || completed.current) return;
    const elapsed = performance.now() - start.current;
    const ready = display >= 99.5 && (!is3D || (sceneReady && !three.active));
    if (ready || elapsed > MAX_DURATION_MS) {
      const wait = Math.max(0, MIN_DURATION_MS - elapsed);
      const id = window.setTimeout(() => {
        completed.current = true;
        setVisible(false);
      }, wait);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [display, is3D, sceneReady, three.active, tier, tick]);

  const pct = Math.round(display);

  return (
    <AnimatePresence
      onExitComplete={() => {
        loadStore.set({ introDone: true });
        onComplete();
      }}
    >
      {visible && (
        <motion.div
          key="loader"
          className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-void"
          initial={{ clipPath: "inset(0 0 0 0)" }}
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 1.1, ease: EASE.bezierInOut }}
          role="status"
          aria-live="polite"
          aria-label={`Loading the experience, ${pct} percent`}
        >
          {/* Silhouette: frame 0 of the walk cycle used as a mask, filled from the feet up. */}
          <div className="relative h-[42vh] max-h-[420px] min-h-[240px]" style={{ aspectRatio: "200 / 360" }} aria-hidden="true">
            <div
              className="absolute inset-0"
              style={{
                WebkitMaskImage: `url(${CHARACTER.sprite.url})`,
                maskImage: `url(${CHARACTER.sprite.url})`,
                WebkitMaskSize: "1200% 800%",
                maskSize: "1200% 800%",
                WebkitMaskPosition: "0% 0%",
                maskPosition: "0% 0%",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
              }}
            >
              <div className="absolute inset-0 bg-white/[0.07]" />
              <motion.div
                className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-signal via-ember to-paper"
                style={{ height: `${display}%` }}
              />
              <motion.div
                className="absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-white/25 to-transparent"
                animate={{ top: ["-10%", "105%"] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
              />
            </div>
          </div>

          <div className="mt-10 flex w-[min(320px,70vw)] flex-col items-center gap-4">
            <p className="font-display text-xs font-black tracking-[0.5em] text-paper">{PERSON.name}</p>
            <div className="h-px w-full overflow-hidden bg-white/10">
              <div className="h-full origin-left bg-signal" style={{ transform: `scaleX(${display / 100})` }} />
            </div>
            <p className="font-body text-sm tabular-nums tracking-[0.3em] text-mute">{String(pct).padStart(3, "0")}%</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
