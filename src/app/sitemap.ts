import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/config/seo";
import { GUIDES } from "@/content/guides";
import { GENERATORS } from "@/generators";
import { getSampleItems, samplesFor } from "@/lib/galleryData";
import { LIVE_SCENES } from "@/live";
import { posterPath } from "@/live/poster";

/**
 * When each page's content last changed (YYYY-MM-DD). Search engines only trust <lastmod> when it
 * is accurate, so these are edited by hand when a page changes, never set to the build time.
 */
const UPDATED = {
  home: "2026-11-26",
  studio: "2026-11-26",
  paint: "2026-11-22",
  gallery: "2026-11-26",
  live: "2026-11-25",
  liveScenes: "2026-11-26",
  daily: "2026-11-22",
  mac: "2026-11-22",
  claude: "2026-11-22",
  guides: "2026-11-24",
  about: "2026-11-24",
  contact: "2026-11-24",
  privacy: "2026-11-24",
  terms: "2026-11-24",
  generators: "2026-11-26",
} as const;

const page = (path: string, updated: string, images?: string[]): MetadataRoute.Sitemap[number] => ({
  url: absoluteUrl(path),
  lastModified: updated,
  ...(images?.length ? { images } : {}),
});

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    page("/", UPDATED.home),
    page("/studio", UPDATED.studio),
    page("/paint", UPDATED.paint),
    page("/gallery", UPDATED.gallery, getSampleItems().map((i) => absoluteUrl(i.downloadUrl))),
    page("/live", UPDATED.live),
    page("/daily", UPDATED.daily),
    page("/mac", UPDATED.mac),
    page("/claude", UPDATED.claude),
    page("/guides", UPDATED.guides),
    ...GUIDES.map((g) => page(`/guides/${g.slug}`, g.updated ?? g.published)),
    page("/about", UPDATED.about),
    page("/contact", UPDATED.contact),
    page("/privacy", UPDATED.privacy),
    page("/terms", UPDATED.terms),
    page("/generators", UPDATED.generators),
    ...GENERATORS.map((g) =>
      page(`/generators/${g.id}`, UPDATED.generators, [...samplesFor(g.id).map((i) => absoluteUrl(i.downloadUrl)), absoluteUrl(`/og/${g.id}.png`)]),
    ),
    ...LIVE_SCENES.map((s) => page(`/live/${s.id}`, UPDATED.liveScenes, [absoluteUrl(posterPath(s.id, s.presets[0]?.id ?? ""))])),
  ];
}
