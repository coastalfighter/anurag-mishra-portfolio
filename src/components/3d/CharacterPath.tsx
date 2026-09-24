"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Group, MathUtils, ShaderMaterial } from "three";
import { frameAt, getPathLength, stopU } from "@/lib/characterPath";
import { clamp01 } from "@/lib/journey";
import { SECTIONS } from "@/lib/sectionData";
import { journey } from "@/store/journeyStore";
import { Character } from "./Character";
import { guide } from "./guideState";

const CONTACT_INDEX = SECTIONS.findIndex((s) => s.id === "contact");

/* ───────────────────────── Glowing trail along the path ───────────────────────── */

const trailVertex = /* glsl */ `
  varying vec2 vUv;
  varying float vDist;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDist = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const trailFragment = /* glsl */ `
  uniform float uTime;
  uniform float uGuide;
  uniform float uLength;
  varying vec2 vUv;
  varying float vDist;
  void main() {
    float across = abs(vUv.x - 0.5) * 2.0;
    float core = exp(-across * 9.0);
    float halo = exp(-across * 2.5) * 0.25;
    float metres = vUv.y * uLength;
    float guideM = uGuide * uLength;
    float ahead = step(guideM, metres);
    // Walked part: solid ember line. Ahead: travelling dashes that invite the next step.
    float dash = step(0.55, fract(metres / 1.6 - uTime * 0.35));
    float nearAhead = exp(-max(metres - guideM, 0.0) / 22.0);
    vec3 walked = vec3(1.0, 0.1, 0.08) * (core * 1.4 + halo);
    vec3 next = vec3(1.0, 0.92, 0.86) * core * dash * nearAhead * 0.9 + vec3(1.0, 0.2, 0.15) * halo * nearAhead;
    vec3 color = mix(walked, next, ahead);
    float fog = 1.0 - smoothstep(18.0, 60.0, vDist);
    gl_FragColor = vec4(color * fog, 1.0);
  }
`;

function Trail() {
  const { geometry, material } = useMemo(() => {
    const samples = 900;
    const width = 1.1;
    const positions = new Float32Array((samples + 1) * 2 * 3);
    const uvs = new Float32Array((samples + 1) * 2 * 2);
    const indices: number[] = [];
    for (let i = 0; i <= samples; i++) {
      const u = i / samples;
      const f = frameAt(u);
      const l = f.position.clone().addScaledVector(f.right, -width / 2);
      const r = f.position.clone().addScaledVector(f.right, width / 2);
      positions.set([l.x, 0.015, l.z, r.x, 0.015, r.z], i * 6);
      uvs.set([0, u, 1, u], i * 4);
      if (i < samples) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(positions, 3));
    g.setAttribute("uv", new BufferAttribute(uvs, 2));
    g.setIndex(indices);
    g.computeBoundingSphere();
    const m = new ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uGuide: { value: 0 }, uLength: { value: getPathLength() } },
      vertexShader: trailVertex,
      fragmentShader: trailFragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    return { geometry: g, material: m };
  }, []);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((state) => {
    material.uniforms.uTime!.value = state.clock.elapsedTime;
    material.uniforms.uGuide!.value = guide.u;
  });

  return <mesh geometry={geometry} material={material} renderOrder={1} />;
}

/* ───────────────────────── Guide motion along the path ───────────────────────── */

/**
 * Converts the scroll-driven journey state into the guide's smoothed position,
 * speed and stride, then places <Character/> on the path.
 */
export function CharacterPath() {
  const group = useRef<Group>(null);

  // QA hook: append ?debug to the URL to inspect live state from the console.
  useEffect(() => {
    if (window.location.search.includes("debug")) {
      Object.assign(window, { __guide: guide, __journey: journey });
    }
  }, []);
  const pathLength = useMemo(() => getPathLength(), []);
  const heroIntroU = useMemo(() => stopU("hero") * 0.45, []);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 1 / 20);
    const s = journey.get();
    const target = Math.max(s.u, guide.intro * heroIntroU);

    const prevU = guide.u;
    if (!guide.initialised) {
      guide.u = target;
      guide.initialised = true;
    } else {
      // Lenis already smooths scroll; this only absorbs discontinuities (resize, jumps).
      guide.u = MathUtils.damp(guide.u, target, 7, dt);
    }

    const travelled = Math.abs(guide.u - prevU) * pathLength;
    guide.distance += travelled;
    const instSpeed = travelled / Math.max(dt, 1e-4);
    guide.speed = MathUtils.damp(guide.speed, instSpeed, 6, dt);
    guide.walkAmount = MathUtils.damp(guide.walkAmount, clamp01(guide.speed / 0.6), 5, dt);
    frameAt(guide.u, guide.frame);

    // Arrival gesture: scrubbed while the contact section is being read.
    const contactProgress = s.sectionProgress[CONTACT_INDEX] ?? 0;
    const arrivalTarget = s.activeSection === "contact" ? clamp01((contactProgress - 0.45) / 0.3) : 0;
    guide.arrival = MathUtils.damp(guide.arrival, arrivalTarget, 6, dt);

    if (group.current) group.current.position.copy(guide.frame.position);
  });

  return (
    <>
      <Trail />
      <group ref={group}>
        <Character />
      </group>
    </>
  );
}
