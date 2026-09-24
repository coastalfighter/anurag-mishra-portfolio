"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Group, Object3D, SpotLight } from "three";
import { STOP_WAYPOINT } from "@/lib/characterPath";
import { FloorRing, GLOW, LightCone, WaypointGroup, proximity } from "./shared";

/**
 * ABOUT — the guide stops on a circular stage under a single spotlight and
 * faces the visitor while the bio appears beside him.
 */
export function AboutEnvironment() {
  const slats = useRef<Group>(null);
  const spot = useRef<SpotLight>(null);
  const spotTarget = useRef<Object3D>(null);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const near = proximity(STOP_WAYPOINT.about, 0.04);
    if (spot.current) {
      spot.current.intensity = 18 + near * 50;
      if (spotTarget.current && spot.current.target !== spotTarget.current) spot.current.target = spotTarget.current;
    }
    slats.current?.children.forEach((c, i) => {
      c.position.y = 2.4 + Math.sin(t * 0.6 + i * 1.3) * 0.25;
    });
  });

  return (
    <WaypointGroup waypoint={STOP_WAYPOINT.about}>
      {/* Stage */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[3, 3.1, 0.12, 96]} />
        <meshStandardMaterial color="#141417" roughness={0.35} metalness={0.6} />
      </mesh>
      <FloorRing radius={3.02} width={0.04} y={0.125} />
      <FloorRing radius={2.2} width={0.012} y={0.125} opacity={0.4} color="#ffffff" />

      {/* Key light + fake volumetric shaft */}
      <spotLight ref={spot} position={[0, 8, 0.6]} angle={0.32} penumbra={0.8} distance={16} decay={1.6} color="#ffe6d6" />
      <object3D ref={spotTarget} position={[0, 0, 0]} />
      <LightCone height={8} radius={1.9} intensity={0.28} />

      {/* Floating light slats behind the guide */}
      <group ref={slats} position={[0, 0, -3.4]}>
        {[-3.2, -1.9, 1.9, 3.2].map((x, i) => (
          <mesh key={x} position={[x, 2.4, i % 2 ? -0.6 : 0]}>
            <boxGeometry args={[0.04, 2.6 + (i % 2) * 0.8, 0.04]} />
            <meshBasicMaterial color={i % 2 ? GLOW.white : GLOW.red} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </WaypointGroup>
  );
}
