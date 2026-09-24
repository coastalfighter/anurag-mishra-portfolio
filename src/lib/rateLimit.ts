/**
 * Fixed-window in-memory rate limiter.
 *
 * Good enough for a single-instance / serverless portfolio: each warm instance
 * keeps its own window. For multi-region deployments swap the Map for a shared
 * store (e.g. Upstash Redis) behind the same interface.
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Epoch ms when the window resets. */
  resetAt: number;
}

export function createRateLimiter({ limit, windowMs, maxKeys = 5000 }: { limit: number; windowMs: number; maxKeys?: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return function check(key: string, now = Date.now()): RateLimitResult {
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      if (hits.size >= maxKeys) {
        // Evict expired entries first, then the oldest, to bound memory.
        for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
        if (hits.size >= maxKeys) hits.delete(hits.keys().next().value as string);
      }
      const fresh = { count: 1, resetAt: now + windowMs };
      hits.set(key, fresh);
      return { allowed: true, remaining: limit - 1, resetAt: fresh.resetAt };
    }
    entry.count += 1;
    return { allowed: entry.count <= limit, remaining: Math.max(0, limit - entry.count), resetAt: entry.resetAt };
  };
}
