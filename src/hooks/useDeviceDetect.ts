"use client";

import { useEffect, useState } from "react";

/**
 * Rendering tiers
 * ───────────────
 *  full     Desktop: full 3D world, post-processing, dense particles.
 *  lite     Tablet / modest hardware: 3D world, no post-processing, fewer particles, dpr 1.
 *  fallback Phones, no WebGL, or Save-Data: 2D parallax with the character video/sprite.
 *  static   prefers-reduced-motion: no WebGL, no smooth scroll, content shown statically.
 */
export type RenderTier = "full" | "lite" | "fallback" | "static";

export interface DeviceInfo {
  tier: RenderTier;
  isTouch: boolean;
  width: number;
  webgl2: boolean;
}

interface NavigatorHints extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

export function hasWebGL2(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("webgl2");
    const ok = !!ctx;
    ctx?.getExtension("WEBGL_lose_context")?.loseContext();
    return ok;
  } catch {
    return false;
  }
}

export interface TierInput {
  width: number;
  reducedMotion: boolean;
  webgl2: boolean;
  saveData: boolean;
  cores: number;
  memoryGb: number | undefined;
  coarsePointer: boolean;
}

/** Pure tier decision — exported for unit tests. */
export function decideTier(i: TierInput): RenderTier {
  if (i.reducedMotion) return "static";
  if (!i.webgl2 || i.saveData || i.width < 768) return "fallback";
  const weakHardware = i.cores < 4 || (i.memoryGb !== undefined && i.memoryGb < 4);
  if (i.width < 1024 || i.coarsePointer || weakHardware) return "lite";
  return "full";
}

const TIERS: readonly RenderTier[] = ["full", "lite", "fallback", "static"];

/** QA override: `?tier=lite` (full | lite | fallback | static) forces a rendering tier. */
function tierOverride(): RenderTier | null {
  const t = new URLSearchParams(window.location.search).get("tier");
  return t && (TIERS as readonly string[]).includes(t) ? (t as RenderTier) : null;
}

function detect(): DeviceInfo {
  const nav = navigator as NavigatorHints;
  const width = window.innerWidth;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const webgl2 = hasWebGL2();
  const tier = tierOverride() ?? decideTier({
    width,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    webgl2,
    saveData: !!nav.connection?.saveData,
    cores: nav.hardwareConcurrency ?? 4,
    memoryGb: nav.deviceMemory,
    coarsePointer,
  });
  return { tier, isTouch: coarsePointer, width, webgl2 };
}

/**
 * Detects the rendering tier on the client. Returns `null` until mounted so the
 * server-rendered HTML (all content, no WebGL) is identical for every device.
 * The tier is re-evaluated when the viewport crosses a breakpoint or the
 * reduced-motion preference changes.
 */
export function useDeviceDetect(): DeviceInfo | null {
  const [info, setInfo] = useState<DeviceInfo | null>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = detect();
        setInfo((prev) => (prev && prev.tier === next.tier && prev.isTouch === next.isTouch ? prev : next));
      });
    };
    update();
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    window.addEventListener("resize", update);
    mql.addEventListener("change", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      mql.removeEventListener("change", update);
    };
  }, []);

  return info;
}
