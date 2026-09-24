"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AdditiveBlending, DoubleSide, Group, ShaderMaterial } from "three";
import { frameAt, getWaypointU } from "@/lib/characterPath";
import { HEX, glow } from "@/lib/palette";
import { guide } from "../guideState";

/**
 * Places children in the local frame of a waypoint (see characterPath.ts):
 *   +Z toward the camera / direction of travel · +X screen-right · +Y up.
 *
 * Performance:
 *  • `visibleRange` hides the group when the guide is far away (cheap culling).
 *  • `mountRange` defers mounting (and therefore texture downloads) until the
 *    guide approaches — this is how environment assets are lazy-loaded.
 */
export function WaypointGroup({
  waypoint,
  children,
  visibleRange = 0.16,
  mountRange,
}: {
  waypoint: number;
  children: ReactNode;
  visibleRange?: number;
  mountRange?: number;
}) {
  const ref = useRef<Group>(null);
  const u0 = getWaypointU()[waypoint] ?? 0;
  const frame = useMemo(() => frameAt(u0), [u0]);
  const [mounted, setMounted] = useState(mountRange === undefined);

  useFrame(() => {
    const d = Math.abs(guide.u - u0);
    if (ref.current) ref.current.visible = d < visibleRange;
    if (!mounted && mountRange !== undefined && d < mountRange) setMounted(true);
  });

  return (
    <group ref={ref} position={frame.position} rotation-y={frame.yaw}>
      {mounted ? children : null}
    </group>
  );
}

/** How close (0‥1) the guide is to a waypoint — 1 at the waypoint, 0 beyond `range`. */
export function proximity(waypoint: number, range = 0.05): number {
  const u0 = getWaypointU()[waypoint] ?? 0;
  const d = Math.abs(guide.u - u0);
  return Math.max(0, 1 - d / range);
}

/* ───────────────────────── Volumetric light cone ───────────────────────── */

const coneVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalV;
  varying vec3 vViewDir;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormalV = normalize(normalMatrix * normal);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const coneFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec2 vUv;
  varying vec3 vNormalV;
  varying vec3 vViewDir;
  void main() {
    // Fade toward the silhouette edges and toward the ground → soft god-ray look.
    float facing = pow(abs(dot(vNormalV, vViewDir)), 1.6);
    float along = pow(vUv.y, 1.4);
    float a = facing * along * uIntensity;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

/** Fake volumetric spotlight shaft (additive, no real lighting cost). */
export function LightCone({
  height = 7,
  radius = 2.2,
  color = [1, 0.8, 0.55] as [number, number, number],
  intensity = 0.35,
  position = [0, 0, 0] as [number, number, number],
}: {
  height?: number;
  radius?: number;
  color?: [number, number, number];
  intensity?: number;
  position?: [number, number, number];
}) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uColor: { value: color }, uIntensity: { value: intensity } },
        vertexShader: coneVertex,
        fragmentShader: coneFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  useEffect(() => {
    material.uniforms.uIntensity!.value = intensity;
    material.uniforms.uColor!.value = color;
  }, [material, intensity, color]);
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh position={[position[0], position[1] + height / 2, position[2]]} material={material}>
      <cylinderGeometry args={[0.08, radius, height, 48, 1, true]} />
    </mesh>
  );
}

/* ───────────────────────── Glowing floor ring ───────────────────────── */

export function FloorRing({
  radius,
  width = 0.05,
  color = HEX.magenta,
  opacity = 0.9,
  y = 0.02,
}: {
  radius: number;
  width?: number;
  color?: string;
  opacity?: number;
  y?: number;
}) {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, y, 0]}>
      <ringGeometry args={[radius - width, radius, 128]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

/**
 * Emissive colours (HDR values > 1 feed the bloom pass). Sourced from the world
 * palette in src/lib/palette.ts — edit colours there, not here.
 */
export const GLOW = {
  primary: glow(HEX.magenta, 2.4),
  secondary: glow(HEX.cyan, 2.2),
  ember: glow(HEX.coral, 2.2),
  white: glow(HEX.white, 1.6),
  warm: glow(HEX.gold, 2.2),
  lime: glow(HEX.lime, 2),
  violet: glow(HEX.violet, 2.4),
};

/** Emissive accent by index, for multicoloured sequences (arches, rings, columns…). */
export const GLOW_CYCLE = [GLOW.primary, GLOW.secondary, GLOW.warm, GLOW.lime, GLOW.ember, GLOW.violet] as const;
export function glowAt(i: number): [number, number, number] {
  return GLOW_CYCLE[((i % GLOW_CYCLE.length) + GLOW_CYCLE.length) % GLOW_CYCLE.length]!;
}
