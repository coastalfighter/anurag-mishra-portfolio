"use client";

import { useJourney } from "@/store/journeyStore";
import type { SectionId } from "@/lib/sectionData";

/** Overall page progress 0‥1 (re-renders at most once per animation frame of scrolling). */
export function useScrollProgress(): number {
  return useJourney((s) => s.progress);
}

/** The section currently framed by the camera. */
export function useActiveSection(): SectionId {
  return useJourney((s) => s.activeSection);
}
