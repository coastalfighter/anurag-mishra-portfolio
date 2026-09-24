"use client";

import { AWARDS, PUBLICATIONS } from "@/lib/sectionData";
import { SectionShell } from "./SectionShell";

/**
 * AWARDS & PRESS (the "testimonials / social proof" stop). In 3D the guide
 * stands at the centre while award plaques orbit overhead; here the content is
 * split into two columns either side of him.
 */
export function Testimonials() {
  const mid = Math.ceil(AWARDS.length / 2);
  const columns = [AWARDS.slice(0, mid), AWARDS.slice(mid)];

  return (
    <SectionShell id="awards" side="full" heading="AWARDS" minHeight="min-h-[200vh]">
      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(12rem,22vw)_1fr]">
        {columns.map((col, c) => (
          <ul key={c} className={`space-y-4 ${c === 1 ? "lg:col-start-3" : ""}`}>
            {col.map((group) => (
              <li key={group.show} className="glass rounded-2xl p-6" data-reveal>
                <h3 className="font-display text-lg font-black uppercase tracking-wide text-paper">
                  <span aria-hidden="true" className="mr-3 inline-block h-2 w-2 -translate-y-0.5 rounded-full bg-signal" />
                  {group.show}
                </h3>
                <ul className="mt-3 space-y-1 text-paper/75">
                  {group.entries.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        ))}
      </div>

      <div className="glass mx-auto mt-10 max-w-4xl rounded-3xl p-7 text-center sm:p-10" data-reveal>
        <h3 className="eyebrow mb-6 justify-center">PUBLICATIONS / PRESS</h3>
        <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {PUBLICATIONS.map((p) => (
            <li key={p} className="font-display text-xl font-black tracking-wide text-paper sm:text-2xl">
              {p}
            </li>
          ))}
        </ul>
      </div>
    </SectionShell>
  );
}
