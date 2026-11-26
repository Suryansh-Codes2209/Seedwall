import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/JsonLd";
import { AUTHOR, pageMetadata } from "@/config/seo";
import { GUIDES, getGuideMeta, guideFigures, guideJsonLd, type GuideMeta } from "@/content/guides";
import { getGenerator } from "@/generators";
import { previewSize } from "@/lib/gallery";
import { sampleLabel } from "@/lib/generatorPage";

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function meta(slug: string): GuideMeta {
  const g = getGuideMeta(slug);
  if (!g) throw new Error(`Unknown guide ${slug}`);
  return g;
}

export function guideMetadata(slug: string): Metadata {
  const g = meta(slug);
  return pageMetadata({
    title: g.metaTitle ?? g.title,
    description: g.description,
    path: `/guides/${g.slug}`,
    type: "article",
    publishedTime: g.published,
    modifiedTime: g.updated ?? g.published,
  });
}

/** Header, structured data and "more guides" around one article's body. */
export function GuideShell({ slug, children }: { slug: string; children: ReactNode }) {
  const g = meta(slug);
  const others = GUIDES.filter((o) => o.slug !== slug);
  const figures = guideFigures(g).flatMap((item) => {
    const gen = getGenerator(item.generator);
    return gen ? [{ item, gen, label: sampleLabel(gen, item), size: previewSize(item) }] : [];
  });
  return (
    <div className="container section">
      <JsonLd data={guideJsonLd(g)} />
      <article>
        <header className="longform">
          <span className="eyebrow">
            <Link href="/guides">Guides</Link>
          </span>
          <h1 className="page-h1">{g.title}</h1>
          <p className="lead">{g.description}</p>
          <p className="page-meta">
            By <Link href="/about">{AUTHOR.name}</Link>. Published <time dateTime={g.published}>{DATE.format(new Date(g.published))}</time>.
            {g.updated && g.updated !== g.published && (
              <> Updated <time dateTime={g.updated}>{DATE.format(new Date(g.updated))}</time>.</>
            )}
          </p>
        </header>
        {figures.length > 0 && (
          <div className="longform guide-figures">
            {figures.map(({ item, gen, label, size }) => (
              <figure key={item.id} className={item.height > item.width ? "portrait" : undefined}>
                <a href={item.downloadUrl}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- a fixed-size preview from /public, no optimiser needed */}
                  <img src={item.previewUrl} alt={label.alt} width={size.width} height={size.height} loading="lazy" decoding="async" />
                </a>
                <figcaption>
                  <Link href={`/generators/${gen.id}`}>{gen.name}</Link>, {label.preset} preset, {item.width}×{item.height}.
                </figcaption>
              </figure>
            ))}
          </div>
        )}
        <div className="prose longform">{children}</div>
      </article>
      {others.length > 0 && (
        <nav className="prose longform" aria-labelledby="more-guides-h">
          <h2 id="more-guides-h">More guides</h2>
          <ul>
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={`/guides/${o.slug}`}>{o.title}</Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
