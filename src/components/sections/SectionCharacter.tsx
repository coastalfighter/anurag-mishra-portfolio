"use client";

import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

/**
 * 2D fallback guide (phones / no WebGL): the character's sprite walk cycle,
 * parallaxing through the section and pausing when off-screen.
 */
export function SectionCharacter({ side }: { side: "left" | "right" }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-10% 0px" });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["30%", "-30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 0.9, 0.9, 0]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-y-0 ${side === "left" ? "left-0" : "right-0"} -z-10 w-1/2 overflow-hidden`}
    >
      <motion.div style={{ y, opacity }} className="sticky top-[30vh] mx-auto w-[46%] max-w-[180px]">
        <div className="sprite-walker w-full" data-paused={!inView} />
        <div className="mx-auto -mt-2 h-4 w-3/4 rounded-[50%] bg-signal/30 blur-md" />
      </motion.div>
    </div>
  );
}
