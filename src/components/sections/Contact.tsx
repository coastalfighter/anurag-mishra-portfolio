"use client";

import { PERSON } from "@/lib/sectionData";
import { ContactForm } from "@/components/ui/ContactForm";
import { SectionShell } from "./SectionShell";

/** CONTACT — the journey's final destination: the guide arrives at the desk. */
export function Contact() {
  return (
    <SectionShell id="contact" side="right" heading="Contact" minHeight="min-h-[140vh]">
      <div className="glass rounded-3xl p-7 sm:p-10" data-reveal>
        <dl className="mb-10 grid gap-6 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-[0.25em] text-mute">E-mail</dt>
            <dd className="mt-2">
              <a href={`mailto:${PERSON.email}`} className="link-underline break-all font-display text-lg font-bold text-paper">
                {PERSON.email}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.25em] text-mute">Contact No.</dt>
            <dd className="mt-2">
              <a href={PERSON.phoneHref} className="link-underline font-display text-lg font-bold text-paper">
                {PERSON.phone}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.25em] text-mute">Location</dt>
            <dd className="mt-2 font-display text-lg font-bold text-paper">{PERSON.location}</dd>
          </div>
        </dl>
        <ContactForm />
      </div>
    </SectionShell>
  );
}
