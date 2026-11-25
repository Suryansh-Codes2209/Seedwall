import { readFileSync } from "node:fs";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { GeneratorGuide } from "@/content/generators/types";

const BASE = "https://seedwall.suryansh.work";

/** Visible text of a rendered page, tags stripped and entities decoded. */
const textOf = (html: string): string =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

const render = async (path: string): Promise<string> => {
  const mod = (await import(path)) as { default: ComponentType };
  return renderToStaticMarkup(createElement(mod.default));
};

const PAGES = ["privacy", "terms", "about", "contact", "guides"] as const;

describe("content pages", () => {
  it("are all in the sitemap, with every guide", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const { GUIDES } = await import("@/content/guides");
    const urls = sitemap().map((e) => e.url);
    for (const p of PAGES) expect(urls).toContain(`${BASE}/${p}`);
    expect(GUIDES.length).toBeGreaterThanOrEqual(2);
    for (const g of GUIDES) expect(urls).toContain(`${BASE}/guides/${g.slug}`);
  });

  it("are all listed in llms.txt", async () => {
    const { GET } = await import("@/app/llms.txt/route");
    const body = await GET().text();
    for (const p of PAGES) expect(body).toContain(`${BASE}/${p}`);
    const { GUIDES } = await import("@/content/guides");
    for (const g of GUIDES) expect(body).toContain(`${BASE}/guides/${g.slug}`);
  });

  it("are linked from the footer", () => {
    const footer = readFileSync("src/components/SiteFooter.tsx", "utf8");
    for (const p of PAGES) expect(footer).toContain(`href="/${p}"`);
  });

  it("have no em or en dashes in their copy", () => {
    const files = [
      "src/app/privacy/page.tsx",
      "src/app/terms/page.tsx",
      "src/app/about/page.tsx",
      "src/app/contact/page.tsx",
      "src/app/guides/page.tsx",
      "src/app/guides/how-generative-wallpapers-work/page.tsx",
      "src/app/guides/oled-and-dark-mode-wallpapers/page.tsx",
      "src/app/guides/wallpaper-sizes-for-any-screen/page.tsx",
      "src/content/guides/index.ts",
      "src/content/generators/index.ts",
      "src/components/GeneratorGuide.tsx",
    ];
    for (const f of files) expect(readFileSync(f, "utf8"), f).not.toMatch(/[\u2013\u2014]/);
  });
});

describe("/privacy", () => {
  it("carries the wording AdSense requires", async () => {
    const t = textOf(await render("@/app/privacy/page"));
    expect(t).toContain("Last updated: 24 November 2026");
    expect(t).toMatch(/third-party vendors, including Google, use cookies to serve ads based on .*prior visits to this website or other websites/i);
    expect(t).toMatch(/Google's use of advertising cookies enables it and its partners to serve ads/i);
    const html = await render("@/app/privacy/page");
    for (const url of ["https://www.google.com/settings/ads", "https://www.aboutads.info/choices/", "https://policies.google.com/technologies/partner-sites"])
      expect(html).toContain(`href="${url}"`);
    expect(html).toContain("mailto:suryansh.codes2001@gmail.com");
  });

  it("says /paint photos stay in the browser", async () => {
    const t = textOf(await render("@/app/privacy/page"));
    expect(t).toMatch(/never uploaded/i);
  });
});

describe("guides", () => {
  it("are each 900 to 1,400 words and link to the studio and a generator", async () => {
    const { GUIDES } = await import("@/content/guides");
    for (const g of GUIDES) {
      const html = await render(`@/app/guides/${g.slug}/page`);
      const words = textOf(html).split(" ").filter((w) => /[a-z0-9]/i.test(w)).length;
      expect(words, g.slug).toBeGreaterThanOrEqual(900);
      expect(words, g.slug).toBeLessThanOrEqual(1400);
      expect(html, g.slug).toContain('href="/studio');
      expect(html, g.slug).toMatch(/href="\/generators\/[a-z-]+"/);
    }
  });

  it("are all listed on /guides", async () => {
    const { GUIDES } = await import("@/content/guides");
    const html = await render("@/app/guides/page");
    for (const g of GUIDES) expect(html).toContain(`href="/guides/${g.slug}"`);
  });
});

describe("generator guides", () => {
  const sample: GeneratorGuide = {
    intro: ["Intro one."],
    howItWorks: ["How one.", "How two."],
    settings: [{ name: "Scale", text: "Zooms the field." }],
    bestFor: ["Dark desktops."],
    faq: [{ q: "Is it free?", a: "Yes." }],
  };

  it("getGuide returns undefined for a generator without one", async () => {
    const { getGuide } = await import("@/content/generators");
    expect(getGuide("no-such-generator")).toBeUndefined();
  });

  it("renders every section heading", async () => {
    const { GeneratorGuideSection } = await import("@/components/GeneratorGuide");
    const t = textOf(renderToStaticMarkup(createElement(GeneratorGuideSection, { name: "Topographic", guide: sample })));
    for (const h of ["About this look", "How it works", "Settings explained", "Best for", "FAQ"]) expect(t).toContain(h);
    expect(t).toContain("Zooms the field.");
    expect(t).toContain("Is it free?");
  });

  it("builds FAQPage structured data from the faq", async () => {
    const { faqPageSchema } = await import("@/components/GeneratorGuide");
    expect(faqPageSchema(sample, "https://x.test/g")).toEqual({
      "@type": "FAQPage",
      "@id": "https://x.test/g#faq",
      mainEntity: [{ "@type": "Question", name: "Is it free?", acceptedAnswer: { "@type": "Answer", text: "Yes." } }],
    });
    expect(faqPageSchema({ ...sample, faq: [] }, "https://x.test/g")).toBeUndefined();
  });
});

describe("generator guides registry", () => {
  it("has a guide for every generator", async () => {
    const { GENERATORS } = await import("@/generators");
    const { getGuide } = await import("@/content/generators");
    const missing = GENERATORS.filter((g) => !getGuide(g.id)).map((g) => g.id);
    expect(missing).toEqual([]);
  });
});
