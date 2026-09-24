"use client";

import { Detailed } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, type ReactElement } from "react";
import { Color, Group, MeshStandardMaterial } from "three";
import { STOP_WAYPOINT } from "@/lib/characterPath";
import { ACCENTS, HEX, glow } from "@/lib/palette";
import { HIGHLIGHTS, SECTIONS, type HighlightIcon } from "@/lib/sectionData";
import { journey } from "@/store/journeyStore";
import { FloorRing, WaypointGroup } from "./shared";

const INDEX = SECTIONS.findIndex((s) => s.id === "highlights");
const OFF = new Color(HEX.stone);
/** Each glyph ignites in its own accent colour (HDR → bloom). */
const ON = ACCENTS.map((hex) => new Color(...glow(hex, 0.9)));

/** Glyph geometry per highlight at a given level of detail (0 = highest). */
function glyph(kind: HighlightIcon, lod: 0 | 1 | 2): ReactElement {
  const seg = [48, 20, 8][lod]!;
  const det = [3, 1, 0][lod]!;
  switch (kind) {
    case "calendar":
      return <boxGeometry args={[0.46, 0.46, 0.46]} />;
    case "globe":
      return <icosahedronGeometry args={[0.32, det]} />;
    case "lion":
      return <dodecahedronGeometry args={[0.32, lod === 0 ? 1 : 0]} />;
    case "hashtag":
      return <torusGeometry args={[0.26, 0.08, Math.max(6, seg / 3), seg]} />;
    case "handshake":
      return <torusKnotGeometry args={[0.2, 0.06, seg * 2, Math.max(6, seg / 4)]} />;
    case "chess":
      return <coneGeometry args={[0.26, 0.6, seg]} />;
  }
}

function Pillar({ index, icon }: { index: number; icon: HighlightIcon }) {
  const spin = useRef<Group>(null);
  const mats = useRef<MeshStandardMaterial[]>([]);
  const lit = useRef(0);
  const colour = useRef(new Color());

  useFrame((s, dt) => {
    const p = journey.get().sectionProgress[INDEX] ?? 0;
    // Each pillar lights up in turn as the visitor scrolls through the section.
    const threshold = 0.28 + index * 0.075;
    const target = p > threshold ? 1 : 0;
    lit.current += (target - lit.current) * Math.min(1, dt * 4);
    colour.current.copy(OFF).lerp(ON[index % ON.length]!, lit.current);
    mats.current.forEach((m) => m.emissive.copy(colour.current));
    if (spin.current) {
      spin.current.rotation.y += dt * (0.3 + lit.current * 0.9);
      spin.current.rotation.x = Math.sin(s.clock.elapsedTime * 0.7 + index) * 0.25;
      spin.current.position.y = 1.55 + Math.sin(s.clock.elapsedTime * 1.1 + index) * 0.06 + lit.current * 0.15;
    }
  });

  const material = (lod: number) => (
    <meshStandardMaterial
      ref={(m) => {
        if (m) mats.current[lod] = m;
      }}
      color={HEX.stoneLight}
      roughness={0.3}
      metalness={0.4}
      flatShading
      emissive={OFF}
      toneMapped={false}
    />
  );

  return (
    <group>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[0.55, 1.1, 0.55]} />
        <meshStandardMaterial color={HEX.stoneLight} roughness={0.5} metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.105, 0]}>
        <boxGeometry args={[0.56, 0.01, 0.56]} />
        <meshBasicMaterial color={glow(ACCENTS[index % ACCENTS.length]!, 2)} toneMapped={false} />
      </mesh>
      <group ref={spin} position={[0, 1.55, 0]}>
        {/* LOD: detailed glyph up close, simplified further away. */}
        <Detailed distances={[0, 12, 28]}>
          <mesh>{glyph(icon, 0)}{material(0)}</mesh>
          <mesh>{glyph(icon, 1)}{material(1)}</mesh>
          <mesh>{glyph(icon, 2)}{material(2)}</mesh>
        </Detailed>
      </group>
    </group>
  );
}

/**
 * HIGHLIGHTS — the guide walks past a row of pedestals; each glyph ignites as
 * its highlight scrolls into view.
 */
export function SkillsEnvironment() {
  return (
    <WaypointGroup waypoint={STOP_WAYPOINT.highlights}>
      {HIGHLIGHTS.map((h, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        const row = Math.floor(i / 2);
        return (
          <group key={h.text} position={[side * (1.9 + row * 0.35), 0, 1.2 - row * 2.6]}>
            <Pillar index={i} icon={h.icon} />
          </group>
        );
      })}
      <FloorRing radius={1.3} width={0.03} opacity={0.8} color={HEX.gold} />
    </WaypointGroup>
  );
}
