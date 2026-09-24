"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Object3D, SpotLight } from "three";
import { guide } from "../guideState";

/**
 * Global lighting. Most of the world is self-lit (emissive / basic materials
 * feeding the bloom pass), so real lights are kept to a handful for performance.
 */
export function Lighting() {
  const follow = useRef<SpotLight>(null);
  const followTarget = useRef<Object3D>(null);

  useFrame(() => {
    const p = guide.frame.position;
    const f = guide.frame.forward;
    // Key light rides above and in front of the guide, like a follow-spot.
    follow.current?.position.set(p.x + f.x * 2.5, 6.5, p.z + f.z * 2.5);
    followTarget.current?.position.set(p.x, 0.9, p.z);
    if (follow.current && followTarget.current && follow.current.target !== followTarget.current) {
      follow.current.target = followTarget.current;
    }
  });

  return (
    <>
      <ambientLight intensity={0.25} />
      <hemisphereLight args={["#5b6278", "#140c0c", 0.45]} />
      <directionalLight position={[-12, 18, -30]} intensity={0.65} color="#ffb4a0" />
      <spotLight ref={follow} angle={0.42} penumbra={0.9} intensity={45} distance={14} decay={1.5} color="#fff1e6" />
      <object3D ref={followTarget} />
    </>
  );
}
