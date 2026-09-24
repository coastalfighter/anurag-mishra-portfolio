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
      <ambientLight intensity={0.45} />
      <hemisphereLight args={["#a9b8ff", "#ff6fb5", 1.1]} />
      {/* Low sun behind the guide (+Z), matching the sky dome. */}
      <directionalLight position={[8, 10, 40]} intensity={1.8} color="#ffc38a" />
      <spotLight ref={follow} angle={0.42} penumbra={0.9} intensity={30} distance={14} decay={1.5} color="#fff1e6" />
      <object3D ref={followTarget} />
    </>
  );
}
