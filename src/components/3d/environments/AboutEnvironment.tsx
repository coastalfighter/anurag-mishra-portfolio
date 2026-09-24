"use client";

import { HEX } from "@/lib/palette";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Group } from "three";
import { STOP_WAYPOINT } from "@/lib/characterPath";
import { FloorRing, LightCone, WaypointGroup, glowAt } from "./shared";

/**
 * ABOUT — the guide stops on a circular stage under a single spotlight and
 * faces the visitor while the bio appears beside him.
 */
export function AboutEnvironment() {
  const slats = useRef<Group>(null);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    slats.current?.children.forEach((c, i) => {
      c.position.y = 2.4 + Math.sin(t * 0.6 + i * 1.3) * 0.25;
    });
  });

  return (
    <WaypointGroup waypoint={STOP_WAYPOINT.about}>
      {/* Stage */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[3, 3.1, 0.12, 96]} />
        <meshStandardMaterial color={HEX.stoneLight} roughness={0.4} metalness={0.3} />
      </mesh>
      <FloorRing radius={3.02} width={0.04} y={0.125} />
      <FloorRing radius={2.2} width={0.012} y={0.125} opacity={0.6} color={HEX.cyan} />

      {/* Key light + fake volumetric shaft */}
      <LightCone height={8} radius={1.9} intensity={0.3} color={[1, 0.75, 0.45]} />

      {/* Floating light slats behind the guide */}
      <group ref={slats} position={[0, 0, -3.4]}>
        {[-3.2, -1.9, 1.9, 3.2].map((x, i) => (
          <mesh key={x} position={[x, 2.4, i % 2 ? -0.6 : 0]}>
            <boxGeometry args={[0.04, 2.6 + (i % 2) * 0.8, 0.04]} />
            <meshBasicMaterial color={glowAt(i)} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </WaypointGroup>
  );
}
