"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { MathUtils, PerspectiveCamera, Vector3 } from "three";
import {
  CAMERA_RIGS,
  TRAVEL_RIG,
  centreRig,
  frameAt,
  localToWorld,
  stopU,
  type CameraRig,
  type PathFrame,
} from "@/lib/characterPath";
import { smoothstep } from "@/lib/journey";
import { SECTIONS, type SectionId } from "@/lib/sectionData";
import { journey } from "@/store/journeyStore";
import { guide } from "./guideState";

interface Props {
  /** Centre the guide behind the content on narrower (tablet) layouts. */
  centred: boolean;
  /** Mouse-driven parallax (disabled on touch). */
  parallax: boolean;
}

interface Pose {
  position: Vector3;
  target: Vector3;
  fov: number;
}

const makePose = (): Pose => ({ position: new Vector3(), target: new Vector3(), fov: 40 });

/**
 * Scroll-driven third-person camera.
 *
 * Every section has a rig (see CAMERA_RIGS). While the guide holds at a stop the
 * section's rig is used; while walking between stops the camera blends
 * rig(A) → tracking shot → rig(B) with smoothstep easing, then everything is
 * critically damped so fast scrolls still feel like a dolly, not a cut.
 */
export function CameraController({ centred, parallax }: Props) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const pointer = useRef({ x: 0, y: 0 });
  const smoothed = useRef({ position: new Vector3(), target: new Vector3(), fov: camera.fov, init: false });

  const rigs = useMemo(() => {
    const out = {} as Record<SectionId, CameraRig>;
    for (const s of SECTIONS) out[s.id] = centred ? centreRig(CAMERA_RIGS[s.id]) : CAMERA_RIGS[s.id];
    return out;
  }, [centred]);
  const travel = useMemo(() => (centred ? centreRig(TRAVEL_RIG) : TRAVEL_RIG), [centred]);

  const stopFrames = useMemo(() => {
    const out = {} as Record<SectionId, PathFrame>;
    for (const s of SECTIONS) out[s.id] = frameAt(stopU(s.id));
    return out;
  }, []);

  // Scratch poses (allocation-free per frame).
  const [poseA] = useState(makePose);
  const [poseB] = useState(makePose);
  const [poseT] = useState(makePose);
  const [out] = useState(makePose);
  const [tmp] = useState(() => new Vector3());

  useEffect(() => {
    if (!parallax) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [parallax]);

  function solve(id: SectionId, rig: CameraRig, into: Pose, sectionProgress: number) {
    const frame = rig.anchor === "stop" ? stopFrames[id] : guide.frame;
    const oy = rig.offset[1];
    let [ox, , oz] = rig.offset;
    if (rig.orbit) {
      const a = rig.orbit * (sectionProgress - 0.5);
      const c = Math.cos(a);
      const s = Math.sin(a);
      [ox, oz] = [ox * c + oz * s, -ox * s + oz * c];
    }
    localToWorld(frame, [ox, oy, oz], into.position);
    localToWorld(frame, rig.target, into.target);
    into.fov = rig.fov;
  }

  function blend(a: Pose, b: Pose, t: number, into: Pose) {
    into.position.lerpVectors(a.position, b.position, t);
    into.target.lerpVectors(a.target, b.target, t);
    into.fov = MathUtils.lerp(a.fov, b.fov, t);
  }

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 1 / 20);
    const s = journey.get();
    const ids = SECTIONS.map((x) => x.id);

    if (s.walking && s.segment >= 0 && s.segment < ids.length - 1) {
      const a = ids[s.segment]!;
      const b = ids[s.segment + 1]!;
      solve(a, rigs[a], poseA, s.sectionProgress[s.segment] ?? 0);
      solve(b, rigs[b], poseB, s.sectionProgress[s.segment + 1] ?? 0);
      solve(b, travel, poseT, 0);
      const p = s.segmentProgress;
      if (p < 0.5) blend(poseA, poseT, smoothstep(p * 2), out);
      else blend(poseT, poseB, smoothstep((p - 0.5) * 2), out);
    } else {
      const idx = s.segment < 0 ? 0 : Math.min(s.segment, ids.length - 1);
      const id = ids[idx]!;
      solve(id, rigs[id], out, s.sectionProgress[idx] ?? 0);
    }

    // Pointer parallax in camera space.
    if (parallax) {
      tmp.set(pointer.current.x * 0.35, -pointer.current.y * 0.2, 0).applyQuaternion(camera.quaternion);
      out.position.add(tmp);
    }

    const sm = smoothed.current;
    if (!sm.init || guide.snapCamera) {
      sm.position.copy(out.position);
      sm.target.copy(out.target);
      sm.fov = out.fov;
      sm.init = true;
    } else {
      const k = 1 - Math.exp(-3.2 * dt);
      const kt = 1 - Math.exp(-4.2 * dt);
      sm.position.lerp(out.position, k);
      sm.target.lerp(out.target, kt);
      sm.fov = MathUtils.damp(sm.fov, out.fov, 3, dt);
    }

    camera.position.copy(sm.position);
    camera.lookAt(sm.target);
    if (Math.abs(camera.fov - sm.fov) > 0.01) {
      camera.fov = sm.fov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
