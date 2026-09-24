"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { AdditiveBlending, Group, MeshBasicMaterial, ShaderMaterial } from "three";
import { STOP_WAYPOINT } from "@/lib/characterPath";
import { guide } from "../guideState";
import { FloorRing, GLOW, WaypointGroup } from "./shared";

const sunVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const sunFragment = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv - 0.5;
    float d = length(p) * 2.0;
    float disc = smoothstep(0.52, 0.48, d);
    float glow = pow(max(0.0, 1.0 - d), 3.0);
    // Horizontal "scanline" cuts across the lower half — retro-cinematic sunset.
    float y = vUv.y;
    float bands = step(0.5, fract(y * 18.0 + uTime * 0.05)) * step(y, 0.46);
    float body = disc * (1.0 - bands * smoothstep(0.46, 0.2, y));
    vec3 col = mix(vec3(1.0, 0.05, 0.03), vec3(1.0, 0.55, 0.3), smoothstep(0.1, 0.9, y));
    vec3 c = col * body * 1.6 + vec3(1.0, 0.12, 0.06) * glow * 0.8;
    gl_FragColor = vec4(c, max(body, glow * 0.8));
  }
`;

/** Backlit sun disc on the horizon — silhouettes the guide as he walks in. */
function Sun() {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: sunVertex,
        fragmentShader: sunFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        fog: false,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);
  useFrame((s) => {
    material.uniforms.uTime!.value = s.clock.elapsedTime;
  });
  return (
    <mesh position={[0, 7, -80]} material={material} renderOrder={-1}>
      <planeGeometry args={[34, 34]} />
    </mesh>
  );
}

/** The monumental gate the guide steps out of at the very start. */
function Gate() {
  const lintel = useRef<MeshBasicMaterial>(null);
  useFrame((s) => {
    // Slow "breathing" pulse on the lintel strip (HDR values feed the bloom pass).
    const k = 0.75 + Math.sin(s.clock.elapsedTime * 1.3) * 0.25;
    lintel.current?.color.setRGB(GLOW.red[0] * k, GLOW.red[1] * k, GLOW.red[2] * k);
  });
  return (
    <group position={[0, 0, -20]}>
      {[-2.8, 2.8].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 4.5, 0]}>
            <boxGeometry args={[0.5, 9, 0.5]} />
            <meshStandardMaterial color="#121214" roughness={0.8} metalness={0.3} />
          </mesh>
          <mesh position={[x > 0 ? -0.26 : 0.26, 4.5, 0]}>
            <boxGeometry args={[0.03, 8.6, 0.03]} />
            <meshBasicMaterial color={GLOW.red} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 9.1, 0]}>
        <boxGeometry args={[6.1, 0.4, 0.5]} />
        <meshStandardMaterial color="#121214" roughness={0.8} metalness={0.3} />
      </mesh>
      <mesh position={[0, 8.88, 0]}>
        <boxGeometry args={[5.1, 0.03, 0.03]} />
        <meshBasicMaterial ref={lintel} color={GLOW.red} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Distant monolith silhouettes for scale and depth. */
function Monoliths() {
  const items = useMemo(
    () =>
      [
        [-14, -34, 12],
        [-22, -48, 18],
        [16, -38, 14],
        [25, -55, 22],
        [-9, -62, 9],
        [10, -66, 11],
      ] as const,
    [],
  );
  return (
    <group>
      {items.map(([x, z, h]) => (
        <mesh key={`${x}${z}`} position={[x, h / 2, z]}>
          <boxGeometry args={[1.6, h, 1.6]} />
          <meshStandardMaterial color="#0d0d10" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * HERO — the guide walks in from the distance, through the gate, toward the camera.
 */
export function HeroEnvironment() {
  const ring = useRef<Group>(null);
  useFrame((s) => {
    if (ring.current) {
      const arrived = guide.walkAmount < 0.2 ? 1 : 0.4;
      ring.current.scale.setScalar(1 + Math.sin(s.clock.elapsedTime * 2) * 0.02 * arrived);
    }
  });
  return (
    <WaypointGroup waypoint={STOP_WAYPOINT.hero} visibleRange={0.22}>
      <Sun />
      <Gate />
      <Monoliths />
      <group ref={ring}>
        <FloorRing radius={1.5} width={0.03} opacity={0.8} />
        <FloorRing radius={2.4} width={0.015} opacity={0.35} />
      </group>
    </WaypointGroup>
  );
}
