"use client";

import { useSyncExternalStore } from "react";

/** Signals used by the loading screen that aren't covered by three's LoadingManager. */
interface LoadState {
  /** The WebGL canvas has been created and has rendered its first frame. */
  sceneReady: boolean;
  /** The loader has finished its exit animation. */
  introDone: boolean;
}

let state: LoadState = { sceneReady: false, introDone: false };
const listeners = new Set<() => void>();

export const loadStore = {
  get: () => state,
  set(patch: Partial<LoadState>) {
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useLoadState<T>(selector: (s: LoadState) => T): T {
  return useSyncExternalStore(loadStore.subscribe, () => selector(state), () => selector({ sceneReady: false, introDone: false }));
}
