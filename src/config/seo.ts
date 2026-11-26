import type { Metadata } from "next";
import { SITE } from "./site";

/** One source of truth for facts shared by metadata, JSON-LD and page copy. */
export const AUTHOR = {
  name: "Suryansh Chaudhary",
  url: "https://suryansh.work/",
  x: "https://x.com/suryanshbuilds",
  xHandle: "@suryanshbuilds",
  linkedin: "https://www.linkedin.com/in/suryansh-chaudhary-2209/",
  github: "https://github.com/Suryansh-Codes2209",
  email: "suryansh.codes2001@gmail.com",
} as const;

export const REPO_URL = "https://github.com/Suryansh-Codes2209/Seedwall";

export const absoluteUrl = (path: string): string => new URL(path, SITE.url).toString();

/** Longest meta description we emit. Search engines cut snippets at about 155 to 160 characters. */
export const DESCRIPTION_MAX = 155;

/** Shortens text to `max` characters on a word boundary, ending with "…" when it had to cut. */
export function clampDescription(text: string, max = DESCRIPTION_MAX): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const room = clean.slice(0, max - 1);
  const space = room.lastIndexOf(" ");
  const cut = (space > max / 2 ? room.slice(0, space) : room).replace(/[\s,;:.]+$/, "");
  return `${cut}…`;
}

/** Metadata for a page: title, description, canonical URL, Open Graph and Twitter card. */
export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  /** Open Graph type: "article" for guides, "website" otherwise. */
  type?: "website" | "article";
  /** For articles: YYYY-MM-DD. */
  publishedTime?: string;
  modifiedTime?: string;
}): Metadata {
  const image = opts.image ?? "/og/default.png";
  const images = [{ url: image, width: 1200, height: 630, alt: opts.imageAlt ?? opts.title }];
  const description = clampDescription(opts.description);
  const og =
    opts.type === "article"
      ? { type: "article" as const, publishedTime: opts.publishedTime, modifiedTime: opts.modifiedTime ?? opts.publishedTime, authors: [AUTHOR.url] }
      : { type: "website" as const };
  return {
    title: opts.title,
    description,
    alternates: { canonical: opts.path },
    openGraph: { title: opts.title, description, url: opts.path, images, ...og, siteName: SITE.name, locale: "en_US" },
    twitter: { card: "summary_large_image", title: opts.title, description, images: [image], creator: AUTHOR.xHandle, site: AUTHOR.xHandle },
  };
}
