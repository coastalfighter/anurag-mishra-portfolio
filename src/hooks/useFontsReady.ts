"use client";

import { useEffect, useState } from "react";

/** Resolves once web fonts have loaded, so canvas-rendered 3D labels use the real typefaces. */
export function useFontsReady(): boolean {
  // Client-only consumers (3D labels): no FontFaceSet support means nothing to wait for.
  const [ready, setReady] = useState<boolean>(() => typeof document !== "undefined" && !document.fonts);
  useEffect(() => {
    let alive = true;
    const fonts = typeof document !== "undefined" ? document.fonts : undefined;
    if (!fonts) return;
    // Never block forever on a failed font request.
    const timeout = window.setTimeout(() => alive && setReady(true), 2500);
    void fonts.ready.then(() => {
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
      window.clearTimeout(timeout);
    };
  }, []);
  return ready;
}
