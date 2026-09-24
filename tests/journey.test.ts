import { describe, expect, it } from "vitest";
import { buildJourneyMap, computeJourneyState, smoothstep, uAtScroll, type SectionMeasurement } from "@/lib/journey";

const VH = 1000;
const sections: SectionMeasurement[] = [
  { id: "hero", top: 0, height: 1750, u: 0.1, hold: [0.55, 1] },
  { id: "about", top: 2700, height: 1500, u: 0.25 },
  { id: "highlights", top: 5150, height: 1400, u: 0.4 },
];
const DOC = 6550;

describe("buildJourneyMap", () => {
  const map = buildJourneyMap(sections, VH, DOC);

  it("starts the guide at the far end of the path (hero walk-in)", () => {
    expect(map.keyframes[0]).toEqual({ scroll: 0, u: 0 });
    expect(uAtScroll(map, 0)).toBe(0);
  });

  it("produces strictly increasing scroll keyframes and non-decreasing u", () => {
    for (let i = 1; i < map.keyframes.length; i++) {
      expect(map.keyframes[i]!.scroll).toBeGreaterThan(map.keyframes[i - 1]!.scroll);
      expect(map.keyframes[i]!.u).toBeGreaterThanOrEqual(map.keyframes[i - 1]!.u);
    }
  });

  it("holds the guide at a stop while its section is centred", () => {
    const about = map.windows[1]!;
    const mid = (about.holdFrom + about.holdTo) / 2;
    expect(uAtScroll(map, mid)).toBeCloseTo(0.25);
  });

  it("walks between stops across the transition", () => {
    const a = map.windows[1]!;
    const b = map.windows[2]!;
    const mid = (a.holdTo + b.holdFrom) / 2;
    const u = uAtScroll(map, mid);
    expect(u).toBeGreaterThan(0.25);
    expect(u).toBeLessThan(0.4);
  });

  it("clamps beyond the document end", () => {
    expect(uAtScroll(map, 1e9)).toBeCloseTo(0.4);
  });

  it("handles an empty section list", () => {
    const empty = buildJourneyMap([], VH, 3000);
    expect(uAtScroll(empty, 500)).toBe(0);
  });
});

describe("computeJourneyState", () => {
  const map = buildJourneyMap(sections, VH, DOC);

  it("reports walking before the first hold", () => {
    const s = computeJourneyState(map, 10);
    expect(s.walking).toBe(true);
    expect(s.segment).toBe(-1);
    expect(s.activeIndex).toBe(0);
  });

  it("reports holding + active section inside a hold window", () => {
    const w = map.windows[1]!;
    const s = computeJourneyState(map, (w.holdFrom + w.holdTo) / 2);
    expect(s.walking).toBe(false);
    expect(s.activeIndex).toBe(1);
    expect(s.segment).toBe(1);
  });

  it("reports the segment + progress while walking", () => {
    const a = map.windows[1]!;
    const b = map.windows[2]!;
    const s = computeJourneyState(map, a.holdTo + (b.holdFrom - a.holdTo) * 0.25);
    expect(s.walking).toBe(true);
    expect(s.segment).toBe(1);
    expect(s.segmentProgress).toBeCloseTo(0.25);
  });

  it("keeps overall and per-section progress within 0..1", () => {
    for (const y of [0, 1234, 4000, 99999]) {
      const s = computeJourneyState(map, y);
      expect(s.progress).toBeGreaterThanOrEqual(0);
      expect(s.progress).toBeLessThanOrEqual(1);
      s.sectionProgress.forEach((p) => expect(p >= 0 && p <= 1).toBe(true));
    }
  });
});

describe("smoothstep", () => {
  it("eases 0→1 and clamps", () => {
    expect(smoothstep(-1)).toBe(0);
    expect(smoothstep(0.5)).toBe(0.5);
    expect(smoothstep(2)).toBe(1);
  });
});
