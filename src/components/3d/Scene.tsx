"use client";

import { PerformanceMonitor, Preload } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
import { NeutralToneMapping } from "three";
import { WORLD } from "@/lib/palette";
import { loadStore } from "@/store/loadStore";
import { CameraController } from "./CameraController";
import { CharacterPath } from "./CharacterPath";
import { Lighting } from "./effects/Lighting";
import { Particles } from "./effects/Particles";
import { PostProcessing } from "./effects/PostProcessing";
import { AboutEnvironment } from "./environments/AboutEnvironment";
import { ContactEnvironment } from "./environments/ContactEnvironment";
import { HeroEnvironment } from "./environments/HeroEnvironment";
import { PortfolioEnvironment } from "./environments/PortfolioEnvironment";
import { ServicesEnvironment } from "./environments/ServicesEnvironment";
import { SkillsEnvironment } from "./environments/SkillsEnvironment";
import { TestimonialsEnvironment } from "./environments/TestimonialsEnvironment";
import { Transitions } from "./environments/Transitions";
import { FOG_COLOR, World } from "./environments/World";

export interface SceneProps {
  tier: "full" | "lite";
  /** Pointer-driven camera parallax (desktop pointers only). */
  parallax: boolean;
}

/**
 * The persistent WebGL world rendered behind the HTML content.
 *
 * It is purely decorative: `aria-hidden`, `pointer-events: none`, and every piece
 * of information it shows also exists as semantic HTML in the page.
 */
export default function Scene({ tier, parallax }: SceneProps) {
  const full = tier === "full";
  // Start conservatively; PerformanceMonitor raises resolution only if there is headroom.
  const maxDpr = full ? 1.5 : 1;
  const [dpr, setDpr] = useState<number>(() =>
    Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, full ? 1.25 : 1),
  );
  const [effects, setEffects] = useState(full);

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        dpr={dpr}
        flat={false}
        gl={{
          // MSAA on the default framebuffer when no post-processing; SMAA handles AA otherwise.
          antialias: !full,
          alpha: false,
          stencil: false,
          depth: true,
          powerPreference: "high-performance",
          // Neutral tone mapping keeps the palette saturated (ACES washes vivid hues out).
          toneMapping: NeutralToneMapping,
          toneMappingExposure: 1,
        }}
        camera={{ fov: 40, near: 0.1, far: 1200, position: [0, 1.3, 10] }}
        events={undefined}
        style={{ pointerEvents: "none" }}
        onCreated={({ gl }) => {
          // Let the loader know WebGL is alive once the first frame has been presented.
          requestAnimationFrame(() => loadStore.set({ sceneReady: true }));
          gl.domElement.setAttribute("aria-hidden", "true");
        }}
      >
        <color attach="background" args={[FOG_COLOR]} />
        <fogExp2 attach="fog" args={[FOG_COLOR, WORLD.fogDensity]} />

        {/* Adaptive quality: step resolution down on slow GPUs, drop post-processing if still struggling. */}
        <PerformanceMonitor
          bounds={() => [45, 58]}
          flipflops={3}
          onDecline={() => setDpr((d) => Math.max(0.75, +(d - 0.25).toFixed(2)))}
          onIncline={() => setDpr((d) => Math.min(maxDpr, +(d + 0.25).toFixed(2)))}
          onFallback={() => {
            setDpr(1);
            setEffects(false);
          }}
        />

        <CameraController centred={!full} parallax={parallax} />
        <Lighting />
        <World shapes={full ? 34 : 18} />

        {/*
          Everything mounts up-front inside one Suspense so <Preload/> compiles every
          shader and uploads every texture during the loading screen — no hitches when
          a new scene scrolls into view. Distant groups are hidden per-frame (culling),
          and only the 13 campaign screenshots stream in lazily.
        */}
        <Suspense fallback={null}>
          <CharacterPath hd={full} />
          <HeroEnvironment />
          <AboutEnvironment />
          <SkillsEnvironment />
          <PortfolioEnvironment />
          <ServicesEnvironment />
          <TestimonialsEnvironment />
          <ContactEnvironment />
          <Transitions />
          <Preload all />
        </Suspense>

        <Particles count={full ? 1600 : 700} />
        {effects && <PostProcessing />}
      </Canvas>
    </div>
  );
}
