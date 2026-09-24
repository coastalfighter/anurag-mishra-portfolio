"use client";

import { useLoader, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import { LinearFilter, SRGBColorSpace, TextureLoader, type Texture } from "three";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";

export const DECODER_PATHS = {
  draco: "/decoders/draco/",
  basis: "/decoders/basis/",
} as const;

let sharedKtx2: KTX2Loader | null = null;

/** One KTX2Loader per app (it owns a worker pool). */
export function getKtx2Loader(gl: Parameters<KTX2Loader["detectSupport"]>[0]): KTX2Loader {
  if (!sharedKtx2) {
    sharedKtx2 = new KTX2Loader().setTranscoderPath(DECODER_PATHS.basis).detectSupport(gl);
  }
  return sharedKtx2;
}

/**
 * Loads a world texture, transparently supporting GPU-compressed KTX2/Basis files.
 *
 * To ship compressed textures, convert with e.g.
 *   toktx --t2 --encode etc1s --genmipmap public/assets/textures/foo.ktx2 foo.png
 * and pass the `.ktx2` URL — no other code changes needed.
 */
export function useWorldTexture(url: string, opts: { mipmaps?: boolean } = {}): Texture {
  const gl = useThree((s) => s.gl);
  const isKtx2 = url.toLowerCase().endsWith(".ktx2");
  const texture = useLoader(
    (isKtx2 ? KTX2Loader : TextureLoader) as typeof TextureLoader,
    url,
    (loader) => {
      if (loader instanceof KTX2Loader) {
        loader.setTranscoderPath(DECODER_PATHS.basis).detectSupport(gl);
      }
    },
  );
  return useMemo(() => {
    texture.colorSpace = SRGBColorSpace;
    if (!isKtx2) {
      texture.generateMipmaps = opts.mipmaps ?? true;
      if (!texture.generateMipmaps) texture.minFilter = LinearFilter;
    }
    texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    texture.needsUpdate = true;
    return texture;
  }, [texture, isKtx2, opts.mipmaps, gl]);
}
