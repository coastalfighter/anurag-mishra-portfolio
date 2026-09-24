"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CASE_STUDIES, type CaseStudy } from "@/lib/sectionData";
import { ArrowIcon } from "@/components/ui/Icons";
import { SectionShell } from "./SectionShell";

function ProjectCard({ study, index }: { study: CaseStudy; index: number }) {
  const [hover, setHover] = useState(false);
  const src = hover && study.thumb.animated ? study.thumb.animated : study.thumb.src;
  return (
    <li data-reveal>
      <Link
        href={`/work/${study.slug}`}
        className="glass group block overflow-hidden rounded-2xl"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-charcoal">
          <Image
            src={src}
            alt=""
            fill
            sizes="(min-width: 1024px) 26vw, (min-width: 640px) 45vw, 92vw"
            unoptimized={src.endsWith("-anim.webp")}
            className="object-cover transition duration-[1.2s] ease-[var(--ease-cinema)] group-hover:scale-[1.06] group-focus-visible:scale-[1.06]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-void/80 via-transparent to-transparent opacity-80" />
          <span className="absolute left-4 top-4 font-body text-xs tracking-[0.3em] text-paper/80">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        <div className="flex items-end justify-between gap-4 p-5">
          <div>
            <h3 className="font-display text-lg font-bold uppercase leading-tight text-paper">{study.gridTitle}</h3>
            {study.discipline && (
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-mute">{study.discipline}</p>
            )}
          </div>
          <ArrowIcon className="h-5 w-5 shrink-0 -rotate-45 text-signal transition-transform duration-500 group-hover:rotate-0" />
        </div>
      </Link>
    </li>
  );
}

/**
 * WORK — every campaign from the original grid, in the same order. In 3D the
 * guide stands in a rotunda of screens that turns as the grid scrolls by.
 */
export function Portfolio() {
  return (
    <SectionShell id="work" side="full" heading="Work" minHeight="min-h-[220vh]">
      <ul className="grid gap-5 sm:grid-cols-2 lg:ml-auto lg:w-[64%] lg:grid-cols-2 xl:gap-6">
        {CASE_STUDIES.map((study, i) => (
          <ProjectCard key={study.slug} study={study} index={i} />
        ))}
      </ul>
    </SectionShell>
  );
}
