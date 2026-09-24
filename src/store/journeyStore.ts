"use client";

import { useSyncExternalStore } from "react";
import type { JourneyState } from "@/lib/journey";
import type { SectionId } from "@/lib/sectionData";
import { SECTIONS } from "@/lib/sectionData";

/**
 * A tiny, allocation-light external store shared between the DOM (Lenis /
 * ScrollTrigger) and the WebGL scene.
 *
 * • The 3D scene reads `journey.get()` every frame inside `useFrame` — no React
 *   re-renders on scroll.
 * • React UI subscribes to coarse-grained slices (active section, progress)
 *   through `useJourney(selector)` which only re-renders when the slice changes.
 */

export interface JourneySnapshot extends JourneyState {
  activeSection: SectionId;
  /** Scroll velocity in px/s reported by Lenis (signed). */
  velocity: number;
  /** Set once the map has been measured at least once. */
  ready: boolean;
}

type Listener = () => void;

const initial: JourneySnapshot = {
  u: 0,
  progress: 0,
  activeIndex: 0,
  activeSection: "hero",
  sectionProgress: SECTIONS.map(() => 0),
  walking: false,
  segment: -1,
  segmentProgress: 0,
  velocity: 0,
  ready: false,
};

let state: JourneySnapshot = initial;
const listeners = new Set<Listener>();

export const journey = {
  get(): JourneySnapshot {
    return state;
  },
  set(patch: Partial<JourneySnapshot>): void {
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** Test helper. */
  reset(): void {
    state = initial;
    listeners.forEach((l) => l());
  },
};

/** Subscribe to a primitive slice of the journey state. */
export function useJourney<T extends string | number | boolean>(selector: (s: JourneySnapshot) => T): T {
  return useSyncExternalStore(
    journey.subscribe,
    () => selector(journey.get()),
    () => selector(initial),
  );
}
