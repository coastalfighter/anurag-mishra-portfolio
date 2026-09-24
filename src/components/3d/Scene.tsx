"use client";

import { PerformanceMonitor, Preload } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
import { ACESFilmicToneMapping } from "three";
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
  const [dpr, setDpr] = useState<number>(full ? 1.5 : 1);
  const [effects, setEffects] = useState(full);

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        dpr={dpr}
        flat={false}
        gl={{
          antialias: !full,
          alpha: false,
          stencil: false,
          depth: true,
          powerPreference: "high-performance",
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        camera={{ fov: 40, near: 0.1, far: 400, position: [0, 1.3, 10] }}
        events={undefined}
        style={{ pointerEvents: "none" }}
        onCreated={({ gl }) => {
          // Let the loader know WebGL is alive once the first frame has been presented.
          requestAnimationFrame(() => loadStore.set({ sceneReady: true }));
          gl.domElement.setAttribute("aria-hidden", "true");
        }}
      >
        <color attach="background" args={[FOG_COLOR]} />
        <fogExp2 attach="fog" args={[FOG_COLOR, 0.028]} />

        {/* Adaptive quality: step resolution down on slow GPUs, drop post-processing if still struggling. */}
        <PerformanceMonitor
          bounds={() => [45, 58]}
          flipflops={3}
          onDecline={() => setDpr((d) => Math.max(0.75, +(d - 0.25).toFixed(2)))}
          onIncline={() => setDpr((d) => Math.min(full ? 1.75 : 1.25, +(d + 0.25).toFixed(2)))}
          onFallback={() => {
            setDpr(1);
            setEffects(false);
          }}
        />

        <CameraController centred={!full} parallax={parallax} />
        <Lighting />
        <World />

        {/* Critical path: the guide + hero. Tracked by the loading screen. */}
        <Suspense fallback={null}>
          <CharacterPath />
          <HeroEnvironment />
          <Preload all />
        </Suspense>

        {/* Everything else streams in lazily as the guide approaches. */}
        <Suspense fallback={null}>
          <AboutEnvironment />
          <SkillsEnvironment />
          <PortfolioEnvironment />
          <ServicesEnvironment />
          <TestimonialsEnvironment />
          <ContactEnvironment />
          <Transitions />
        </Suspense>

        <Particles count={full ? 2200 : 900} />
        {effects && <PostProcessing />}
      </Canvas>
    </div>
  );
}
