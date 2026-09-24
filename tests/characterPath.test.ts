import { describe, expect, it } from "vitest";
import { CAMERA_RIGS, STOP_WAYPOINT, WAYPOINTS, centreRig, frameAt, getWaypointU, localToWorld, stopU } from "@/lib/characterPath";
import { CHARACTER, walkFrameForDistance } from "@/lib/characterConfig";
import { SECTIONS } from "@/lib/sectionData";

describe("character path", () => {
  it("maps every waypoint to an increasing arc-length fraction", () => {
    const u = getWaypointU();
    expect(u).toHaveLength(WAYPOINTS.length);
    expect(u[0]).toBe(0);
    expect(u[u.length - 1]).toBeCloseTo(1, 5);
    for (let i = 1; i < u.length; i++) expect(u[i]!).toBeGreaterThan(u[i - 1]!);
  });

  it("orders section stops in page order", () => {
    const stops = SECTIONS.map((s) => stopU(s.id));
    for (let i = 1; i < stops.length; i++) expect(stops[i]!).toBeGreaterThan(stops[i - 1]!);
  });

  it("defines a stop and camera rig for every section", () => {
    for (const s of SECTIONS) {
      expect(STOP_WAYPOINT[s.id]).toBeTypeOf("number");
      expect(CAMERA_RIGS[s.id].fov).toBeGreaterThan(10);
    }
  });

  it("builds an orthonormal, ground-aligned frame", () => {
    const f = frameAt(0.37);
    expect(f.forward.length()).toBeCloseTo(1);
    expect(f.right.length()).toBeCloseTo(1);
    expect(f.forward.y).toBeCloseTo(0);
    expect(f.forward.dot(f.right)).toBeCloseTo(0);
  });

  it("puts local +Z ahead of the guide (where the camera leads)", () => {
    const f = frameAt(0.5);
    const ahead = localToWorld(f, [0, 0, 5]);
    expect(ahead.clone().sub(f.position).dot(f.forward)).toBeCloseTo(5);
  });

  it("centres rigs for tablets", () => {
    const r = centreRig(CAMERA_RIGS.about);
    expect(r.offset[0]).toBe(0);
    expect(r.target[0]).toBe(0);
  });
});

describe("walk cycle", () => {
  it("stays within the walk loop for any distance", () => {
    const [a, b] = CHARACTER.sprite.walkLoop;
    for (const d of [0, 0.5, 13.37, 999, -4]) {
      const f = walkFrameForDistance(d, CHARACTER.sprite, CHARACTER.unitsPerFrame);
      expect(f).toBeGreaterThanOrEqual(a);
      expect(f).toBeLessThan(b);
    }
  });
});

describe("HD sprite sheets", () => {
  it("exist on disk and cover the walk loop + arrival gesture", async () => {
    const { existsSync } = await import("node:fs");
    const { join } = await import("node:path");
    const hd = CHARACTER.sprite.hd!;
    hd.sheets.forEach((url) => expect(existsSync(join(process.cwd(), "public", url)), url).toBe(true));
    expect(hd.sheetRows).toHaveLength(hd.sheets.length);
    const capacity = hd.sheetRows.reduce((n, rows, i) => n + (i < hd.sheets.length - 1 ? hd.framesPerSheet : rows * hd.cols), 0);
    expect(capacity).toBeGreaterThanOrEqual(hd.frameCount);
    expect(hd.walkLoop[1]).toBeLessThanOrEqual(hd.frameCount);
    expect(hd.arrivalGesture![1]).toBeLessThan(hd.frameCount);
  });

  it("keeps each sheet within the 4096px WebGL texture limit", () => {
    const hd = CHARACTER.sprite.hd!;
    expect(hd.cols * hd.frameWidth).toBeLessThanOrEqual(4096);
    hd.sheetRows.forEach((rows) => expect(rows * hd.frameHeight).toBeLessThanOrEqual(4096));
  });
});
