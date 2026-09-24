import { PERSON } from "./sectionData";

const DEFAULT_SITE_URL = "https://www.aanuragmishra.com";

/**
 * Turns an env value into a usable absolute origin, or null.
 * Accepts bare hosts ("my-app.vercel.app") and ignores empty/invalid values,
 * so a blank variable in the hosting dashboard can never break the build.
 */
export function normaliseSiteUrl(value: string | undefined | null): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withProtocol);
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Canonical site URL, in priority order:
 *  1. NEXT_PUBLIC_SITE_URL (set this once the custom domain is live)
 *  2. Vercel's production domain, then the deployment URL (set automatically by Vercel)
 *  3. The live domain
 */
export function resolveSiteUrl(env: Record<string, string | undefined> = process.env): string {
  return (
    normaliseSiteUrl(env.NEXT_PUBLIC_SITE_URL) ??
    normaliseSiteUrl(env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normaliseSiteUrl(env.VERCEL_URL) ??
    DEFAULT_SITE_URL
  );
}

export const SITE_URL = resolveSiteUrl();

export const SITE = {
  name: "ANURAG MISHRA",
  title: "ANURAG MISHRA",
  description:
    "I’m a versatile brand builder with a keen ability to uncover deep consumer insights and transform them into compelling brand narratives.",
  url: SITE_URL,
  ogImage: "/assets/videos/character-walk-poster.jpg",
  email: PERSON.email,
} as const;
