"use client";

import { AGENCIES, EDUCATION, PERSON } from "@/lib/sectionData";
import { SectionShell } from "./SectionShell";

/**
 * RESUME (the "services / corridor" stop) — agencies and education from the
 * original résumé page. In 3D each role hangs on the corridor walls.
 */
export function Services() {
  return (
    <SectionShell id="experience" side="right" heading="Resume" minHeight="min-h-[190vh]">
      <div className="space-y-6">
        <div className="glass rounded-3xl p-7 sm:p-9" data-reveal>
          <ul className="grid gap-2 text-paper/85 sm:grid-cols-2">
            <li className="sm:col-span-2">{PERSON.birthday}</li>
            <li className="sm:col-span-2">{PERSON.location}</li>
            <li>
              E-mail:{" "}
              <a className="link-underline text-paper" href={`mailto:${PERSON.email}`}>
                {PERSON.email}
              </a>
            </li>
            <li>
              Contact No. :{" "}
              <a className="link-underline text-paper" href={PERSON.phoneHref}>
                {PERSON.phone}
              </a>
            </li>
          </ul>
        </div>

        <div className="glass rounded-3xl p-7 sm:p-9" data-reveal>
          <h3 className="eyebrow mb-6">AGENCIES</h3>
          <ol className="relative space-y-6 border-l border-white/10 pl-6">
            {AGENCIES.map((a, i) => (
              <li key={`${a.agency}-${a.period}`} className="relative" data-reveal>
                <span
                  aria-hidden="true"
                  className={`absolute -left-[1.84rem] top-2 h-2.5 w-2.5 rounded-full ${i === 0 ? "bg-signal shadow-[0_0_16px_4px_rgba(255,0,4,0.5)]" : "bg-paper/40"}`}
                />
                <p className="font-display text-xl font-bold text-paper">{a.agency}</p>
                <p className="text-paper/70">
                  <span className="tabular-nums">{a.period}</span> - {a.title}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <div className="glass rounded-3xl p-7 sm:p-9" data-reveal>
          <h3 className="eyebrow mb-6">EDUCATION</h3>
          <ul className="space-y-5">
            {EDUCATION.map((e) => (
              <li key={e.school}>
                <p className="font-display text-xl font-bold text-paper">{e.school}</p>
                <p className="text-paper/80">{e.programme}</p>
                <p className="text-sm tabular-nums text-mute">{e.period}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionShell>
  );
}
