"use client";

import { HIGHLIGHTS } from "@/lib/sectionData";
import { HighlightGlyph } from "@/components/ui/Icons";
import { SectionShell } from "./SectionShell";

/**
 * HIGHLIGHTS (the "skills / expertise" stop) — the six facts from the original
 * About page. In 3D, a pedestal glyph ignites for each card as it scrolls in.
 */
export function Skills() {
  return (
    <SectionShell id="highlights" side="left" heading="Highlights" minHeight="min-h-[140vh]">
      <ol className="grid gap-4 sm:grid-cols-2">
        {HIGHLIGHTS.map((h, i) => (
          <li key={h.text} className="glass group relative overflow-hidden rounded-2xl p-6" data-reveal>
            <span
              aria-hidden="true"
              className="absolute -right-3 -top-6 font-display text-8xl font-black text-white/[0.04] transition-colors duration-700 group-hover:text-signal/10"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <HighlightGlyph icon={h.icon} className="mb-6 h-8 w-8 text-signal" />
            <p className="font-display text-lg font-bold leading-snug text-paper">{h.text}</p>
          </li>
        ))}
      </ol>
    </SectionShell>
  );
}
