"use client";

import { HEX } from "@/lib/palette";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { AdditiveBlending, Color, DoubleSide, Group, InstancedMesh, Mesh, MeshBasicMaterial, Object3D, ShaderMaterial } from "three";
import { TRANSITION_WAYPOINTS, getWaypointU } from "@/lib/characterPath";
import { guide } from "../guideState";
import { GLOW, WaypointGroup, glowAt } from "./shared";

/* ───────────────────────── Portal (hero → about) ───────────────────────── */

const portalFragment = /* glsl */ `
  uniform float uTime;
  uniform float uNear;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p) * 2.0;
    float a = atan(p.y, p.x);
    float swirl = sin(a * 6.0 + r * 10.0 - uTime * 1.6) * 0.5 + 0.5;
    float fall = smoothstep(1.0, 0.2, r);
    float alpha = fall * (0.08 + swirl * 0.18) * (0.6 + uNear * 0.8);
    vec3 col = mix(vec3(1.0, 0.24, 0.73), vec3(0.13, 0.9, 1.0), swirl * (1.0 - r));
    gl_FragColor = vec4(col * alpha, alpha);
  }
`;

const passVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

function Portal() {
  const outer = useRef<Mesh>(null);
  const inner = useRef<Mesh>(null);
  const u0 = getWaypointU()[TRANSITION_WAYPOINTS.portal] ?? 0;
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uNear: { value: 0 } },
        vertexShader: passVertex,
        fragmentShader: portalFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);
  useFrame((s, dt) => {
    material.uniforms.uTime!.value = s.clock.elapsedTime;
    material.uniforms.uNear!.value = Math.max(0, 1 - Math.abs(guide.u - u0) / 0.03);
    if (outer.current) outer.current.rotation.z += dt * 0.25;
    if (inner.current) inner.current.rotation.z -= dt * 0.4;
  });
  return (
    <group position={[0, 2.7, 0]}>
      <mesh ref={outer}>
        <torusGeometry args={[2.7, 0.05, 12, 160]} />
        <meshBasicMaterial color={GLOW.primary} toneMapped={false} />
      </mesh>
      <mesh ref={inner}>
        <torusGeometry args={[2.45, 0.02, 8, 160, Math.PI * 1.6]} />
        <meshBasicMaterial color={GLOW.secondary} toneMapped={false} />
      </mesh>
      <mesh material={material}>
        <circleGeometry args={[2.65, 64]} />
      </mesh>
    </group>
  );
}

/* ───────────────────────── Arch walk / bridge (about → highlights) ───────────────────────── */

function ArchWalk() {
  const arches = useMemo(() => Array.from({ length: 7 }, (_, i) => -8 + i * 2.7), []);
  return (
    <group>
      {/* Deck */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[2.2, 0.08, 20]} />
        <meshStandardMaterial color={HEX.stone} roughness={0.4} metalness={0.6} />
      </mesh>
      {arches.map((z, i) => (
        <group key={z} position={[0, 0, z]}>
          <mesh rotation-z={0}>
            <torusGeometry args={[2.3, 0.03, 8, 64, Math.PI]} />
            <meshBasicMaterial color={glowAt(i)} toneMapped={false} />
          </mesh>
          {[-1.15, 1.15].map((x) => (
            <mesh key={x} position={[x, 0.45, 0]}>
              <sphereGeometry args={[0.035, 10, 10]} />
              <meshBasicMaterial color={GLOW.warm} toneMapped={false} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Hand rails */}
      {[-1.15, 1.15].map((x) => (
        <mesh key={x} position={[x, 0.9, 0]}>
          <boxGeometry args={[0.02, 0.02, 20]} />
          <meshBasicMaterial color={GLOW.secondary} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ───────────────────────── Light columns (highlights → work) ───────────────────────── */

function LightColumns() {
  const mesh = useRef<InstancedMesh>(null);
  const count = 16;
  const dummy = useMemo(() => new Object3D(), []);
  const base = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: (i % 2 ? 1 : -1) * (2.2 + ((i * 37) % 5) * 0.25),
        z: 9 - Math.floor(i / 2) * 2.4,
        h: 3 + ((i * 53) % 7) * 0.5,
      })),
    [],
  );
  const material = useMemo(() => new MeshBasicMaterial({ color: "#ffffff", toneMapped: false }), []);
  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    base.forEach((_, i) => m.setColorAt(i, new Color(...glowAt(i))));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [base]);
  useFrame((s) => {
    const m = mesh.current;
    if (!m) return;
    base.forEach((b, i) => {
      const pulse = 0.55 + 0.45 * Math.sin(s.clock.elapsedTime * 2 - i * 0.6);
      dummy.position.set(b.x, (b.h * pulse) / 2, b.z);
      dummy.scale.set(1, b.h * pulse, 1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, material, count]} frustumCulled={false}>
      <boxGeometry args={[0.05, 1, 0.05]} />
    </instancedMesh>
  );
}

/* ───────────────────────── Corridor gate (work → experience) ───────────────────────── */

function CorridorGate() {
  return (
    <group>
      {[-3.4, 3.4].map((x) => (
        <mesh key={x} position={[x, 2.4, 0]}>
          <boxGeometry args={[0.3, 4.8, 0.3]} />
          <meshStandardMaterial color={HEX.stone} />
        </mesh>
      ))}
      <mesh position={[0, 4.75, 0]}>
        <boxGeometry args={[7.1, 0.3, 0.3]} />
        <meshStandardMaterial color={HEX.stone} />
      </mesh>
      <mesh position={[0, 4.58, 0.16]}>
        <boxGeometry args={[6.4, 0.025, 0.02]} />
        <meshBasicMaterial color={GLOW.warm} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ───────────────────────── Light tunnel (experience → awards) ───────────────────────── */

function LightTunnel() {
  const group = useRef<Group>(null);
  const rings = 12;
  useFrame((s) => {
    group.current?.children.forEach((c, i) => {
      const mat = (c as Mesh).material as MeshBasicMaterial;
      const wave = 0.35 + 0.65 * Math.max(0, Math.sin(s.clock.elapsedTime * 2.2 - i * 0.55));
      const [r, g, b] = glowAt(i);
      mat.color.setRGB(r * wave, g * wave, b * wave);
    });
  });
  return (
    <group ref={group}>
      {Array.from({ length: rings }, (_, i) => (
        <mesh key={i} position={[0, 2.2, 9 - i * 1.6]}>
          <torusGeometry args={[2.6, 0.035, 8, 96]} />
          <meshBasicMaterial color={glowAt(i)} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ───────────────────────── Lantern walk (awards → contact) ───────────────────────── */

function Lanterns() {
  const group = useRef<Group>(null);
  const items = useMemo(
    () => Array.from({ length: 14 }, (_, i) => ({ x: (i % 2 ? 1 : -1) * 1.7, z: 9 - Math.floor(i / 2) * 2.6, seed: i * 1.7 })),
    [],
  );
  useFrame((s) => {
    group.current?.children.forEach((c, i) => {
      const it = items[i]!;
      c.position.y = 1.5 + Math.sin(s.clock.elapsedTime * 0.9 + it.seed) * 0.18;
    });
  });
  return (
    <group ref={group}>
      {items.map((it) => (
        <mesh key={it.seed} position={[it.x, 1.5, it.z]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshBasicMaterial color={glowAt(Math.round(it.seed / 1.7))} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/** All between-section set pieces, each culled when the guide is far away. */
export function Transitions() {
  return (
    <>
      <WaypointGroup waypoint={TRANSITION_WAYPOINTS.portal} visibleRange={0.1}>
        <Portal />
      </WaypointGroup>
      <WaypointGroup waypoint={TRANSITION_WAYPOINTS.bridge} visibleRange={0.1}>
        <ArchWalk />
      </WaypointGroup>
      <WaypointGroup waypoint={TRANSITION_WAYPOINTS.stairway} visibleRange={0.1}>
        <LightColumns />
      </WaypointGroup>
      <WaypointGroup waypoint={TRANSITION_WAYPOINTS.corridorGate} visibleRange={0.1}>
        <CorridorGate />
      </WaypointGroup>
      <WaypointGroup waypoint={TRANSITION_WAYPOINTS.lightTunnel} visibleRange={0.1}>
        <LightTunnel />
      </WaypointGroup>
      <WaypointGroup waypoint={TRANSITION_WAYPOINTS.lanterns} visibleRange={0.1}>
        <Lanterns />
      </WaypointGroup>
    </>
  );
}
