import type { SectionId } from "./sectionData";

/**
 * Pure functions that translate document scroll position into the guide's
 * position on the path. Kept framework-free so they can be unit-tested.
 *
 * Model
 * ─────
 * Each section owns a "hold" window: while the section is centred in the
 * viewport, the guide stands at that section's stop. The scroll distance between
 * one hold window and the next (which always includes a transition spacer) is
 * where the guide walks. The result is a monotonic, piecewise-linear map
 * scroll → u (arc-length fraction along the path).
 */

export interface SectionMeasurement {
  id: SectionId;
  /** Document-space top of the section in px. */
  top: number;
  height: number;
  /** Path parameter of this section's stop. */
  u: number;
  /**
   * Fraction of the section's "centred" window where the guide stands still.
   * Default [0.2, 0.8]. The hero uses a late start so the guide walks in.
   */
  hold?: readonly [number, number];
}

export interface Keyframe {
  scroll: number;
  u: number;
}

export interface SectionWindow {
  id: SectionId;
  /** Scroll position where the section's top reaches the middle of the viewport. */
  enter: number;
  /** Scroll position where the section's bottom reaches the middle of the viewport. */
  exit: number;
  /** Scroll range where the section is visible at all (for per-section progress). */
  visibleFrom: number;
  visibleTo: number;
  holdFrom: number;
  holdTo: number;
}

export interface JourneyMap {
  keyframes: Keyframe[];
  windows: SectionWindow[];
  maxScroll: number;
}

export interface JourneyState {
  /** Arc-length fraction along the path (0‥1). */
  u: number;
  /** Overall page progress (0‥1). */
  progress: number;
  /** Section whose centred window contains the scroll position (or the nearest). */
  activeIndex: number;
  /** 0‥1 progress through each section's visible range, by section index. */
  sectionProgress: number[];
  /** True while scroll sits inside a walk segment (not holding at a stop). */
  walking: boolean;
  /** Index of the segment being walked: from section i to i+1 (−1 before the first stop). */
  segment: number;
  /** 0‥1 progress through the current walk segment. */
  segmentProgress: number;
}

const DEFAULT_HOLD: readonly [number, number] = [0.2, 0.8];

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function buildJourneyMap(sections: readonly SectionMeasurement[], viewportHeight: number, documentHeight: number): JourneyMap {
  const maxScroll = Math.max(0, documentHeight - viewportHeight);
  const half = viewportHeight / 2;

  const windows: SectionWindow[] = sections.map((s) => {
    const enter = Math.max(0, s.top - half);
    const exit = Math.min(maxScroll, Math.max(enter, s.top + s.height - half));
    const [hf, ht] = s.hold ?? DEFAULT_HOLD;
    const span = exit - enter;
    return {
      id: s.id,
      enter,
      exit,
      visibleFrom: Math.max(0, s.top - viewportHeight),
      visibleTo: Math.min(maxScroll, s.top + s.height),
      holdFrom: enter + span * clamp01(hf),
      holdTo: enter + span * clamp01(Math.max(hf, ht)),
    };
  });

  const keyframes: Keyframe[] = [];
  const first = sections[0];
  const firstWindow = windows[0];
  if (first && firstWindow && firstWindow.holdFrom > 0) {
    keyframes.push({ scroll: 0, u: 0 });
  }
  windows.forEach((w, i) => {
    const u = sections[i]!.u;
    const prev = keyframes[keyframes.length - 1];
    // Guarantee strictly increasing scroll positions even with tiny/overlapping sections.
    const from = prev ? Math.max(w.holdFrom, prev.scroll + 1) : w.holdFrom;
    const to = Math.max(from, w.holdTo);
    keyframes.push({ scroll: from, u });
    if (to > from) keyframes.push({ scroll: to, u });
  });

  return { keyframes, windows, maxScroll };
}

/** Piecewise-linear interpolation of u for a scroll position. */
export function uAtScroll(map: JourneyMap, scroll: number): number {
  const k = map.keyframes;
  if (k.length === 0) return 0;
  if (scroll <= k[0]!.scroll) return k[0]!.u;
  const last = k[k.length - 1]!;
  if (scroll >= last.scroll) return last.u;
  // Binary search for the segment.
  let lo = 0;
  let hi = k.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (k[mid]!.scroll <= scroll) lo = mid;
    else hi = mid;
  }
  const a = k[lo]!;
  const b = k[hi]!;
  const t = (scroll - a.scroll) / (b.scroll - a.scroll || 1);
  return a.u + (b.u - a.u) * t;
}

export function computeJourneyState(map: JourneyMap, scroll: number): JourneyState {
  const { windows, maxScroll } = map;
  const u = uAtScroll(map, scroll);
  const progress = maxScroll > 0 ? clamp01(scroll / maxScroll) : 0;

  let activeIndex = 0;
  for (let i = 0; i < windows.length; i++) {
    if (scroll >= windows[i]!.enter) activeIndex = i;
  }

  const sectionProgress = windows.map((w) => {
    const span = w.visibleTo - w.visibleFrom;
    return span > 0 ? clamp01((scroll - w.visibleFrom) / span) : scroll >= w.visibleTo ? 1 : 0;
  });

  // Walk segment detection: between holdTo of i and holdFrom of i+1.
  let walking = false;
  let segment = -1;
  let segmentProgress = 0;
  const firstWindow = windows[0];
  if (firstWindow && scroll < firstWindow.holdFrom) {
    walking = true;
    segment = -1;
    segmentProgress = firstWindow.holdFrom > 0 ? clamp01(scroll / firstWindow.holdFrom) : 1;
  } else {
    for (let i = 0; i < windows.length - 1; i++) {
      const a = windows[i]!;
      const b = windows[i + 1]!;
      if (scroll > a.holdTo && scroll < b.holdFrom) {
        walking = true;
        segment = i;
        segmentProgress = clamp01((scroll - a.holdTo) / (b.holdFrom - a.holdTo || 1));
        break;
      }
      if (scroll >= a.holdFrom && scroll <= a.holdTo) {
        segment = i;
        segmentProgress = 0;
        break;
      }
    }
    if (segment === -1 && windows.length > 0) {
      segment = windows.length - 1;
    }
  }

  return { u, progress, activeIndex, sectionProgress, walking, segment, segmentProgress };
}

/** Smoothstep easing used for blending camera rigs. */
export function smoothstep(t: number): number {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}
