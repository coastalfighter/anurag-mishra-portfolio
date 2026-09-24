"use client";

import { Detailed, useAnimations, useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AdditiveBlending,
  DoubleSide,
  Group,
  LinearFilter,
  MathUtils,
  Mesh,
  ShaderMaterial,
  SRGBColorSpace,
  VideoTexture,
  type AnimationAction,
  type Texture,
} from "three";
import { CHARACTER, supportsAlphaWebm, walkFrameForDistance, type CharacterMode } from "@/lib/characterConfig";
import { DECODER_PATHS, getKtx2Loader, useWorldTexture } from "@/lib/textures";
import { guide } from "./guideState";

/* ───────────────────────── Billboard shader (sprite + video modes) ───────────────────────── */

const billboardVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const billboardFragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec2 uRepeat;
  uniform vec2 uOffset;
  uniform vec3 uTint;
  uniform float uOpacity;
  uniform float uRim;
  uniform float uFog;
  uniform vec3 uFogColor;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv * uRepeat + uOffset;
    vec4 tex = texture2D(uMap, uv);
    // Feet are cropped in the source footage: fade the bottom into the ground mist.
    float foot = smoothstep(0.0, 0.11, vUv.y);
    float alpha = tex.a * foot * uOpacity;
    if (alpha < 0.02) discard;
    // Cool rim toward the silhouette edge for separation from the dark world.
    float edge = 1.0 - smoothstep(0.35, 0.95, tex.a);
    vec3 color = tex.rgb * uTint + vec3(1.0, 0.25, 0.2) * edge * uRim;
    // Distance fog (the guide emerges from the haze during the hero walk-in).
    color = mix(color, uFogColor, uFog);
    gl_FragColor = vec4(color, alpha * (1.0 - uFog * 0.35));
    #include <colorspace_fragment>
  }
`;

function useBillboardMaterial(map: Texture | null): ShaderMaterial {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uMap: { value: null },
          uRepeat: { value: [1, 1] },
          uOffset: { value: [0, 0] },
          uTint: { value: [1.05, 1.02, 1.0] },
          uOpacity: { value: 1 },
          uRim: { value: 0.35 },
          uFog: { value: 0 },
          uFogColor: { value: [0.043, 0.043, 0.051] },
        },
        vertexShader: billboardVertex,
        fragmentShader: billboardFragment,
        transparent: true,
        depthWrite: true,
        side: DoubleSide,
      }),
    [],
  );
  useEffect(() => {
    material.uniforms.uMap!.value = map;
  }, [material, map]);
  useEffect(() => () => material.dispose(), [material]);
  return material;
}

/**
 * Cylindrical billboard: rotates the plane around Y to face the camera, and
 * applies distance fog manually (ShaderMaterial doesn't get scene fog for free).
 */
function useBillboard(ref: React.RefObject<Mesh | null>, material: ShaderMaterial) {
  const camera = useThree((s) => s.camera);
  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const p = guide.frame.position;
    const dx = camera.position.x - p.x;
    const dz = camera.position.z - p.z;
    mesh.rotation.y = Math.atan2(dx, dz);
    const dist = Math.hypot(dx, dz);
    material.uniforms.uFog!.value = MathUtils.smoothstep(dist, 14, 34) * 0.92;
  });
}

/* ───────────────────────── Sprite-sheet guide (default) ───────────────────────── */

function SpriteCharacter() {
  const cfg = CHARACTER.sprite;
  const texture = useWorldTexture(cfg.url, { mipmaps: false });
  const material = useBillboardMaterial(texture);
  const mesh = useRef<Mesh>(null);
  const aspect = cfg.frameWidth / cfg.frameHeight;
  const h = CHARACTER.height;
  useBillboard(mesh, material);

  useEffect(() => {
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    material.uniforms.uRepeat!.value = [1 / cfg.cols, 1 / cfg.rows];
  }, [texture, material, cfg.cols, cfg.rows]);

  useFrame(() => {
    let frame = walkFrameForDistance(guide.distance, cfg, CHARACTER.unitsPerFrame);
    // Arrival gesture at the final stop, scrubbed by scroll.
    if (cfg.arrivalGesture && guide.arrival > 0.01 && guide.walkAmount < 0.3) {
      const [a, b] = cfg.arrivalGesture;
      frame = Math.round(MathUtils.lerp(a, b, guide.arrival));
    }
    const col = frame % cfg.cols;
    const row = Math.floor(frame / cfg.cols);
    material.uniforms.uOffset!.value = [col / cfg.cols, 1 - (row + 1) / cfg.rows];
  });

  return (
    <mesh ref={mesh} position={[0, h / 2 - h * 0.06, 0]} material={material} renderOrder={2}>
      <planeGeometry args={[h * aspect, h]} />
    </mesh>
  );
}

/* ───────────────────────── Transparent WebM guide ───────────────────────── */

function VideoCharacter() {
  const cfg = CHARACTER.video;
  // Created once on the client (this component only ever renders inside the Canvas).
  const [{ video, texture }] = useState(() => {
    const v = document.createElement("video");
    v.crossOrigin = "anonymous";
    v.loop = true;
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    const tex = new VideoTexture(v);
    tex.colorSpace = SRGBColorSpace;
    tex.minFilter = LinearFilter;
    tex.generateMipmaps = false;
    return { video: v, texture: tex };
  });
  const videoRef = useRef<HTMLVideoElement | null>(video);
  const material = useBillboardMaterial(texture);
  const mesh = useRef<Mesh>(null);
  const h = CHARACTER.height;
  useBillboard(mesh, material);

  useEffect(() => {
    video.src = cfg.url;
    return () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
      texture.dispose();
    };
  }, [cfg.url, video, texture]);

  useFrame(() => {
    const video = videoRef.current;
    if (!video) return;
    const nominalSpeed = 1.4; // m/s the footage was shot at (approx.)
    if (guide.walkAmount > 0.05) {
      video.playbackRate = MathUtils.clamp(guide.speed / nominalSpeed, 0.35, 2.5);
      if (video.paused) void video.play().catch(() => undefined);
    } else if (!video.paused) {
      video.pause();
    }
  });

  return (
    <mesh ref={mesh} position={[0, h / 2 - h * 0.06, 0]} material={material} renderOrder={2}>
      <planeGeometry args={[h * cfg.aspect, h]} />
    </mesh>
  );
}

/* ───────────────────────── glTF guide (rigged model, optional LOD) ───────────────────────── */

function GltfModel({ url }: { url: string }) {
  const gl = useThree((s) => s.gl);
  const cfg = CHARACTER.gltf;
  const { scene, animations } = useGLTF(url, DECODER_PATHS.draco, true, (loader) => {
    // KTX2 / Basis compressed textures inside the model.
    (loader as unknown as { setKTX2Loader: (l: unknown) => void }).setKTX2Loader(getKtx2Loader(gl));
  });
  const root = useRef<Group>(null);
  const { actions, clips } = useAnimations(animations, root);
  const walk = useRef<AnimationAction | null>(null);
  const idle = useRef<AnimationAction | null>(null);

  useEffect(() => {
    const walkName = cfg.walkClip && actions[cfg.walkClip] ? cfg.walkClip : clips[0]?.name;
    walk.current = walkName ? (actions[walkName] ?? null) : null;
    idle.current = cfg.idleClip ? (actions[cfg.idleClip] ?? null) : null;
    if (walk.current) {
      walk.current.play();
      walk.current.paused = true; // time is scrubbed by distance walked
    }
    idle.current?.play();
    scene.traverse((o) => {
      if ((o as Mesh).isMesh) o.frustumCulled = false; // skinned bounds are unreliable
    });
  }, [actions, clips, cfg.walkClip, cfg.idleClip, scene]);

  useFrame(() => {
    const w = walk.current;
    if (w) {
      const duration = w.getClip().duration || 1;
      w.time = (guide.distance * cfg.secondsPerUnit) % duration;
      w.setEffectiveWeight(idle.current ? guide.walkAmount : 1);
    }
    idle.current?.setEffectiveWeight(1 - guide.walkAmount);
    if (root.current) root.current.rotation.y = guide.frame.yaw + cfg.yawOffset;
  });

  return (
    <group ref={root} scale={cfg.scale}>
      <primitive object={scene} />
    </group>
  );
}

function GltfCharacter() {
  const cfg = CHARACTER.gltf;
  const lods = cfg.lods ?? [];
  if (lods.length === 0) return <GltfModel url={cfg.url} />;
  return (
    <Detailed distances={[0, ...lods.map((l) => l.distance)]}>
      {[cfg.url, ...lods.map((l) => l.url)].map((url) => (
        <group key={url}>
          <GltfModel url={url} />
        </group>
      ))}
    </Detailed>
  );
}

/* ───────────────────────── Placeholder mannequin (no asset needed) ───────────────────────── */

function PlaceholderCharacter() {
  const leftLeg = useRef<Group>(null);
  const rightLeg = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const body = useRef<Group>(null);
  const root = useRef<Group>(null);

  useFrame((state) => {
    const phase = (guide.distance / 1.4) * Math.PI * 2;
    const swing = Math.sin(phase) * 0.55 * guide.walkAmount;
    if (leftLeg.current) leftLeg.current.rotation.x = swing;
    if (rightLeg.current) rightLeg.current.rotation.x = -swing;
    if (leftArm.current) leftArm.current.rotation.x = -swing * 0.8;
    if (rightArm.current) rightArm.current.rotation.x = swing * 0.8;
    if (body.current) {
      const bob = Math.abs(Math.cos(phase)) * 0.04 * guide.walkAmount;
      const breathe = Math.sin(state.clock.elapsedTime * 1.6) * 0.008 * (1 - guide.walkAmount);
      body.current.position.y = bob + breathe;
    }
    if (root.current) root.current.rotation.y = guide.frame.yaw;
  });

  const skin = <meshStandardMaterial color="#d9d4cc" roughness={0.45} metalness={0.1} />;
  const suit = <meshStandardMaterial color="#2a3350" roughness={0.6} metalness={0.15} />;

  return (
    <group ref={root}>
      <group ref={body}>
        <mesh position={[0, 1.72, 0]}>
          <sphereGeometry args={[0.12, 24, 24]} />
          {skin}
        </mesh>
        <mesh position={[0, 1.27, 0]}>
          <capsuleGeometry args={[0.2, 0.5, 8, 16]} />
          {suit}
        </mesh>
        <group ref={leftArm} position={[-0.29, 1.5, 0]}>
          <mesh position={[0, -0.3, 0]}>
            <capsuleGeometry args={[0.06, 0.5, 6, 12]} />
            {suit}
          </mesh>
        </group>
        <group ref={rightArm} position={[0.29, 1.5, 0]}>
          <mesh position={[0, -0.3, 0]}>
            <capsuleGeometry args={[0.06, 0.5, 6, 12]} />
            {suit}
          </mesh>
        </group>
        <group ref={leftLeg} position={[-0.11, 0.92, 0]}>
          <mesh position={[0, -0.44, 0]}>
            <capsuleGeometry args={[0.08, 0.72, 6, 12]} />
            {suit}
          </mesh>
        </group>
        <group ref={rightLeg} position={[0.11, 0.92, 0]}>
          <mesh position={[0, -0.44, 0]}>
            <capsuleGeometry args={[0.08, 0.72, 6, 12]} />
            {suit}
          </mesh>
        </group>
      </group>
    </group>
  );
}

/* ───────────────────────── Ground contact & glow ───────────────────────── */

const glowFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uStrength;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float a = pow(1.0 - clamp(d, 0.0, 1.0), 2.2) * uStrength;
    gl_FragColor = vec4(uColor, a);
  }
`;

function GroundContact() {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uColor: { value: [1.0, 0.18, 0.12] }, uStrength: { value: 0.55 } },
        vertexShader: billboardVertex,
        fragmentShader: glowFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);
  useFrame((state) => {
    material.uniforms.uStrength!.value = 0.4 + Math.sin(state.clock.elapsedTime * 1.4) * 0.06;
  });
  return (
    <group>
      {/* Soft contact shadow */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, 0]}>
        <circleGeometry args={[0.7, 48]} />
        <meshBasicMaterial color="#000" transparent opacity={0.55} depthWrite={false} />
      </mesh>
      {/* Warm pool of light the guide walks in */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} material={material}>
        <planeGeometry args={[3.2, 3.2]} />
      </mesh>
    </group>
  );
}

/* ───────────────────────── Error boundary → placeholder ───────────────────────── */

class CharacterBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch(error: unknown) {
    console.warn("[Character] asset failed to load — using placeholder mannequin.", error);
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/* ───────────────────────── Public component ───────────────────────── */

function resolveMode(requested: CharacterMode): CharacterMode {
  if (requested === "video" && !supportsAlphaWebm()) return "sprite";
  return requested;
}

/**
 * The walking guide. Rendered at the origin of <CharacterPath/>'s group.
 *
 * ▶ SWAP POINT: the renderer is chosen by CHARACTER.mode in src/lib/characterConfig.ts
 *   (sprite · video · gltf · placeholder). Any load failure falls back to the mannequin.
 */
export function Character() {
  const [mode] = useState(() => resolveMode(CHARACTER.mode));
  const fallback = <PlaceholderCharacter />;
  let body: ReactNode;
  switch (mode) {
    case "video":
      body = <VideoCharacter />;
      break;
    case "gltf":
      body = <GltfCharacter />;
      break;
    case "placeholder":
      body = fallback;
      break;
    default:
      body = <SpriteCharacter />;
  }
  return (
    <group>
      <GroundContact />
      <CharacterBoundary fallback={fallback}>
        <Suspense fallback={fallback}>{body}</Suspense>
      </CharacterBoundary>
    </group>
  );
}
