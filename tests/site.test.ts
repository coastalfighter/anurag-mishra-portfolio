import { describe, expect, it } from "vitest";
import { normaliseSiteUrl, resolveSiteUrl } from "@/lib/site";

describe("site URL resolution", () => {
  it("ignores empty or invalid values instead of crashing", () => {
    expect(normaliseSiteUrl("")).toBeNull();
    expect(normaliseSiteUrl("   ")).toBeNull();
    expect(normaliseSiteUrl("http://")).toBeNull();
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "" })).toBe("https://www.aanuragmishra.com");
  });

  it("adds a protocol to bare hosts and strips paths/trailing slashes", () => {
    expect(normaliseSiteUrl("my-app.vercel.app")).toBe("https://my-app.vercel.app");
    expect(normaliseSiteUrl("https://example.com/")).toBe("https://example.com");
  });

  it("falls back to Vercel's system variables", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "", VERCEL_PROJECT_PRODUCTION_URL: "portfolio.vercel.app" })).toBe(
      "https://portfolio.vercel.app",
    );
    expect(resolveSiteUrl({ VERCEL_URL: "portfolio-abc123.vercel.app" })).toBe("https://portfolio-abc123.vercel.app");
  });

  it("prefers an explicit NEXT_PUBLIC_SITE_URL", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://www.aanuragmishra.com", VERCEL_URL: "x.vercel.app" })).toBe(
      "https://www.aanuragmishra.com",
    );
  });
});
