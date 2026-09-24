import type { MetadataRoute } from "next";
import { CASE_STUDIES } from "@/lib/sectionData";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 },
    ...CASE_STUDIES.map((c) => ({ url: `${SITE_URL}/work/${c.slug}`, changeFrequency: "yearly" as const, priority: 0.7 })),
  ];
}
