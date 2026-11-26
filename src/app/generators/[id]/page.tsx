import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GeneratorGuideSection, faqPageSchema } from "@/components/GeneratorGuide";
import { JsonLd } from "@/components/JsonLd";
import { GeneratorCard } from "@/components/GeneratorCard";
import { LiveThumb } from "@/components/LiveThumb";
import { absoluteUrl, pageMetadata } from "@/config/seo";
import { SITE } from "@/config/site";
import { getGuide } from "@/content/generators";
import { GENERATORS, getGenerator } from "@/generators";
import type { ParamDef } from "@/generators/types";
import { previewSize } from "@/lib/gallery";
import { posterFor, samplesFor } from "@/lib/galleryData";
import { generatorDescription, relatedLooks, sampleLabel } from "@/lib/generatorPage";

export const dynamicParams = false;

export function generateStaticParams() {
  return GENERATORS.map((g) => ({ id: g.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const gen = getGenerator((await params).id);
  if (!gen) return {};
  return pageMetadata({
    title: `${gen.name} wallpaper generator`,
    description: generatorDescription(gen),
    path: `/generators/${gen.id}`,
    image: `/og/${gen.id}.png`,
    imageAlt: `${gen.name} wallpaper made with Seedwall`,
  });
}

function describe(def: ParamDef): string {
  switch (def.kind) {
    case "range": return `${def.min} to ${def.max}`;
    case "select": return def.options.map((o) => o.value).join(" · ");
    case "color": return "hex colour";
    case "toggle": return "on / off";
    case "seed": return "integer";
    case "text": return def.multiline ? "multi-line text" : "text";
  }
}

export default async function GeneratorPage({ params }: { params: Promise<{ id: string }> }) {
  const gen = getGenerator((await params).id);
  if (!gen) notFound();
  const first = gen.presets[0];
  const url = absoluteUrl(`/generators/${gen.id}`);
  const guide = getGuide(gen.id);
  const faq = guide ? faqPageSchema(guide, url) : undefined;
  const samples = samplesFor(gen.id);
  const heroSample = posterFor(gen.id, first?.id);
  const related = relatedLooks(gen);
  const pngHref = (device: string) => `/api/render?g=${gen.id}&p=${first?.id ?? ""}&d=${device}`;
  const structured = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Seedwall", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Generators", item: absoluteUrl("/generators") },
          { "@type": "ListItem", position: 3, name: gen.name, item: url },
        ],
      },
      {
        "@type": "WebPage",
        "@id": url,
        url,
        name: `${gen.name} wallpaper generator`,
        description: gen.description,
        isPartOf: { "@id": `${SITE.url}/#website` },
        about: { "@id": `${SITE.url}/#app` },
        ...(samples[0] ? { primaryImageOfPage: { "@id": `${url}#sample-1` } } : {}),
        image: samples.map((_, i) => ({ "@id": `${url}#sample-${i + 1}` })),
      },
      ...samples.map((item, i) => ({
        "@type": "ImageObject",
        "@id": `${url}#sample-${i + 1}`,
        name: sampleLabel(gen, item).alt,
        contentUrl: absoluteUrl(item.downloadUrl),
        thumbnailUrl: absoluteUrl(item.previewUrl),
        width: item.width,
        height: item.height,
        encodingFormat: "image/png",
        creator: { "@id": `${SITE.url}/#author` },
        isAccessibleForFree: true,
      })),
      ...(faq ? [faq] : []),
    ],
  };

  return (
    <div className="container">
      <JsonLd data={structured} />
      <section className="gen-hero">
        <div>
          <nav className="eyebrow breadcrumb" aria-label="Breadcrumb">
            <ol>
              <li><Link href="/">Seedwall</Link></li>
              <li><Link href="/generators">Generators</Link></li>
              <li aria-current="page">{gen.name}</li>
            </ol>
          </nav>
          <h1>{`${gen.name} wallpaper generator`}</h1>
          <p>{gen.description}</p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href={`/studio?g=${gen.id}&p=${first?.id ?? ""}`}>Open in Studio</Link>
            <Link className="btn" href="/gallery">See the gallery</Link>
          </div>
          <p className="page-meta">
            Download the {first?.title ?? "default"} preset as a PNG:{" "}
            <a href={pngHref("macbook14")} download rel="nofollow">MacBook</a> or{" "}
            <a href={pngHref("iphone")} download rel="nofollow">iPhone</a>.
          </p>
        </div>
        <div className="card-media">
          <LiveThumb
            gen={gen.id}
            preset={first?.id}
            w={2400}
            h={1500}
            label={`${gen.name} preview`}
            priority
            poster={heroSample && { src: heroSample.previewUrl, ...previewSize(heroSample), alt: sampleLabel(gen, heroSample).alt }}
          />
        </div>
      </section>

      <section className="section" aria-labelledby="presets-h">
        <div className="section-head">
          <h2 id="presets-h">Presets</h2>
        </div>
        <div className="grid-cards">
          {gen.presets.map((p) => {
            const sample = posterFor(gen.id, p.id);
            return (
            <Link key={p.id} href={`/studio?g=${gen.id}&p=${p.id}`} className="card">
              <div className="card-media">
                <LiveThumb
                  gen={gen.id}
                  preset={p.id}
                  w={1600}
                  h={1000}
                  label={p.title}
                  poster={sample && { src: sample.previewUrl, ...previewSize(sample), alt: sampleLabel(gen, sample).alt }}
                />
              </div>
              <div className="card-body">
                <h3>{p.title}</h3>
                <p className="mono">{p.id}</p>
              </div>
            </Link>
            );
          })}
        </div>
      </section>

      {samples.length > 0 && (
        <section className="section" aria-labelledby="samples-h">
          <div className="section-head">
            <div>
              <h2 id="samples-h">Sample wallpapers</h2>
              <p>Full-size PNGs rendered by the same code as the studio. Open one to download it.</p>
            </div>
          </div>
          <div className="gallery-grid">
            {samples.map((item) => {
              const { preset, device, alt } = sampleLabel(gen, item);
              const size = previewSize(item);
              return (
                <a key={item.id} href={item.downloadUrl} className={`gallery-item${item.height > item.width ? " portrait" : ""}`}>
                  <div className="gi-media">
                    {/* eslint-disable-next-line @next/next/no-img-element -- a fixed-size preview from /public, no optimiser needed */}
                    <img src={item.previewUrl} alt={alt} width={size.width} height={size.height} loading="lazy" decoding="async" />
                  </div>
                  <div className="gi-body">
                    <strong>{preset}</strong>
                    <span className="tag" title={`${device}, ${item.width}×${item.height}`}>{item.height > item.width ? "phone" : "desktop"}</span>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}

      <section className="section" aria-labelledby="params-h">
        <div className="section-head">
          <h2 id="params-h">Parameters</h2>
        </div>
        <div className="table-wrap">
          <table className="param-table">
            <thead>
              <tr><th>Key</th><th>Label</th><th>Values</th><th>Default</th></tr>
            </thead>
            <tbody>
              {Object.entries(gen.params).filter(([, def]) => !def.hidden).map(([key, def]) => (
                <tr key={key}>
                  <td><code>{key}</code></td>
                  <td>{def.label}</td>
                  <td>{describe(def)}</td>
                  <td><code>{String(def.default).slice(0, 40)}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {guide && <GeneratorGuideSection name={gen.name} guide={guide} />}

      <section className="section" aria-labelledby="related-h">
        <div className="section-head">
          <div>
            <h2 id="related-h">Related looks</h2>
            <p>More generators to try, or <Link href="/generators">see all {GENERATORS.length}</Link>.</p>
          </div>
        </div>
        <div className="grid-cards">
          {related.map((g) => (
            <GeneratorCard key={g.id} gen={g} />
          ))}
        </div>
      </section>
    </div>
  );
}
