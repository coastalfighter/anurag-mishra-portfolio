import { Vector3 } from "three";
import { frameAt, type PathFrame } from "@/lib/characterPath";

/**
 * Mutable per-frame state of the guide, written by <CharacterPath/> and read by
 * the camera, character renderers and environments inside `useFrame`.
 * Lives outside React on purpose: it changes 60×/s and must never trigger renders.
 */
export interface GuideState {
  /** Smoothed arc-length position on the path (0‥1). */
  u: number;
  frame: PathFrame;
  /** Total distance walked in world units (drives stride / animation time). */
  distance: number;
  /** Current walking speed in world units per second (unsigned). */
  speed: number;
  /** 0 = standing, 1 = full walk — smoothed, for blending idle/walk animations. */
  walkAmount: number;
  /** Intro walk-in amount (0‥1), animated once after the loader exits. */
  intro: number;
  /** Progress of the arrival gesture at the final stop (0‥1). */
  arrival: number;
  /** Set on the first frame so the camera can snap instead of flying in. */
  initialised: boolean;
  /** QA only (set from the console with ?debug): skip camera damping for deterministic captures. */
  snapCamera: boolean;
}

export const guide: GuideState = {
  u: 0,
  frame: frameAt(0),
  distance: 0,
  speed: 0,
  walkAmount: 0,
  intro: 0,
  arrival: 0,
  initialised: false,
  snapCamera: false,
};

/** Scratch vectors shared by per-frame code (never retained across frames). */
export const scratch = {
  a: new Vector3(),
  b: new Vector3(),
  c: new Vector3(),
  d: new Vector3(),
};
