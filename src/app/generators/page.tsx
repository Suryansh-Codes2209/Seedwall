import type { Metadata } from "next";
import Link from "next/link";
import { GeneratorCard } from "@/components/GeneratorCard";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl, pageMetadata } from "@/config/seo";
import { NEW_GENERATORS, SITE } from "@/config/site";
import { GENERATORS } from "@/generators";

export const metadata: Metadata = pageMetadata({
  title: "All wallpaper generators",
  description: `All ${GENERATORS.length} Seedwall wallpaper generators, from cutting mats and flow fields to black holes and cymatics. Each has presets, samples and free PNG downloads.`,
  path: "/generators",
});

export default function GeneratorsPage() {
  const url = absoluteUrl("/generators");
  const structured = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Seedwall", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Generators", item: url },
        ],
      },
      {
        "@type": "CollectionPage",
        "@id": url,
        url,
        name: "Wallpaper generators",
        isPartOf: { "@id": `${SITE.url}/#website` },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: GENERATORS.length,
          itemListElement: GENERATORS.map((g, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: `${g.name} wallpaper generator`,
            url: absoluteUrl(`/generators/${g.id}`),
          })),
        },
      },
    ],
  };
  return (
    <div className="container section">
      <JsonLd data={structured} />
      <div className="section-head">
        <div>
          <span className="eyebrow">Generators</span>
          <h1 className="page-h1">Wallpaper <em>generators</em></h1>
          <p>
            Every look on Seedwall is one TypeScript generator that turns parameters and a seed into an SVG. Each has its own
            page with presets, sample wallpapers, a parameter table and a short guide. Pick one to read about it, or open it in
            the <Link href="/studio">studio</Link> to change the colours, add a quote or go text-free, and download a PNG at
            your screen&apos;s exact size.
          </p>
        </div>
      </div>
      <div className="grid-cards">
        {GENERATORS.map((g) => (
          <GeneratorCard key={g.id} gen={g} isNew={NEW_GENERATORS.includes(g.id)} />
        ))}
      </div>
    </div>
  );
}
