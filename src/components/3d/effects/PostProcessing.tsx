"use client";

import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Vector2 } from "three";

const CA_OFFSET = new Vector2(0.0006, 0.0006);

/**
 * Cinematic finishing: HDR bloom on emissive elements, a soft vignette, film
 * grain and a hint of chromatic aberration. Only mounted on the "full" tier and
 * automatically dropped by <Scene/> if the frame rate declines.
 */
export function PostProcessing() {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.9} luminanceSmoothing={0.2} radius={0.72} />
      <ChromaticAberration offset={CA_OFFSET} radialModulation={false} modulationOffset={0} blendFunction={BlendFunction.NORMAL} />
      <Noise opacity={0.035} blendFunction={BlendFunction.OVERLAY} />
      <Vignette eskil={false} offset={0.22} darkness={0.78} />
    </EffectComposer>
  );
}
