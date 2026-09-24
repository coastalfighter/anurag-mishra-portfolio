"use client";

import { Bloom, EffectComposer, SMAA, Vignette } from "@react-three/postprocessing";

/**
 * Finishing pass, tuned for smoothness: HDR bloom on the neon accents, SMAA
 * anti-aliasing (much cheaper than 4× MSAA) and a light vignette. Only mounted on
 * the "full" tier, and dropped automatically by <Scene/> if the frame rate declines.
 */
export function PostProcessing() {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.75} luminanceThreshold={0.95} luminanceSmoothing={0.15} radius={0.6} levels={6} />
      <SMAA />
      <Vignette eskil={false} offset={0.3} darkness={0.45} />
    </EffectComposer>
  );
}
