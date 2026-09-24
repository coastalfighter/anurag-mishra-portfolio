"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { MeshBasicMaterial, Object3D, SpotLight } from "three";
import { makeLabelTexture } from "@/lib/canvasLabel";
import { STOP_WAYPOINT } from "@/lib/characterPath";
import { PERSON } from "@/lib/sectionData";
import { useFontsReady } from "@/hooks/useFontsReady";
import { guide } from "../guideState";
import { FloorRing, GLOW, LightCone, WaypointGroup } from "./shared";

function Monitor() {
  const ready = useFontsReady();
  const texture = useMemo(
    () =>
      ready
        ? makeLabelTexture({
            width: 1024,
            height: 620,
            padding: 70,
            background: "#0c0c0e",
            accentBar: "#ff0004",
            lines: [
              { text: PERSON.name, size: 64, weight: 700 },
              { text: PERSON.email, size: 46, family: "body", color: "#ff5a4f", gap: 34 },
              { text: PERSON.phone, size: 46, family: "body", color: "#d9d9d6", gap: 10 },
              { text: PERSON.location, size: 40, family: "body", color: "#8d8d8d", gap: 26 },
            ],
          })
        : null,
    [ready],
  );
  useEffect(() => () => texture?.dispose(), [texture]);
  return (
    <group position={[0, 1.2, -0.15]} rotation-x={-0.06}>
      <mesh>
        <boxGeometry args={[1.12, 0.7, 0.04]} />
        <meshStandardMaterial color="#0e0e10" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.021]}>
        <planeGeometry args={[1.06, 0.64]} />
        {texture ? <meshBasicMaterial map={texture} toneMapped={false} /> : <meshBasicMaterial color="#0c0c0e" />}
      </mesh>
      <mesh position={[0, -0.43, -0.02]}>
        <boxGeometry args={[0.06, 0.2, 0.06]} />
        <meshStandardMaterial color="#1b1b1f" />
      </mesh>
    </group>
  );
}

/**
 * CONTACT — the journey ends at a writer's desk in front of a doorway of light.
 */
export function ContactEnvironment() {
  const lamp = useRef<SpotLight>(null);
  const lampTarget = useRef<Object3D>(null);
  const door = useRef<MeshBasicMaterial>(null);

  useFrame((s) => {
    if (lamp.current && lampTarget.current && lamp.current.target !== lampTarget.current) {
      lamp.current.target = lampTarget.current;
    }
    if (door.current) {
      // The doorway brightens as the guide completes his arrival.
      const k = 0.35 + guide.arrival * 0.3 + Math.sin(s.clock.elapsedTime * 0.8) * 0.03;
      door.current.color.setRGB(GLOW.warm[0] * k, GLOW.warm[1] * k, GLOW.warm[2] * k);
    }
  });

  return (
    <WaypointGroup waypoint={STOP_WAYPOINT.contact} mountRange={0.2} visibleRange={0.14}>
      {/* Desk */}
      <group position={[-1.25, 0, -1.4]} rotation-y={0.35}>
        <mesh position={[0, 0.76, 0]}>
          <boxGeometry args={[2.2, 0.06, 0.95]} />
          <meshStandardMaterial color="#1c1a19" roughness={0.35} metalness={0.2} />
        </mesh>
        {[
          [-1.02, -0.4],
          [1.02, -0.4],
          [-1.02, 0.4],
          [1.02, 0.4],
        ].map(([x, z]) => (
          <mesh key={`${x}${z}`} position={[x!, 0.37, z!]}>
            <boxGeometry args={[0.05, 0.74, 0.05]} />
            <meshStandardMaterial color="#111" metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
        <Monitor />
        {/* Lamp */}
        <group position={[0.85, 0.79, -0.2]}>
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.6, 8]} />
            <meshStandardMaterial color="#222" metalness={0.8} />
          </mesh>
          <mesh position={[-0.1, 0.62, 0]} rotation-z={0.9}>
            <coneGeometry args={[0.1, 0.16, 24, 1, true]} />
            <meshStandardMaterial color="#222" metalness={0.6} side={2} />
          </mesh>
          <mesh position={[-0.13, 0.58, 0]}>
            <sphereGeometry args={[0.03, 12, 12]} />
            <meshBasicMaterial color={GLOW.warm} toneMapped={false} />
          </mesh>
          <spotLight ref={lamp} position={[-0.13, 0.58, 0]} angle={0.7} penumbra={0.7} intensity={6} distance={4} color="#ffcf9a" />
          <object3D ref={lampTarget} position={[-0.6, -0.8, 0.2]} />
        </group>
      </group>

      {/* Doorway of light — the destination */}
      <group position={[0.6, 0, -6.5]}>
        {[-1.3, 1.3].map((x) => (
          <mesh key={x} position={[x, 1.7, 0]}>
            <boxGeometry args={[0.18, 3.4, 0.18]} />
            <meshStandardMaterial color="#141416" />
          </mesh>
        ))}
        <mesh position={[0, 3.45, 0]}>
          <boxGeometry args={[2.78, 0.18, 0.18]} />
          <meshStandardMaterial color="#141416" />
        </mesh>
        <mesh position={[0, 1.7, -0.05]}>
          <planeGeometry args={[2.42, 3.4]} />
          <meshBasicMaterial ref={door} color={GLOW.warm} toneMapped={false} />
        </mesh>
      </group>
      <mesh rotation-x={-Math.PI / 2} position={[0.6, 0.015, -4.6]}>
        <planeGeometry args={[2.4, 4]} />
        <meshBasicMaterial color={[0.9, 0.55, 0.3]} transparent opacity={0.12} depthWrite={false} toneMapped={false} />
      </mesh>

      <FloorRing radius={1.4} width={0.03} opacity={0.85} />
      <FloorRing radius={2.1} width={0.012} opacity={0.3} color="#ffffff" />
      <LightCone height={7} radius={1.6} intensity={0.2} color={[1, 0.8, 0.6]} />
    </WaypointGroup>
  );
}
