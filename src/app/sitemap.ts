import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/config/seo";
import { GUIDES } from "@/content/guides";
import { GENERATORS } from "@/generators";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/studio"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/paint"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/gallery"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/daily"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/mac"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/claude"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/guides"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    ...GUIDES.map((g) => ({ url: absoluteUrl(`/guides/${g.slug}`), lastModified: new Date(g.published), changeFrequency: "yearly" as const, priority: 0.6 })),
    { url: absoluteUrl("/about"), lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: absoluteUrl("/contact"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/privacy"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/terms"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    ...GENERATORS.map((g) => ({
      url: absoluteUrl(`/generators/${g.id}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
      images: [absoluteUrl(`/og/${g.id}.png`)],
    })),
  ];
}
