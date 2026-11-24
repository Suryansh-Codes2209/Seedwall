import { AUTHOR, absoluteUrl } from "@/config/seo";

/** A long-form article under /guides/<slug>. The article body lives in its page.tsx. */
export interface GuideMeta {
  slug: string;
  title: string;
  /** One or two sentences: the meta description and the line on /guides. */
  description: string;
  /** YYYY-MM-DD */
  published: string;
}

export const GUIDES: readonly GuideMeta[] = [
  {
    slug: "how-generative-wallpapers-work",
    title: "How generative wallpapers work: seeds, noise and determinism",
    description:
      "What a seed really is, how a few lines of seeded noise turn into contour maps and flow fields, and why the same number always draws the same wallpaper on every device.",
    published: "2026-11-24",
  },
  {
    slug: "oled-and-dark-mode-wallpapers",
    title: "Choosing a wallpaper for an OLED phone or a dark-mode desktop",
    description:
      "True black versus near black, what burn-in really is and why a wallpaper rarely causes it, keeping icons and widgets readable, and which Seedwall looks suit a dark screen.",
    published: "2026-11-24",
  },
  {
    slug: "wallpaper-sizes-for-any-screen",
    title: "Getting the right wallpaper size for any screen",
    description:
      "Native resolution versus scaled resolution, why a phone wallpaper needs room for the clock, how to handle ultrawide and multi-monitor setups, and how to export the exact size you need.",
    published: "2026-11-24",
  },
];

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
        dateModified: g.published,
        image: absoluteUrl("/og/default.png"),
        author: { "@type": "Person", name: AUTHOR.name, url: AUTHOR.url },
        publisher: { "@type": "Person", name: AUTHOR.name, url: AUTHOR.url },
      },
    ],
  };
}
