"use client";

import { motion } from "framer-motion";
import { SECTIONS } from "@/lib/sectionData";
import { useActiveSection } from "@/hooks/useScrollProgress";
import { useSmoothScroll } from "@/components/layout/SmoothScroll";

/** Vertical dot rail showing where the guide is on the journey. Keyboard accessible. */
export function SectionIndicator() {
  const active = useActiveSection();
  const { scrollToId } = useSmoothScroll();

  return (
    <nav
      aria-label="Journey sections"
      className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 lg:block"
    >
      <ol className="flex flex-col items-end gap-4">
        {SECTIONS.map((s) => {
          const isActive = s.id === active;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToId(s.id);
                }}
                aria-current={isActive ? "step" : undefined}
                className="group flex items-center gap-3 py-0.5"
              >
                <span
                  className={`text-[0.68rem] uppercase tracking-[0.25em] transition-all duration-500 ${
                    isActive ? "translate-x-0 text-paper opacity-100" : "translate-x-2 text-mute opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                  }`}
                >
                  <span className="text-signal">{s.index}</span> {s.label}
                </span>
                <span className="relative flex h-3 w-3 items-center justify-center" aria-hidden="true">
                  <span className="h-1.5 w-1.5 rounded-full bg-paper/40" />
                  {isActive && (
                    <motion.span
                      layoutId="section-dot"
                      className="absolute inset-0 rounded-full border border-signal bg-signal/30"
                      transition={{ type: "spring", stiffness: 300, damping: 28 }}
                    />
                  )}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
