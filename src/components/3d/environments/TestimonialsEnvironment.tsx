"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Group } from "three";
import { makeLabelTexture } from "@/lib/canvasLabel";
import { STOP_WAYPOINT } from "@/lib/characterPath";
import { AWARDS, PUBLICATIONS, SECTIONS } from "@/lib/sectionData";
import { useFontsReady } from "@/hooks/useFontsReady";
import { journey } from "@/store/journeyStore";
import { FloorRing, GLOW, LightCone, WaypointGroup } from "./shared";

const INDEX = SECTIONS.findIndex((s) => s.id === "awards");

/**
 * AWARDS (social proof) — the guide stands at the centre of a dais while a crown
 * of award plaques orbits overhead and the press titles circle below.
 */
export function TestimonialsEnvironment() {
  const ready = useFontsReady();
  const crown = useRef<Group>(null);
  const press = useRef<Group>(null);
  const spin = useRef(0);

  const awardTextures = useMemo(() => {
    if (!ready) return [];
    return AWARDS.map((a) =>
      makeLabelTexture({
        width: 768,
        height: 480,
        padding: 56,
        accentBar: "#ff0004",
        lines: [
          { text: a.show, size: 56, weight: 700, wrap: true },
          { text: a.entries[0] ?? "", size: 36, family: "body", color: "#bdbdbd", gap: 20, wrap: true },
        ],
      }),
    );
  }, [ready]);

  const pressTextures = useMemo(() => {
    if (!ready) return [];
    return PUBLICATIONS.map((p) =>
      makeLabelTexture({
        width: 768,
        height: 200,
        padding: 40,
        background: "rgba(10,10,12,0.9)",
        align: "center",
        lines: [{ text: p, size: 58, weight: 700, color: "#f2f2ef", gap: 30, letterSpacing: 6 }],
      }),
    );
  }, [ready]);

  useEffect(() => () => [...awardTextures, ...pressTextures].forEach((t) => t.dispose()), [awardTextures, pressTextures]);

  useFrame((s, dt) => {
    const p = journey.get().sectionProgress[INDEX] ?? 0;
    spin.current += ((p * Math.PI * 1.2) - spin.current) * Math.min(1, dt * 2.5);
    const t = s.clock.elapsedTime;
    if (crown.current) {
      crown.current.rotation.y = spin.current + t * 0.07;
      crown.current.children.forEach((c, i) => {
        c.position.y = Math.sin(t * 0.9 + i * 0.8) * 0.12;
      });
    }
    if (press.current) press.current.rotation.y = -spin.current * 0.8 - t * 0.05;
  });

  const crownRadius = 3.6;
  const pressRadius = 3.0;

  return (
    <WaypointGroup waypoint={STOP_WAYPOINT.awards} mountRange={0.2} visibleRange={0.12}>
      {/* Dais */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[2.3, 2.5, 0.16, 96]} />
        <meshStandardMaterial color="#141417" roughness={0.3} metalness={0.7} />
      </mesh>
      <FloorRing radius={2.32} width={0.04} y={0.165} />
      <FloorRing radius={4.4} width={0.02} y={0.02} opacity={0.4} color="#ffffff" />
      <LightCone height={9} radius={2.4} intensity={0.22} color={[1, 0.4, 0.3]} />
      <spotLight position={[0, 9, 1]} angle={0.4} penumbra={0.9} intensity={40} distance={16} color="#ffd0c0" />

      {/* Halo */}
      <mesh position={[0, 4.35, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[crownRadius + 0.2, 0.02, 8, 160]} />
        <meshBasicMaterial color={GLOW.red} toneMapped={false} />
      </mesh>

      {/* Award crown */}
      <group position={[0, 3.3, 0]}>
        <group ref={crown}>
          {awardTextures.map((tex, i) => {
            const a = (i / awardTextures.length) * Math.PI * 2;
            return (
              <group key={AWARDS[i]!.show} position={[Math.sin(a) * crownRadius, 0, Math.cos(a) * crownRadius]} rotation-y={a}>
                <mesh rotation-x={0.28}>
                  <planeGeometry args={[1.35, 0.84]} />
                  <meshBasicMaterial map={tex} toneMapped={false} transparent />
                </mesh>
              </group>
            );
          })}
        </group>
      </group>

      {/* Press ring */}
      <group ref={press} position={[0, 0.55, 0]}>
        {pressTextures.map((tex, i) => {
          const a = (i / pressTextures.length) * Math.PI * 2 + 0.4;
          return (
            <mesh key={PUBLICATIONS[i]} position={[Math.sin(a) * pressRadius, 0, Math.cos(a) * pressRadius]} rotation-y={a}>
              <planeGeometry args={[1.5, 0.39]} />
              <meshBasicMaterial map={tex} toneMapped={false} transparent />
            </mesh>
          );
        })}
      </group>
    </WaypointGroup>
  );
}
