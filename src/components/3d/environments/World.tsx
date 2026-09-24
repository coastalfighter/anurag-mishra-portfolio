"use client";

import { useEffect, useMemo } from "react";
import { BackSide, ShaderMaterial } from "three";

const groundVertex = /* glsl */ `
  varying vec3 vWorld;
  varying float vDist;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vec4 mv = viewMatrix * world;
    vDist = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const groundFragment = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uLine;
  uniform vec3 uFog;
  varying vec3 vWorld;
  varying float vDist;

  float grid(vec2 p, float size, float width) {
    vec2 g = abs(fract(p / size - 0.5) - 0.5) / fwidth(p / size);
    return 1.0 - min(min(g.x, g.y) / width, 1.0);
  }

  void main() {
    float minor = grid(vWorld.xz, 2.0, 1.0) * 0.18;
    float major = grid(vWorld.xz, 10.0, 1.2) * 0.35;
    vec3 col = uBase + uLine * max(minor, major);
    float fog = 1.0 - exp(-pow(vDist * 0.028, 2.0));
    gl_FragColor = vec4(mix(col, uFog, clamp(fog, 0.0, 1.0)), 1.0);
    #include <colorspace_fragment>
  }
`;

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragment = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  varying vec3 vDir;
  void main() {
    float h = clamp(vDir.y, 0.0, 1.0);
    vec3 col = mix(uHorizon, uTop, pow(h, 0.45));
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

export const FOG_COLOR = "#0b0b0d";

/** Infinite-feeling ground grid + gradient sky dome. */
export function World() {
  const ground = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uBase: { value: [0.03, 0.03, 0.035] },
          uLine: { value: [0.55, 0.12, 0.1] },
          uFog: { value: [0.0044, 0.0044, 0.0052] },
        },
        vertexShader: groundVertex,
        fragmentShader: groundFragment,
      }),
    [],
  );
  const sky = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uTop: { value: [0.002, 0.002, 0.004] }, uHorizon: { value: [0.02, 0.008, 0.008] } },
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        side: BackSide,
        depthWrite: false,
        fog: false,
      }),
    [],
  );
  useEffect(
    () => () => {
      ground.dispose();
      sky.dispose();
    },
    [ground, sky],
  );

  return (
    <>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -110]} material={ground}>
        <planeGeometry args={[500, 500, 1, 1]} />
      </mesh>
      <mesh material={sky} renderOrder={-2}>
        <sphereGeometry args={[240, 32, 16]} />
      </mesh>
    </>
  );
}
