"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { EASE } from "@/lib/gsapConfig";
import { NAV_ITEMS, PERSON, type SectionId } from "@/lib/sectionData";
import { useActiveSection } from "@/hooks/useScrollProgress";
import { useSmoothScroll } from "@/components/layout/SmoothScroll";
import { MobileMenu } from "./MobileMenu";

interface Props {
  /** "home": in-page navigation (the guide walks to the section). "page": links back to the home page. */
  mode?: "home" | "page";
}

/** Floating navigation that stays above the 3D world; hides on fast downward scroll. */
export function Navbar({ mode = "home" }: Props) {
  const { scrollToId } = useSmoothScroll();
  const active = useActiveSection();
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > prev + 4 && y > 240 && !menuOpen);
    if (y < prev - 4) setHidden(false);
  });

  const go = (id: SectionId) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (mode !== "home") return; // normal navigation to /#id
    e.preventDefault();
    setMenuOpen(false);
    scrollToId(id);
  };

  const href = (id: SectionId) => (mode === "home" ? `#${id}` : `/#${id}`);

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: hidden ? -110 : 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: EASE.bezierOut }}
        className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-8 sm:pt-6"
      >
        <nav
          aria-label="Primary"
          className="glass mx-auto flex max-w-7xl items-center justify-between rounded-full py-2.5 pl-5 pr-2.5 sm:pl-7"
        >
          <Link
            href={mode === "home" ? "#hero" : "/"}
            onClick={mode === "home" ? go("hero") : undefined}
            className="font-display text-sm font-black tracking-[0.28em] text-paper"
            aria-label={`${PERSON.name} — back to the start`}
          >
            {PERSON.name}
          </Link>

          <ul className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = mode === "home" && active === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={href(item.id)}
                    onClick={go(item.id)}
                    aria-current={isActive ? "location" : undefined}
                    className="relative block rounded-full px-4 py-2 text-[0.8rem] uppercase tracking-[0.22em] text-paper/75 transition-colors hover:text-paper"
                  >
                    <AnimatePresence>
                      {isActive && (
                        <motion.span
                          layoutId="nav-pill"
                          className="absolute inset-0 -z-10 rounded-full bg-white/10"
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        />
                      )}
                    </AnimatePresence>
                    {item.label}
                  </a>
                </li>
              );
            })}
            <li>
              <a
                href={`mailto:${PERSON.email}`}
                className="ml-2 block rounded-full bg-signal px-5 py-2 text-[0.8rem] uppercase tracking-[0.22em] text-white transition-transform hover:scale-[1.03]"
              >
                Email
              </a>
            </li>
          </ul>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="relative block h-3 w-5" aria-hidden="true">
              <span
                className={`absolute left-0 h-px w-5 bg-paper transition-transform duration-300 ${menuOpen ? "top-1.5 rotate-45" : "top-0"}`}
              />
              <span
                className={`absolute left-0 h-px w-5 bg-paper transition-transform duration-300 ${menuOpen ? "top-1.5 -rotate-45" : "top-3"}`}
              />
            </span>
          </button>
        </nav>
      </motion.header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} onNavigate={go} hrefFor={href} active={active} />
    </>
  );
}
