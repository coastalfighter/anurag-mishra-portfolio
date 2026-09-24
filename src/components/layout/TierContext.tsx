"use client";

import { createContext, useContext } from "react";
import type { RenderTier } from "@/hooks/useDeviceDetect";

/** The active rendering tier (null until detected on the client). */
export const TierContext = createContext<RenderTier | null>(null);

export function useTier(): RenderTier | null {
  return useContext(TierContext);
}

/** True when the WebGL world is rendering behind the page. */
export function useIs3D(): boolean {
  const tier = useTier();
  return tier === "full" || tier === "lite";
}
