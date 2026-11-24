import type { GeneratorGuide } from "@/content/generators/types";

/** FAQPage structured data for a guide, to sit in the page's @graph. Undefined when there is no FAQ. */
export function faqPageSchema(guide: GeneratorGuide, pageUrl: string): Record<string, unknown> | undefined {
  if (!guide.faq.length) return undefined;
  return {
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    mainEntity: guide.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

const paras = (items: string[]) => items.map((t, i) => <p key={i}>{t}</p>);

/** The long-form write-up under a generator's presets and parameters. */
export function GeneratorGuideSection({ name, guide }: { name: string; guide: GeneratorGuide }) {
  return (
    <section className="section" aria-labelledby="guide-h">
      <div className="section-head">
        <div>
          <span className="eyebrow">Guide</span>
          <h2 id="guide-h">{name}, explained</h2>
        </div>
      </div>
      <div className="prose longform">
        <h2>About this look</h2>
        {paras(guide.intro)}

        <h2>How it works</h2>
        {paras(guide.howItWorks)}

        {guide.settings.length > 0 && (
          <>
            <h2>Settings explained</h2>
            <dl className="guide-settings">
              {guide.settings.map((s) => (
                <div key={s.name}>
                  <dt>{s.name}</dt>
                  <dd>{s.text}</dd>
                </div>
              ))}
            </dl>
          </>
        )}

        <h2>Best for</h2>
        {paras(guide.bestFor)}

        {guide.faq.length > 0 && (
          <>
            <h2 id="faq">FAQ</h2>
            <div className="guide-faq">
              {guide.faq.map((f) => (
                <div key={f.q}>
                  <h3>{f.q}</h3>
                  <p>{f.a}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
