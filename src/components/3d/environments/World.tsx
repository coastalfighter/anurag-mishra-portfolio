"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  BackSide,
  BufferAttribute,
  Color,
  CylinderGeometry,
  DynamicDrawUsage,
  IcosahedronGeometry,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  ShaderMaterial,
  TorusGeometry,
  OctahedronGeometry,
} from "three";
import { frameAt } from "@/lib/characterPath";
import { ACCENTS, HEX, WORLD, lin } from "@/lib/palette";

/* ───────────────────────── Sky dome ───────────────────────── */

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = p.xyww; // always at the far plane
  }
`;

const skyFragment = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uHigh;
  uniform vec3 uMid;
  uniform vec3 uHorizon;
  uniform vec3 uSun;
  uniform vec3 uSunEdge;
  uniform vec3 uSunDir;
  uniform float uTime;
  varying vec3 vDir;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }

  void main() {
    vec3 d = normalize(vDir);
    float h = clamp(d.y, -0.2, 1.0);

    // Four-stop vertical gradient: tangerine horizon → hot pink → violet → indigo zenith.
    vec3 col = mix(uHorizon, uMid, smoothstep(-0.02, 0.12, h));
    col = mix(col, uHigh, smoothstep(0.10, 0.38, h));
    col = mix(col, uZenith, smoothstep(0.35, 0.95, h));

    // Sun: hot core + wide halo.
    float s = max(dot(d, normalize(uSunDir)), 0.0);
    col += uSunEdge * pow(s, 18.0) * 0.9;
    col = mix(col, uSun, smoothstep(0.9975, 0.9985, s));
    col += uSun * pow(s, 400.0) * 0.6;

    // Soft streaky clouds in the lower sky, lit pink/gold from below.
    vec2 cp = vec2(atan(d.x, d.z) * 3.0 + uTime * 0.004, h * 14.0);
    float c = noise(cp * vec2(2.0, 1.0)) * 0.6 + noise(cp * vec2(5.0, 2.5)) * 0.4;
    float band = smoothstep(0.03, 0.12, h) * (1.0 - smoothstep(0.18, 0.4, h));
    col = mix(col, mix(uMid, uSun, 0.35) * 1.15, smoothstep(0.55, 0.85, c) * band * 0.55);

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

function Sky() {
  const mesh = useRef<Mesh>(null);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uZenith: { value: lin(HEX.skyZenith) },
          uHigh: { value: lin(HEX.skyHigh) },
          uMid: { value: lin(HEX.skyMid) },
          uHorizon: { value: lin(HEX.skyHorizon) },
          uSun: { value: lin(HEX.sun) },
          uSunEdge: { value: lin(HEX.sunEdge) },
          // The camera leads the guide and looks back toward +Z, so the sun backlights him.
          uSunDir: { value: [0.15, 0.1, 1] },
          uTime: { value: 0 },
        },
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        side: BackSide,
        depthWrite: false,
        fog: false,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);
  useFrame((state) => {
    material.uniforms.uTime!.value = state.clock.elapsedTime;
    // Keep the dome centred on the camera so it behaves as if infinitely far away.
    mesh.current?.position.copy(state.camera.position);
  });
  return (
    <mesh ref={mesh} material={material} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[500, 48, 24]} />
    </mesh>
  );
}

/* ───────────────────────── Ground ───────────────────────── */

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
  uniform vec3 uNear;
  uniform vec3 uFar;
  uniform vec3 uFog;
  uniform float uDensity;
  varying vec3 vWorld;
  varying float vDist;

  float grid(vec2 p, float size, float width) {
    vec2 g = abs(fract(p / size - 0.5) - 0.5) / fwidth(p / size);
    return 1.0 - min(min(g.x, g.y) / width, 1.0);
  }

  void main() {
    float minor = grid(vWorld.xz, 2.0, 1.0) * 0.35;
    float major = grid(vWorld.xz, 10.0, 1.4) * 0.8;
    float lines = max(minor, major);
    vec3 lineCol = mix(uNear, uFar, smoothstep(6.0, 40.0, vDist));
    // Soft sheen toward the horizon, like wet sand catching the sunset.
    vec3 col = uBase * (1.0 + smoothstep(10.0, 70.0, vDist) * 0.8) + lineCol * lines;
    float fog = 1.0 - exp(-pow(vDist * uDensity, 2.0));
    gl_FragColor = vec4(mix(col, uFog, clamp(fog, 0.0, 1.0)), 1.0);
    #include <colorspace_fragment>
  }
`;

function Ground() {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uBase: { value: lin(HEX.ground) },
          uNear: { value: lin(HEX.gridNear) },
          uFar: { value: lin(HEX.gridFar) },
          uFog: { value: WORLD.fogLinear },
          uDensity: { value: WORLD.fogDensity },
        },
        vertexShader: groundVertex,
        fragmentShader: groundFragment,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0, -110]} material={material}>
      <planeGeometry args={[700, 700, 1, 1]} />
    </mesh>
  );
}

/* ───────────────────────── Layered hills (horizon silhouettes) ───────────────────────── */

function Hills({ radius, height, color, seed }: { radius: number; height: number; color: string; seed: number }) {
  const geometry = useMemo(() => {
    const g = new CylinderGeometry(radius, radius, height, 160, 1, true);
    const pos = g.getAttribute("position") as BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) > 0) {
        const a = Math.atan2(pos.getX(i), pos.getZ(i));
        // Layered sines = rolling, stylised ridgeline (deterministic, no textures).
        const n =
          Math.sin(a * 3 + seed) * 0.35 +
          Math.sin(a * 7.3 + seed * 2.1) * 0.22 +
          Math.sin(a * 17.1 + seed * 0.7) * 0.1 +
          0.55;
        pos.setY(i, -height / 2 + height * Math.max(0.15, n));
      }
    }
    g.computeVertexNormals();
    return g;
  }, [radius, height, seed]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} position={[0, height / 2 - 0.5, -110]}>
      {/* fog off: silhouettes sit against the sunset sky, not inside the haze */}
      <meshBasicMaterial color={color} side={BackSide} fog={false} />
    </mesh>
  );
}

/* ───────────────────────── Floating sculptures ───────────────────────── */

const SHAPES_PER_KIND = 34;

function FloatingShapes({ count = SHAPES_PER_KIND }: { count?: number }) {
  const refs = useRef<(InstancedMesh | null)[]>([]);
  const dummy = useMemo(() => new Object3D(), []);

  const kinds = useMemo(
    () => [new IcosahedronGeometry(0.7, 0), new TorusGeometry(0.6, 0.2, 10, 28), new OctahedronGeometry(0.75, 0)],
    [],
  );
  const material = useMemo(
    () => new MeshStandardMaterial({ roughness: 0.35, metalness: 0.15, flatShading: true, emissiveIntensity: 0.35 }),
    [],
  );
  useEffect(
    () => () => {
      kinds.forEach((k) => k.dispose());
      material.dispose();
    },
    [kinds, material],
  );

  // Deterministic placement along the whole path, well clear of the walkway.
  const layout = useMemo(() => {
    let s = 4242;
    const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
    return kinds.map(() =>
      Array.from({ length: count }, () => {
        const f = frameAt(rand());
        const side = rand() < 0.5 ? -1 : 1;
        const lateral = side * (7 + rand() * 16);
        return {
          x: f.position.x + f.right.x * lateral,
          z: f.position.z + f.right.z * lateral,
          y: 2.5 + rand() * 9,
          scale: 0.6 + rand() * 1.6,
          speed: 0.2 + rand() * 0.5,
          phase: rand() * Math.PI * 2,
          color: new Color(ACCENTS[Math.floor(rand() * ACCENTS.length)]!),
        };
      }),
    );
  }, [kinds, count]);

  useEffect(() => {
    refs.current.forEach((mesh, k) => {
      if (!mesh) return;
      mesh.instanceMatrix.setUsage(DynamicDrawUsage);
      layout[k]!.forEach((it, i) => mesh.setColorAt(i, it.color));
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
  }, [layout]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    refs.current.forEach((mesh, k) => {
      if (!mesh) return;
      layout[k]!.forEach((it, i) => {
        dummy.position.set(it.x, it.y + Math.sin(t * it.speed + it.phase) * 0.6, it.z);
        dummy.rotation.set(t * it.speed * 0.6 + it.phase, t * it.speed + it.phase, 0);
        dummy.scale.setScalar(it.scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    });
  });

  return (
    <>
      {kinds.map((geo, k) => (
        <instancedMesh
          key={k}
          ref={(m) => {
            refs.current[k] = m;
          }}
          args={[geo, material, count]}
          frustumCulled={false}
        />
      ))}
    </>
  );
}

export const FOG_COLOR = HEX.fog;

/** Sky, ground, horizon hills and floating sculptures — the whole backdrop. */
export function World({ shapes = SHAPES_PER_KIND }: { shapes?: number }) {
  return (
    <>
      <Sky />
      <Ground />
      <Hills radius={240} height={34} color={HEX.hillsFar} seed={1.7} />
      <Hills radius={190} height={22} color={HEX.hillsNear} seed={4.2} />
      <FloatingShapes count={shapes} />
    </>
  );
}
