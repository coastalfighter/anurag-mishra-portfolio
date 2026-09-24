"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, type MouseEvent } from "react";
import { EASE } from "@/lib/gsapConfig";
import { NAV_ITEMS, PERSON, type SectionId } from "@/lib/sectionData";
import { useSmoothScroll } from "@/components/layout/SmoothScroll";

interface Props {
  open: boolean;
  onClose: () => void;
  onNavigate: (id: SectionId) => (e: MouseEvent<HTMLAnchorElement>) => void;
  hrefFor: (id: SectionId) => string;
  active: SectionId;
}

/** Full-screen menu for small screens, with focus trap and Escape-to-close. */
export function MobileMenu({ open, onClose, onNavigate, hrefFor, active }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const { setLocked } = useSmoothScroll();

  useEffect(() => {
    if (!open) return;
    setLocked(true);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const first = panel.current?.querySelector<HTMLElement>("a,button");
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const focusables = Array.from(panel.current.querySelectorAll<HTMLElement>("a,button"));
      if (focusables.length === 0) return;
      const firstEl = focusables[0]!;
      const lastEl = focusables[focusables.length - 1]!;
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const panelEl = panel.current;
    return () => {
      document.removeEventListener("keydown", onKey);
      setLocked(false);
      // Restore focus to the toggle only if navigation didn't already move it to a section.
      const current = document.activeElement;
      if (!current || current === document.body || panelEl?.contains(current)) {
        previouslyFocused?.focus?.({ preventScroll: true });
      }
    };
  }, [open, onClose, setLocked]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="mobile-menu"
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="fixed inset-0 z-40 flex flex-col justify-between bg-void/95 px-6 pb-10 pt-28 backdrop-blur-xl md:hidden"
          initial={{ clipPath: "inset(0 0 100% 0)" }}
          animate={{ clipPath: "inset(0 0 0% 0)" }}
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.7, ease: EASE.bezierInOut }}
        >
          <nav aria-label="Mobile">
            <ul className="space-y-2">
              {NAV_ITEMS.map((item, i) => (
                <motion.li
                  key={item.id}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25 + i * 0.07, duration: 0.6, ease: EASE.bezierOut }}
                >
                  <a
                    href={hrefFor(item.id)}
                    onClick={(e) => {
                      onNavigate(item.id)(e);
                      onClose();
                    }}
                    aria-current={active === item.id ? "location" : undefined}
                    className="flex items-baseline gap-4 font-display text-5xl font-black uppercase tracking-tight text-paper"
                  >
                    <span className="font-body text-sm tracking-[0.3em] text-signal">0{i + 1}</span>
                    {item.label}
                  </a>
                </motion.li>
              ))}
            </ul>
          </nav>
          <div className="space-y-1 text-mute">
            <a href={`mailto:${PERSON.email}`} className="block text-paper">
              {PERSON.email}
            </a>
            <a href={PERSON.phoneHref} className="block">
              {PERSON.phone}
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
