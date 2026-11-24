import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/config/seo";
import { GENERATORS } from "@/generators";
import { LIVE_SCENES } from "@/live";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/studio"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/paint"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/gallery"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/live"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/daily"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/mac"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/claude"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    ...GENERATORS.map((g) => ({
      url: absoluteUrl(`/generators/${g.id}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
      images: [absoluteUrl(`/og/${g.id}.png`)],
    })),
    ...LIVE_SCENES.map((s) => ({
      url: absoluteUrl(`/live/${s.id}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
      images: [absoluteUrl(`/live/${s.id}/${s.presets[0]?.id ?? ""}.jpg`)],
    })),
  ];
}
