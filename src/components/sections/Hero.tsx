"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { EASE } from "@/lib/gsapConfig";
import { AGENCIES, PERSON } from "@/lib/sectionData";
import { useIs3D, useTier } from "@/components/layout/TierContext";
import { useSmoothScroll } from "@/components/layout/SmoothScroll";
import { useLoadState } from "@/store/loadStore";

const words = PERSON.name.split(" ");

/**
 * HERO — a cinematic title card. On desktop the guide walks out of the fog
 * behind the name; on phones the original walking film plays full-bleed.
 */
export function Hero() {
  const introDone = useLoadState((s) => s.introDone);
  const is3D = useIs3D();
  const tier = useTier();
  const { scrollToId } = useSmoothScroll();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const titleY = useTransform(scrollYProgress, [0, 1], ["0%", "-35%"]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.55, 0.85], [1, 1, 0]);
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const shown = introDone || tier === "static";

  return (
    <section
      ref={ref}
      id="hero"
      data-journey-section="hero"
      aria-labelledby="hero-heading"
      className="relative min-h-[175vh]"
    >
      <div className="sticky top-0 flex h-[100svh] flex-col justify-end overflow-hidden px-4 pb-[9vh] sm:px-8 lg:px-16">
        {/* 2D tiers: the original walking film (phones) or its still (reduced motion). */}
        {!is3D && tier !== null && (
          <motion.div aria-hidden="true" className="absolute inset-0 -z-10" style={{ scale: videoScale }}>
            {tier === "fallback" ? (
              <video
                className="h-full w-full object-cover"
                src="/assets/videos/character-walk.mp4"
                poster="/assets/videos/character-walk-poster.jpg"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="h-full w-full object-cover"
                src="/assets/videos/character-walk-poster.jpg"
                alt=""
                width={1280}
                height={720}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-void via-void/55 to-void/10" />
          </motion.div>
        )}

        <motion.div style={is3D ? { y: titleY, opacity: titleOpacity } : undefined} className="mx-auto w-full max-w-7xl">
          <motion.p
            data-noscript-show
            className="eyebrow mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={shown ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 1, ease: EASE.bezierOut, delay: 0.9 }}
          >
            {PERSON.currentRole} · {AGENCIES[0]?.agency}
          </motion.p>

          <h1
            id="hero-heading"
            data-section-heading
            aria-label={PERSON.name}
            className="font-display text-[length:var(--text-mega)] font-black leading-[0.82] tracking-[-0.045em] text-paper"
          >
            <span aria-hidden="true" className="flex flex-wrap gap-x-[0.22em]">
              {words.map((word, w) => (
                <span key={word} className="inline-flex overflow-hidden whitespace-nowrap pb-[0.06em]">
                  {word.split("").map((ch, i) => {
                    const order = words.slice(0, w).join("").length + i;
                    return (
                      <motion.span
                        data-noscript-show
                        key={`${ch}${i}`}
                        className={`inline-block ${w > 0 ? "text-transparent [-webkit-text-stroke:1px_var(--color-paper)]" : ""}`}
                        initial={{ y: "105%" }}
                        animate={shown ? { y: "0%" } : undefined}
                        transition={{ duration: 1.2, ease: EASE.bezierOut, delay: 0.15 + order * 0.045 }}
                      >
                        {ch}
                      </motion.span>
                    );
                  })}
                </span>
              ))}
            </span>
          </h1>

          <motion.div
            data-noscript-show
            className="mt-8 flex items-center justify-between gap-6"
            initial={{ opacity: 0 }}
            animate={shown ? { opacity: 1 } : undefined}
            transition={{ duration: 1, delay: 1.3 }}
          >
            <p className="max-w-md text-lg text-paper/70">{PERSON.greeting}</p>
            <a
              href="#about"
              onClick={(e) => {
                e.preventDefault();
                scrollToId("about");
              }}
              className="group flex items-center gap-4 text-[0.75rem] uppercase tracking-[0.35em] text-paper/80"
            >
              <span className="hidden sm:inline">Scroll to walk</span>
              <span className="relative flex h-12 w-7 justify-center rounded-full border border-paper/40" aria-hidden="true">
                <motion.span
                  className="mt-2 h-2 w-[3px] rounded-full bg-signal"
                  animate={{ y: [0, 16, 0], opacity: [1, 0.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </span>
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
