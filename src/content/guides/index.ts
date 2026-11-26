import { absoluteUrl } from "@/config/seo";
import { SITE } from "@/config/site";
import { getSampleItems } from "@/lib/galleryData";

/** A long-form article under /guides/<slug>. The article body lives in its page.tsx. */
export interface GuideMeta {
  slug: string;
  title: string;
  /** One or two sentences: the meta description and the line on /guides. */
  description: string;
  /** YYYY-MM-DD */
  published: string;
  /** YYYY-MM-DD, when the article last changed. */
  updated?: string;
  /** Shorter title for the <title> tag (the full title stays the page heading). */
  metaTitle?: string;
  /** Sample wallpapers shown as figures, by id in public/gallery/manifest.json. */
  figures?: readonly string[];
}

export const GUIDES: readonly GuideMeta[] = [
  {
    slug: "how-generative-wallpapers-work",
    title: "How generative wallpapers work: seeds, noise and determinism",
    metaTitle: "How generative wallpapers work",
    figures: ["topographic-survey-1440p", "flow-field-ember-1440p-notext"],
    description:
      "What a seed really is, how a few lines of seeded noise turn into contour maps and flow fields, and why the same number always draws the same wallpaper on every device.",
    published: "2026-11-24",
    updated: "2026-11-26",
  },
  {
    slug: "oled-and-dark-mode-wallpapers",
    title: "Choosing a wallpaper for an OLED phone or a dark-mode desktop",
    metaTitle: "Wallpapers for OLED and dark-mode screens",
    figures: ["event-horizon-gargantua-1440p-notext", "nebula-violet-1440p-notext"],
    description:
      "True black versus near black, what burn-in really is and why a wallpaper rarely causes it, keeping icons and widgets readable, and which Seedwall looks suit a dark screen.",
    published: "2026-11-24",
    updated: "2026-11-26",
  },
  {
    slug: "wallpaper-sizes-for-any-screen",
    title: "Getting the right wallpaper size for any screen",
    figures: ["cutting-mat-blue-bold-1440p", "cutting-mat-blue-light-iphone"],
    description:
      "Native resolution versus scaled resolution, why a phone wallpaper needs room for the clock, how to handle ultrawide and multi-monitor setups, and how to export the exact size you need.",
    published: "2026-11-24",
    updated: "2026-11-26",
  },
];

/** The gallery samples a guide shows as figures, in order (unknown ids are skipped). */
export function guideFigures(g: GuideMeta) {
  const all = getSampleItems();
  return (g.figures ?? []).flatMap((id) => all.find((i) => i.id === id) ?? []);
}

export function getGuideMeta(slug: string): GuideMeta | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

/** Article + breadcrumb structured data for a guide page. */
export function guideJsonLd(g: GuideMeta): Record<string, unknown> {
  const url = absoluteUrl(`/guides/${g.slug}`);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Seedwall", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Guides", item: absoluteUrl("/guides") },
          { "@type": "ListItem", position: 3, name: g.title, item: url },
        ],
      },
      {
        "@type": "Article",
        headline: g.title,
        description: g.description,
        url,
        mainEntityOfPage: url,
        datePublished: g.published,
        dateModified: g.updated ?? g.published,
        image: guideFigures(g).length ? guideFigures(g).map((i) => absoluteUrl(i.downloadUrl)) : absoluteUrl("/og/default.png"),
        author: { "@id": `${SITE.url}/#author` },
        publisher: { "@id": `${SITE.url}/#author` },
      },
    ],
  };
}
