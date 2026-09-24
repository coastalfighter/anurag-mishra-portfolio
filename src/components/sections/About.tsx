"use client";

import Image from "next/image";
import { ABOUT, PERSON } from "@/lib/sectionData";
import { SectionShell } from "./SectionShell";

/** ABOUT — the guide stops, faces the visitor, and the bio appears beside him. */
export function About() {
  return (
    <SectionShell id="about" side="right" heading={ABOUT.heading} minHeight="min-h-[150vh]">
      <div className="glass rounded-3xl p-7 sm:p-10" data-reveal>
        <figure className="float-right mb-4 ml-6 hidden w-32 overflow-hidden rounded-2xl ring-1 ring-white/10 sm:block">
          <Image
            src={PERSON.portrait}
            alt="Portrait of Anurag Mishra"
            width={312}
            height={310}
            sizes="128px"
            className="h-auto w-full object-cover grayscale transition duration-700 hover:grayscale-0"
          />
        </figure>
        <div className="space-y-5 text-[1.075rem] leading-relaxed text-paper/85">
          {ABOUT.paragraphs.map((p, i) => (
            <p key={i} className={i === 0 ? "text-xl leading-snug text-paper sm:text-2xl" : undefined}>
              {p}
            </p>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
