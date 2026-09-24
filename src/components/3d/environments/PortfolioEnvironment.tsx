"use client";

import { useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import { Group, MeshBasicMaterial, type Texture } from "three";
import { STOP_WAYPOINT } from "@/lib/characterPath";
import { CASE_STUDIES, SECTIONS, type CaseStudy } from "@/lib/sectionData";
import { useWorldTexture } from "@/lib/textures";
import { journey } from "@/store/journeyStore";
import { FloorRing, GLOW, WaypointGroup } from "./shared";

const INDEX = SECTIONS.findIndex((s) => s.id === "work");
const SCREEN_W = 2.6;
const SCREEN_H = SCREEN_W * (9 / 16);
const RADIUS = 6.6;

/** Crops a texture like CSS `object-fit: cover` for the 16:9 screen. */
function coverFit(texture: Texture, imgW: number, imgH: number) {
  const screen = SCREEN_W / SCREEN_H;
  const img = imgW / imgH;
  if (img > screen) {
    texture.repeat.set(screen / img, 1);
    texture.offset.set((1 - screen / img) / 2, 0);
  } else {
    texture.repeat.set(1, img / screen);
    texture.offset.set(0, (1 - img / screen) / 2);
  }
}

function ScreenImage({ study }: { study: CaseStudy }) {
  const texture = useWorldTexture(study.thumb.src);
  const material = useRef<MeshBasicMaterial>(null);
  useEffect(() => coverFit(texture, study.thumb.width, study.thumb.height), [texture, study.thumb.width, study.thumb.height]);
  useFrame((_, dt) => {
    // Fade in once the texture has streamed in.
    if (material.current && material.current.opacity < 1) {
      material.current.opacity = Math.min(1, material.current.opacity + dt * 1.5);
    }
  });
  return (
    <mesh position={[0, 0, 0.012]}>
      <planeGeometry args={[SCREEN_W, SCREEN_H]} />
      <meshBasicMaterial ref={material} map={texture} transparent opacity={0} toneMapped={false} />
    </mesh>
  );
}

function Screen({ study, angle }: { study: CaseStudy; angle: number }) {
  const x = Math.sin(angle) * RADIUS;
  const z = Math.cos(angle) * RADIUS;
  return (
    // Face the centre, then tilt back so the aerial camera can read the screens.
    <group position={[x, 1.9, z]} rotation={[0, angle + Math.PI, 0]}>
      <group rotation-x={-0.55}>
        <mesh>
          <planeGeometry args={[SCREEN_W + 0.12, SCREEN_H + 0.12]} />
          <meshBasicMaterial color="#0a0a0c" />
        </mesh>
        <mesh position={[0, -SCREEN_H / 2 - 0.07, 0.001]}>
          <planeGeometry args={[SCREEN_W + 0.12, 0.018]} />
          <meshBasicMaterial color={GLOW.red} toneMapped={false} />
        </mesh>
        <Suspense fallback={null}>
          <ScreenImage study={study} />
        </Suspense>
      </group>
      {/* Stand */}
      <mesh position={[0, -1, -0.35]}>
        <boxGeometry args={[0.05, 1.9, 0.05]} />
        <meshStandardMaterial color="#1a1a1e" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

/**
 * WORK — a rotunda of screens showing every campaign. The ring rotates as the
 * visitor scrolls through the work grid; the camera looks down from above.
 * Textures are only requested once the guide approaches (lazy mount).
 */
export function PortfolioEnvironment() {
  const ring = useRef<Group>(null);
  const spin = useRef(0);

  useFrame((s, dt) => {
    const p = journey.get().sectionProgress[INDEX] ?? 0;
    const target = p * Math.PI * 1.4;
    spin.current += (target - spin.current) * Math.min(1, dt * 3);
    if (ring.current) ring.current.rotation.y = spin.current + s.clock.elapsedTime * 0.01;
  });

  const step = (Math.PI * 2) / CASE_STUDIES.length;

  return (
    <WaypointGroup waypoint={STOP_WAYPOINT.work} mountRange={0.22} visibleRange={0.14}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
        <circleGeometry args={[8.5, 96]} />
        <meshStandardMaterial color="#0f0f12" roughness={0.3} metalness={0.7} />
      </mesh>
      <FloorRing radius={8.5} width={0.05} y={0.02} />
      <FloorRing radius={5} width={0.015} y={0.02} opacity={0.35} color="#ffffff" />
      <FloorRing radius={1.4} width={0.03} y={0.02} opacity={0.8} />
      <group ref={ring}>
        {CASE_STUDIES.map((study, i) => (
          <Screen key={study.slug} study={study} angle={i * step} />
        ))}
      </group>
      <pointLight position={[0, 5, 0]} intensity={20} distance={14} color="#ffd9c9" />
    </WaypointGroup>
  );
}
