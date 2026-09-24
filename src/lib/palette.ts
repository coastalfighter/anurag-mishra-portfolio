import { Color } from "three";

/**
 * ╔════════════════════════════════════════════════════════════╗
 * ║  WORLD PALETTE — "Vivid Dusk". Every 3D colour lives here.  ║
 * ╚════════════════════════════════════════════════════════════╝
 *
 * A saturated golden-hour sky (indigo → violet → hot pink → tangerine) over a
 * plum ground with a cyan/magenta light grid, and candy-bright accents for the
 * set pieces. Change these hex values to re-theme the whole world.
 */
export const HEX = {
  skyZenith: "#1b1f8f",
  skyHigh: "#6a2cf5",
  skyMid: "#e0409a",
  skyHorizon: "#ff9a4d",
  sun: "#ffe07a",
  sunEdge: "#ff5f6d",

  fog: "#9b3f9f",
  ground: "#2a1455",
  gridNear: "#35e7ff",
  gridFar: "#ff4fd8",

  hillsNear: "#3a1a7a",
  hillsFar: "#7a2d9c",

  cyan: "#22e4ff",
  magenta: "#ff3dbb",
  gold: "#ffc93c",
  lime: "#8dff6a",
  coral: "#ff6b4a",
  violet: "#8b5cff",
  white: "#fff6ee",

  /** Solid architecture (pedestals, walls, desk) — rich, not black. */
  stone: "#3b2a6b",
  stoneLight: "#5b43a0",
  wall: "#2c1f5c",
} as const;

export type PaletteKey = keyof typeof HEX;

/** Linear-space RGB triple for shader uniforms (three converts sRGB hex → linear). */
export function lin(hex: string): [number, number, number] {
  const c = new Color(hex);
  return [c.r, c.g, c.b];
}

/** Linear RGB multiplied past 1.0 so the bloom pass picks it up (materials use toneMapped={false}). */
export function glow(hex: string, intensity = 2.2): [number, number, number] {
  const [r, g, b] = lin(hex);
  return [r * intensity, g * intensity, b * intensity];
}

/** Rotating accent set used for the multicoloured set pieces. */
export const ACCENTS: readonly string[] = [HEX.cyan, HEX.magenta, HEX.gold, HEX.lime, HEX.coral, HEX.violet];

export const WORLD = {
  fogHex: HEX.fog,
  fogLinear: lin(HEX.fog),
  rimLinear: lin(HEX.cyan),
  fogDensity: 0.02,
};
