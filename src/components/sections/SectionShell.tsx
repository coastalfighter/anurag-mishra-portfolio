"use client";

import type { ReactNode } from "react";
import type { SectionId } from "@/lib/sectionData";
import { SECTIONS } from "@/lib/sectionData";
import { useIs3D, useTier } from "@/components/layout/TierContext";
import { SectionCharacter } from "./SectionCharacter";

interface Props {
  id: SectionId;
  /** Which side the content sits on; the guide occupies the other side in 3D. */
  side: "left" | "right" | "center" | "full";
  heading: ReactNode;
  children: ReactNode;
  /** Minimum section height (the longer, the longer the guide lingers here). */
  minHeight?: string;
  className?: string;
}

/**
 * Semantic section wrapper registered with the journey (data-journey-section).
 * Headings are real <h2>s focusable for skip-navigation; the 3D world is
 * decorative, so all information lives here.
 */
export function SectionShell({ id, side, heading, children, minHeight = "min-h-[130vh]", className = "" }: Props) {
  const meta = SECTIONS.find((s) => s.id === id);
  const is3D = useIs3D();
  const tier = useTier();
  const headingId = `${id}-heading`;

  const align =
    side === "right"
      ? "lg:ml-auto lg:w-[min(46rem,52%)]"
      : side === "left"
        ? "lg:mr-auto lg:w-[min(46rem,52%)]"
        : side === "center"
          ? "mx-auto max-w-4xl"
          : "w-full";

  return (
    <section
      id={id}
      data-journey-section={id}
      aria-labelledby={headingId}
      className={`relative ${minHeight} px-4 py-28 sm:px-8 lg:px-16 ${className}`}
    >
      <div className={`relative mx-auto max-w-7xl`}>
        <div className={align}>
          <header className="mb-10" data-reveal>
            <p className="eyebrow mb-5">
              <span className="text-signal">{meta?.index}</span> {meta?.label}
            </p>
            <h2
              id={headingId}
              data-section-heading
              className="font-display text-5xl font-black uppercase sm:text-6xl lg:text-7xl"
            >
              {heading}
            </h2>
          </header>
          {children}
        </div>
      </div>
      {/* Mobile / no-WebGL: the guide walks alongside the content in 2D. */}
      {!is3D && tier === "fallback" && <SectionCharacter side={side === "left" ? "right" : "left"} />}
    </section>
  );
}
