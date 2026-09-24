import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CASE_STUDIES, NAV_ITEMS, SECTIONS, embedUrl, getAdjacentCaseStudies, getCaseStudy } from "@/lib/sectionData";

const pub = (p: string) => join(process.cwd(), "public", p);

describe("content", () => {
  it("keeps all 13 case studies from the live site, with unique slugs", () => {
    expect(CASE_STUDIES).toHaveLength(13);
    expect(new Set(CASE_STUDIES.map((c) => c.slug)).size).toBe(13);
  });

  it("references image assets that exist on disk", () => {
    for (const c of CASE_STUDIES) {
      expect(existsSync(pub(c.thumb.src)), c.thumb.src).toBe(true);
      if (c.thumb.animated) expect(existsSync(pub(c.thumb.animated))).toBe(true);
      c.gallery.forEach((g) => expect(existsSync(pub(g.src)), g.src).toBe(true));
    }
  });

  it("navigation targets real sections", () => {
    const ids = SECTIONS.map((s) => s.id);
    NAV_ITEMS.forEach((n) => expect(ids).toContain(n.id));
  });

  it("finds case studies and wraps neighbours", () => {
    expect(getCaseStudy("croma")?.title).toBe("CROMA");
    expect(getCaseStudy("nope")).toBeUndefined();
    const adj = getAdjacentCaseStudies(CASE_STUDIES[0]!.slug)!;
    expect(adj.prev.slug).toBe(CASE_STUDIES[12]!.slug);
  });

  it("builds privacy-friendly embed URLs", () => {
    expect(embedUrl({ kind: "youtube", id: "abc", title: "t" })).toContain("youtube-nocookie.com/embed/abc");
    const v = embedUrl({ kind: "vimeo", id: "1", hash: "h1", title: "t" });
    expect(v).toContain("dnt=1");
    expect(v).toContain("h=h1");
  });
});
