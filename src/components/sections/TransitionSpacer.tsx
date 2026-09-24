"use client";

import { useIs3D, useTier } from "@/components/layout/TierContext";

/**
 * Scroll distance between two sections where the guide walks through a
 * transition set-piece (portal, bridge, tunnel…). Purely decorative.
 */
export function TransitionSpacer({ label }: { label: string }) {
  const is3D = useIs3D();
  const tier = useTier();
  const height = is3D ? "h-[95vh]" : tier === "fallback" ? "h-[28vh]" : "h-16";
  return (
    <div aria-hidden="true" className={`relative ${height} flex items-center justify-center`}>
      {is3D && (
        <p className="font-body text-[0.7rem] uppercase tracking-[0.5em] text-paper/35" data-reveal>
          {label}
        </p>
      )}
    </div>
  );
}
