import { CatmullRomCurve3, MathUtils, Vector3 } from "three";
import type { SectionId } from "./sectionData";

/**
 * The guide's journey through the world.
 *
 * World conventions
 * ─────────────────
 * • Units are ≈ metres, Y is up, the ground is y = 0.
 * • The guide travels roughly toward −Z. The camera leads the guide (it sits
 *   "ahead" on the path looking back), which matches the front-facing walk of the
 *   source footage — the guide always walks *toward* the viewer.
 *
 * Local stop frame (used by environments and camera rigs)
 * ───────────────────────────────────────────────────────
 *   +Z  direction of travel = toward the camera (the camera leads the guide)
 *   +X  screen-right when the camera looks back at the guide
 *   +Y  up
 */

export const WAYPOINTS: readonly [number, number, number][] = [
  [0, 0, 0], //  0 · far distance — hero walk-in starts here
  [0, 0, -18], //  1 · HERO stop
  [4, 0, -34], //  2 · portal
  [7, 0, -50], //  3 · ABOUT stop
  [3, 0, -66], //  4 · bridge
  [-3, 0, -82], //  5 · HIGHLIGHTS stop
  [-6, 0, -99], //  6 · stairway of light
  [-4, 0, -117], //  7 · WORK stop (gallery rotunda)
  [0, 0, -133], //  8 · corridor entrance
  [2, 0, -150], //  9 · EXPERIENCE stop (corridor)
  [6, 0, -168], // 10 · light tunnel
  [6, 0, -186], // 11 · AWARDS stop
  [3, 0, -202], // 12 · lantern walk
  [0, 0, -218], // 13 · CONTACT stop (the desk)
];

/** Which waypoint each section "stops" at. */
export const STOP_WAYPOINT: Record<SectionId, number> = {
  hero: 1,
  about: 3,
  highlights: 5,
  work: 7,
  experience: 9,
  awards: 11,
  contact: 13,
};

/** Transition set-pieces between stops, keyed by waypoint index. */
export const TRANSITION_WAYPOINTS = {
  portal: 2,
  bridge: 4,
  stairway: 6,
  corridorGate: 8,
  lightTunnel: 10,
  lanterns: 12,
} as const;

export type TransitionKind = keyof typeof TRANSITION_WAYPOINTS;

let cachedCurve: CatmullRomCurve3 | null = null;
let cachedWaypointU: number[] | null = null;

export function getCurve(): CatmullRomCurve3 {
  if (!cachedCurve) {
    cachedCurve = new CatmullRomCurve3(
      WAYPOINTS.map(([x, y, z]) => new Vector3(x, y, z)),
      false,
      "centripetal",
      0.5,
    );
    cachedCurve.arcLengthDivisions = 2000;
  }
  return cachedCurve;
}

/** Arc-length fraction (0‥1) at which the curve passes through each waypoint. */
export function getWaypointU(): number[] {
  if (cachedWaypointU) return cachedWaypointU;
  const curve = getCurve();
  const segments = WAYPOINTS.length - 1;
  const perSegment = 200;
  const lengths = curve.getLengths(segments * perSegment);
  const total = lengths[lengths.length - 1] ?? 1;
  cachedWaypointU = WAYPOINTS.map((_, i) => (lengths[i * perSegment] ?? 0) / total);
  return cachedWaypointU;
}

export function getPathLength(): number {
  return getCurve().getLength();
}

export function stopU(id: SectionId): number {
  return getWaypointU()[STOP_WAYPOINT[id]] ?? 0;
}

export interface PathFrame {
  position: Vector3;
  /** Unit vector of travel (toward −Z-ish). */
  forward: Vector3;
  /** Local +X (screen right as seen from a camera looking back at the guide). */
  right: Vector3;
  /** Rotation about Y that maps local +Z onto `forward`. */
  yaw: number;
}

const UP = new Vector3(0, 1, 0);

/** Position + orientation on the path at arc-length fraction u. Allocation-free when `out` is supplied. */
export function frameAt(u: number, out?: PathFrame): PathFrame {
  const curve = getCurve();
  const t = MathUtils.clamp(u, 0, 1);
  const frame: PathFrame = out ?? { position: new Vector3(), forward: new Vector3(), right: new Vector3(), yaw: 0 };
  curve.getPointAt(t, frame.position);
  curve.getTangentAt(t, frame.forward);
  frame.forward.y = 0;
  frame.forward.normalize();
  // Local +Z = forward, so local +X = up × forward.
  frame.right.crossVectors(UP, frame.forward).normalize();
  frame.yaw = Math.atan2(frame.forward.x, frame.forward.z);
  return frame;
}

/** Transform a point from a stop's local frame into world space. */
export function localToWorld(frame: PathFrame, local: readonly [number, number, number], out = new Vector3()): Vector3 {
  return out
    .copy(frame.position)
    .addScaledVector(frame.right, local[0])
    .addScaledVector(UP, local[1])
    .addScaledVector(frame.forward, local[2]);
}

/* ───────────────────────────── Camera rigs ───────────────────────────── */

export interface CameraRig {
  /** Camera position in the local frame of the anchor. */
  offset: readonly [number, number, number];
  /** Look-at target in the local frame of the anchor. x > 0 pushes the guide to screen-left. */
  target: readonly [number, number, number];
  fov: number;
  /**
   * "guide": the rig follows the guide.
   * "stop":  the rig is pinned to the section's stop (used by the hero walk-in,
   *          where the guide approaches a static camera).
   */
  anchor: "guide" | "stop";
  /** Optional orbit sweep (radians) driven by the section's scroll progress. */
  orbit?: number;
}

/**
 * Per-section camera language (desktop). Tablet reuses these with the guide
 * centred (see `centreRig`).
 */
export const CAMERA_RIGS: Record<SectionId, CameraRig> = {
  // Low, wide, static — the guide walks out of the fog toward us.
  hero: { offset: [0, 1.25, 7.5], target: [0, 1.35, 0], fov: 38, anchor: "stop" },
  // Close three-quarter, guide on the left, bio on the right.
  about: { offset: [-1.2, 1.55, 4.6], target: [1.35, 1.2, 0], fov: 40, anchor: "guide" },
  // Side-ish angle; the guide on the right, pillars recede to the left.
  highlights: { offset: [2.8, 1.8, 5.2], target: [-1.5, 1.3, -1], fov: 42, anchor: "guide" },
  // Aerial view down into the gallery rotunda.
  work: { offset: [0, 13, 6.5], target: [0, 0, -0.5], fov: 45, anchor: "guide" },
  // Corridor: centred, slightly elevated one-point perspective.
  experience: { offset: [-0.6, 1.9, 6.2], target: [1.25, 1.3, -2], fov: 44, anchor: "guide" },
  // Low hero angle with a slow orbit while award plaques circle.
  awards: { offset: [0, 1.2, 7.4], target: [0, 2.1, 0], fov: 42, anchor: "guide", orbit: 0.9 },
  // Final destination: the desk, guide on the left, form on the right.
  contact: { offset: [-1.6, 1.7, 5.0], target: [1.5, 1.15, -0.4], fov: 38, anchor: "guide" },
};

/** Tracking shot used mid-walk between stops. */
export const TRAVEL_RIG: CameraRig = { offset: [0.4, 1.6, 5.4], target: [0, 1.3, -1.5], fov: 44, anchor: "guide" };

/** Tablet / narrow screens: keep each rig's feel but centre the guide behind the content. */
export function centreRig(rig: CameraRig): CameraRig {
  return {
    ...rig,
    offset: [0, rig.offset[1], rig.offset[2] * 1.15],
    target: [0, rig.target[1], rig.target[2]],
    fov: rig.fov + 6,
  };
}
