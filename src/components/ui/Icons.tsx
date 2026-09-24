import type { ReactElement, SVGProps } from "react";
import type { HighlightIcon } from "@/lib/sectionData";

const base: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
};

const paths: Record<HighlightIcon, ReactElement> = {
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.6 2.4 3.8 5.2 3.8 8.5s-1.2 6.1-3.8 8.5c-2.6-2.4-3.8-5.2-3.8-8.5S9.4 5.9 12 3.5z" />
    </>
  ),
  lion: (
    <>
      <path d="M12 3l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L4.8 8.3l5-.7z" />
      <path d="M8 21h8" />
    </>
  ),
  hashtag: <path d="M9 3.5 7 20.5M17 3.5l-2 17M4 9h16.5M3.5 15H20" />,
  handshake: (
    <>
      <path d="M2.5 12.5 6 9l4 1.5 3-2.5 5 1 3.5 3.5" />
      <path d="m6 9 5.5 7a1.6 1.6 0 0 0 2.4.1l4.6-4.6M9.5 14l-2 2M12 16.5l-1.5 1.5" />
    </>
  ),
  chess: (
    <>
      <circle cx="12" cy="6" r="2.5" />
      <path d="M9.5 10.5h5l-1 5h-3zM8 20.5h8M9 18h6l.8 2.5H8.2z" />
    </>
  ),
};

export function HighlightGlyph({ icon, className }: { icon: HighlightIcon; className?: string }) {
  return (
    <svg {...base} className={className}>
      {paths[icon]}
    </svg>
  );
}

export function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
