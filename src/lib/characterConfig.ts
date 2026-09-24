/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  CHARACTER ASSET CONFIG — the single place to swap the walking guide  ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * The 3D scene can render the guide in four interchangeable ways:
 *
 *   "sprite"      Transparent sprite sheet (default). Generated from your walking
 *                 video by `npm run assets:character`. Works in every browser.
 *   "video"       Transparent .webm (VP9 alpha) played as a video texture.
 *                 Chrome / Edge / Firefox. Safari automatically falls back to "sprite".
 *   "gltf"        Rigged .glb/.gltf model with a walk clip. Draco, Meshopt and KTX2
 *                 compressed models are supported. Optional LOD levels.
 *   "placeholder" Procedural capsule mannequin — no asset required.
 *
 * ▶ TO SWAP IN A NEW CHARACTER
 *   • New walking VIDEO:  replace assets-src/character-walk-source.mp4 and run
 *                         `npm run assets:character` (regenerates sprite + webm).
 *   • New SPRITE SHEET:   drop it in public/assets/character/ and update `sprite` below.
 *   • New 3D MODEL:       drop the .glb in public/assets/models/, set `mode: "gltf"`
 *                         and fill in `gltf` below (clip name, scale, rotation).
 *   • Or set NEXT_PUBLIC_CHARACTER_MODE in .env.local to switch without code changes.
 */

export type CharacterMode = "sprite" | "video" | "gltf" | "placeholder";

export interface SpriteSheetConfig {
  /** Sprite sheet image (transparent WebP/PNG), frames laid out left→right, top→bottom. */
  url: string;
  cols: number;
  rows: number;
  frameCount: number;
  /** Pixel size of one frame — only the aspect ratio matters. */
  frameWidth: number;
  frameHeight: number;
  /** [first, lastExclusive] frames of the seamless walk cycle. */
  walkLoop: readonly [number, number];
  /** Optional gesture played when the guide arrives at the final stop (contact). */
  arrivalGesture?: readonly [number, number];
}

export interface VideoCharacterConfig {
  /** Transparent WebM (VP9 + alpha). */
  url: string;
  /** Frame aspect ratio (width / height). */
  aspect: number;
  /** Duration of one seamless walk loop inside the clip, in seconds. */
  loopSeconds: number;
}

export interface GltfLod {
  url: string;
  /** Camera distance (world units) at which this level becomes active. */
  distance: number;
}

export interface GltfCharacterConfig {
  /** Highest-detail model. Draco / Meshopt / KTX2 compression supported. */
  url: string;
  /** Optional lower-detail models, ordered by increasing distance. */
  lods?: readonly GltfLod[];
  /** Name of the walk animation clip (falls back to the first clip). */
  walkClip?: string;
  /** Optional idle clip played while the guide is standing at a stop. */
  idleClip?: string;
  scale: number;
  /** Extra Y rotation (radians) if the model's forward axis isn't +Z. */
  yawOffset: number;
  /** Seconds of walk animation per world unit travelled (tune to avoid foot sliding). */
  secondsPerUnit: number;
}

export interface CharacterConfig {
  mode: CharacterMode;
  /** Visible height of the guide in world units (≈ metres). */
  height: number;
  /** Distance travelled (world units) per sprite frame / animation step — controls stride. */
  unitsPerFrame: number;
  sprite: SpriteSheetConfig;
  video: VideoCharacterConfig;
  gltf: GltfCharacterConfig;
}

const envMode = process.env.NEXT_PUBLIC_CHARACTER_MODE as CharacterMode | undefined;
const VALID_MODES: readonly CharacterMode[] = ["sprite", "video", "gltf", "placeholder"];

export const CHARACTER: CharacterConfig = {
  // ⬇️ SWAP POINT: change the default renderer here (or via NEXT_PUBLIC_CHARACTER_MODE).
  mode: envMode && VALID_MODES.includes(envMode) ? envMode : "sprite",
  height: 1.9,
  unitsPerFrame: 0.09,

  // ⬇️ SWAP POINT: sprite sheet generated from assets-src/character-walk-source.mp4
  //    (values mirror public/assets/character/walk-sprite.json).
  sprite: {
    url: "/assets/character/walk-sprite.webp",
    cols: 12,
    rows: 8,
    frameCount: 96,
    frameWidth: 200,
    frameHeight: 360,
    walkLoop: [0, 64],
    arrivalGesture: [84, 95],
  },

  // ⬇️ SWAP POINT: transparent WebM version of the same walk.
  video: {
    url: "/assets/character/walk-alpha.webm",
    aspect: 200 / 360,
    loopSeconds: 64 / 12,
  },

  // ⬇️ SWAP POINT: rigged 3D model. Put your file at public/assets/models/character.glb
  gltf: {
    url: "/assets/models/character.glb",
    lods: [
      // { url: "/assets/models/character-lod1.glb", distance: 18 },
      // { url: "/assets/models/character-lod2.glb", distance: 40 },
    ],
    walkClip: "Walk",
    idleClip: "Idle",
    scale: 1,
    yawOffset: 0,
    secondsPerUnit: 0.55,
  },
};

/** Transparent VP9 WebM is not supported by Safari/iOS — detect so we can fall back to the sprite. */
export function supportsAlphaWebm(): boolean {
  if (typeof document === "undefined") return false;
  const ua = navigator.userAgent;
  const isSafari = /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(ua);
  if (isSafari) return false;
  const v = document.createElement("video");
  return v.canPlayType('video/webm; codecs="vp9"') !== "";
}

/** Returns the frame index of the walk cycle for a given distance travelled. */
export function walkFrameForDistance(distance: number, sprite: SpriteSheetConfig, unitsPerFrame: number): number {
  const [start, end] = sprite.walkLoop;
  const len = Math.max(1, end - start);
  const step = Math.floor(Math.abs(distance) / unitsPerFrame);
  return start + (((step % len) + len) % len);
}
