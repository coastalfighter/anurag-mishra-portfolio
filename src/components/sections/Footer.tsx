import Link from "next/link";
import { NAV_ITEMS, PERSON } from "@/lib/sectionData";

/** Standard footer: identity, navigation, contact, copyright. */
export function Footer({ linkPrefix = "" }: { linkPrefix?: string }) {
  const year = new Date().getFullYear();
  return (
    <footer className="relative z-10 border-t border-white/10 bg-void/95 px-4 py-14 sm:px-8 lg:px-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-3xl font-black tracking-[0.12em] text-paper">{PERSON.name}</p>
          <p className="mt-2 text-mute">
            {PERSON.currentRole} · {PERSON.currentAgency}
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-8 gap-y-3 text-sm uppercase tracking-[0.22em] text-paper/75">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <Link href={`${linkPrefix}#${item.id}`} className="link-underline hover:text-paper">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="text-sm text-mute md:text-right">
          <a href={`mailto:${PERSON.email}`} className="link-underline block text-paper/85">
            {PERSON.email}
          </a>
          <p className="mt-1">
            © {year} {PERSON.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
