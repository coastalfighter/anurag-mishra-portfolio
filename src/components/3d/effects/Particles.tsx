"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { AdditiveBlending, BufferAttribute, BufferGeometry, ShaderMaterial } from "three";
import { frameAt } from "@/lib/characterPath";

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSeed;
  attribute float aSize;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    // Slow upward drift with a lazy sideways sway; wraps every 8 m.
    p.y = mod(p.y + uTime * (0.08 + aSeed * 0.12), 8.0);
    p.x += sin(uTime * 0.3 + aSeed * 12.0) * 0.4;
    p.z += cos(uTime * 0.25 + aSeed * 9.0) * 0.4;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * (22.0 / -mv.z);
    float heightFade = smoothstep(0.0, 1.0, p.y) * (1.0 - smoothstep(6.0, 8.0, p.y));
    float distFade = 1.0 - smoothstep(12.0, 40.0, -mv.z);
    vAlpha = heightFade * distFade * (0.35 + aSeed * 0.65);
  }
`;

const fragment = /* glsl */ `
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * vAlpha;
    gl_FragColor = vec4(vec3(1.0, 0.72, 0.6) * a, a);
  }
`;

/** Floating dust / ember particles distributed along the whole journey. */
export function Particles({ count }: { count: number }) {
  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    // Deterministic pseudo-random so SSR/CSR and re-mounts look identical.
    let s = 1337;
    const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
    for (let i = 0; i < count; i++) {
      const f = frameAt(rand());
      const lateral = (rand() - 0.5) * 22;
      const along = (rand() - 0.5) * 6;
      positions[i * 3] = f.position.x + f.right.x * lateral + f.forward.x * along;
      positions[i * 3 + 1] = rand() * 8;
      positions[i * 3 + 2] = f.position.z + f.right.z * lateral + f.forward.z * along;
      seeds[i] = rand();
      sizes[i] = 0.6 + rand() * 1.8;
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(positions, 3));
    g.setAttribute("aSeed", new BufferAttribute(seeds, 1));
    g.setAttribute("aSize", new BufferAttribute(sizes, 1));
    g.computeBoundingSphere();
    const m = new ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 } },
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    return { geometry: g, material: m };
  }, [count]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((state) => {
    material.uniforms.uTime!.value = state.clock.elapsedTime;
    material.uniforms.uPixelRatio!.value = state.gl.getPixelRatio();
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
