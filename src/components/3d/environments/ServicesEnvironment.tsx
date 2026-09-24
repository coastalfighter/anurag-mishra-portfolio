"use client";

import { useEffect, useMemo } from "react";
import type { CanvasTexture } from "three";
import { makeLabelTexture } from "@/lib/canvasLabel";
import { STOP_WAYPOINT } from "@/lib/characterPath";
import { AGENCIES, EDUCATION } from "@/lib/sectionData";
import { useFontsReady } from "@/hooks/useFontsReady";
import { GLOW, WaypointGroup } from "./shared";

const PANEL_W = 2.3;
const PANEL_H = 1.35;
const WALL_X = 3.4;
const LENGTH = 30;

interface PanelSpec {
  key: string;
  lines: [string, string, string];
  education?: boolean;
}

function usePanelTextures(ready: boolean): { spec: PanelSpec; texture: CanvasTexture }[] {
  const panels = useMemo<PanelSpec[]>(
    () => [
      ...AGENCIES.map((a, i) => ({ key: `a${i}`, lines: [a.agency, a.period, a.title] as [string, string, string] })),
      ...EDUCATION.map((e, i) => ({
        key: `e${i}`,
        lines: [e.school, e.period, e.programme] as [string, string, string],
        education: true,
      })),
    ],
    [],
  );
  const textures = useMemo(() => {
    if (!ready) return [];
    return panels.map((spec) => ({
      spec,
      texture: makeLabelTexture({
        width: 1024,
        height: 600,
        padding: 70,
        accentBar: spec.education ? "#f2f2ef" : "#ff0004",
        border: "rgba(255,255,255,0.08)",
        lines: [
          { text: spec.lines[1], size: 40, family: "body", color: "#9a9a9a", letterSpacing: 4 },
          { text: spec.lines[0], size: 74, weight: 700, gap: 18, wrap: true },
          { text: spec.lines[2], size: 48, family: "body", color: spec.education ? "#f2f2ef" : "#ff5a4f", gap: 22, wrap: true },
        ],
      }),
    }));
  }, [panels, ready]);
  useEffect(() => () => textures.forEach((t) => t.texture.dispose()), [textures]);
  return textures;
}

/**
 * EXPERIENCE — a long gallery corridor; every agency and school hangs on the
 * walls like framed works, most recent nearest the visitor.
 */
export function ServicesEnvironment() {
  const ready = useFontsReady();
  const panels = usePanelTextures(ready);

  return (
    <WaypointGroup waypoint={STOP_WAYPOINT.experience} mountRange={0.2} visibleRange={0.12}>
      {/* Walls */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * WALL_X, 2.3, -LENGTH / 2 + 8]} rotation-y={-side * (Math.PI / 2)}>
          <planeGeometry args={[LENGTH, 4.6]} />
          <meshStandardMaterial color="#141417" roughness={0.9} />
        </mesh>
      ))}
      {/* Ceiling light strips + floor runners */}
      {[-1.3, 1.3].map((x) => (
        <group key={x}>
          <mesh position={[x, 4.4, -LENGTH / 2 + 8]}>
            <boxGeometry args={[0.05, 0.03, LENGTH]} />
            <meshBasicMaterial color={GLOW.white} toneMapped={false} />
          </mesh>
          <mesh position={[x * 2.4, 0.02, -LENGTH / 2 + 8]}>
            <boxGeometry args={[0.03, 0.02, LENGTH]} />
            <meshBasicMaterial color={GLOW.red} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {/* Framed career panels, alternating walls */}
      {panels.map(({ spec, texture }, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        const z = 5 - Math.floor(i / 2) * 3.6;
        return (
          <group key={spec.key} position={[side * (WALL_X - 0.04), 2.05, z]} rotation-y={-side * (Math.PI / 2 - 0.18)}>
            <mesh position={[0, 0, -0.01]}>
              <planeGeometry args={[PANEL_W + 0.1, PANEL_H + 0.1]} />
              <meshBasicMaterial color={spec.education ? "#d9d9d6" : "#ff0004"} />
            </mesh>
            <mesh>
              <planeGeometry args={[PANEL_W, PANEL_H]} />
              <meshBasicMaterial map={texture} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
    </WaypointGroup>
  );
}
