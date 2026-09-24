"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

/**
 * Registers GSAP plugins exactly once (safe under React Strict Mode and HMR)
 * and applies project-wide defaults.
 */
export function registerGsap(): { gsap: typeof gsap; ScrollTrigger: typeof ScrollTrigger } {
  if (!registered && typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ ease: "power3.out", duration: 0.9 });
    ScrollTrigger.config({ ignoreMobileResize: true });
    registered = true;
  }
  return { gsap, ScrollTrigger };
}

/** Cinematic easing curves shared by GSAP and Framer Motion. */
export const EASE = {
  /** gsap string form */
  outExpo: "expo.out",
  inOutQuart: "power4.inOut",
  /** cubic-bezier arrays for Framer Motion */
  bezierOut: [0.16, 1, 0.3, 1] as const,
  bezierInOut: [0.76, 0, 0.24, 1] as const,
};

export { gsap, ScrollTrigger };
