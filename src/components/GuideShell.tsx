import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/JsonLd";
import { AUTHOR, pageMetadata } from "@/config/seo";
import { GUIDES, getGuideMeta, guideJsonLd, type GuideMeta } from "@/content/guides";

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function meta(slug: string): GuideMeta {
  const g = getGuideMeta(slug);
  if (!g) throw new Error(`Unknown guide ${slug}`);
  return g;
}

export function guideMetadata(slug: string): Metadata {
  const g = meta(slug);
  return pageMetadata({ title: g.title, description: g.description, path: `/guides/${g.slug}` });
}

/** Header, structured data and "more guides" around one article's body. */
export function GuideShell({ slug, children }: { slug: string; children: ReactNode }) {
  const g = meta(slug);
  const others = GUIDES.filter((o) => o.slug !== slug);
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
            By {AUTHOR.name}. Published <time dateTime={g.published}>{DATE.format(new Date(g.published))}</time>.
          </p>
        </header>
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
