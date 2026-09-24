"use client";

import { ACCENTS, HEX } from "@/lib/palette";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Group, MeshBasicMaterial } from "three";
import { STOP_WAYPOINT } from "@/lib/characterPath";
import { guide } from "../guideState";
import { FloorRing, GLOW, WaypointGroup } from "./shared";

/** The monumental gate the guide steps out of at the very start. */
function Gate() {
  const lintel = useRef<MeshBasicMaterial>(null);
  useFrame((s) => {
    // Slow "breathing" pulse on the lintel strip (HDR values feed the bloom pass).
    const k = 0.75 + Math.sin(s.clock.elapsedTime * 1.3) * 0.25;
    lintel.current?.color.setRGB(GLOW.primary[0] * k, GLOW.primary[1] * k, GLOW.primary[2] * k);
  });
  return (
    <group position={[0, 0, -20]}>
      {[-2.8, 2.8].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 4.5, 0]}>
            <boxGeometry args={[0.5, 9, 0.5]} />
            <meshStandardMaterial color={HEX.stone} roughness={0.8} metalness={0.3} />
          </mesh>
          <mesh position={[x > 0 ? -0.26 : 0.26, 4.5, 0]}>
            <boxGeometry args={[0.04, 8.6, 0.04]} />
            <meshBasicMaterial color={x > 0 ? GLOW.secondary : GLOW.primary} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 9.1, 0]}>
        <boxGeometry args={[6.1, 0.4, 0.5]} />
        <meshStandardMaterial color={HEX.stone} roughness={0.8} metalness={0.3} />
      </mesh>
      <mesh position={[0, 8.88, 0]}>
        <boxGeometry args={[5.1, 0.03, 0.03]} />
        <meshBasicMaterial ref={lintel} color={GLOW.primary} toneMapped={false} />
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
      ].map(([x, z, h], i) => ({ x: x!, z: z!, h: h!, color: ACCENTS[i % ACCENTS.length]! })),
    [],
  );
  return (
    <group>
      {items.map(({ x, z, h, color }) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <mesh position={[0, h / 2, 0]}>
            <boxGeometry args={[1.6, h, 1.6]} />
            <meshStandardMaterial color={HEX.stoneLight} roughness={0.6} />
          </mesh>
          {/* Glowing cap in an accent colour */}
          <mesh position={[0, h + 0.4, 0]}>
            <octahedronGeometry args={[0.8, 0]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} flatShading />
          </mesh>
        </group>
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
      <Gate />
      <Monoliths />
      <group ref={ring}>
        <FloorRing radius={1.5} width={0.03} opacity={0.8} />
        <FloorRing radius={2.4} width={0.02} opacity={0.6} color={HEX.cyan} />
      </group>
    </WaypointGroup>
  );
}
