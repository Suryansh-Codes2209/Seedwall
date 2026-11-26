import type { Metadata } from "next";
import { GalleryGrid } from "@/components/GalleryGrid";
import { DrivePackButton } from "@/components/DrivePackButton";
import { GENERATORS } from "@/generators";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl, pageMetadata } from "@/config/seo";
import { SITE } from "@/config/site";
import { getGallery, getSampleItems } from "@/lib/galleryData";
import { sampleLabel } from "@/lib/generatorPage";

export const metadata: Metadata = pageMetadata({
  title: "Gallery: free desktop & phone wallpapers",
  description:
    "Free downloads: the Cutting Mat wallpaper pack for MacBook and iPhone, with and without text, plus samples from every Seedwall generator. Download directly or open any one in the studio to customise it.",
  path: "/gallery",
  image: "/og/gallery.png",
});

// Re-read the Drive folder at most once an hour.
export const revalidate = 3600;

export default async function GalleryPage() {
  const items = await getGallery();
  // The images hosted on this site, named like their alt text (the Drive pack's own names are "Frame 1" and so on).
  const local = getSampleItems().flatMap((i) => {
    const gen = GENERATORS.find((g) => g.id === i.generator);
    return gen ? [{ item: i, name: sampleLabel(gen, i).alt }] : [];
  });
  const structured = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: "Seedwall wallpaper gallery",
    url: absoluteUrl("/gallery"),
    author: { "@id": `${SITE.url}/#author` },
    numberOfItems: items.length,
    image: local.map(({ item: i, name }) => ({
      "@type": "ImageObject",
      name,
      creator: { "@id": `${SITE.url}/#author` },
      contentUrl: absoluteUrl(i.downloadUrl),
      thumbnailUrl: absoluteUrl(i.previewUrl),
      width: i.width,
      height: i.height,
      encodingFormat: "image/png",
      isAccessibleForFree: true,
    })),
  };
  return (
    <div className="container section">
      <JsonLd data={structured} />
      <div className="section-head">
        <div>
          <span className="eyebrow">Gallery</span>
          <h1 className="page-h1">Ready-made <em>wallpapers</em></h1>
          <p>The Cutting Mat pack from Google Drive plus samples from every generator. Click one to download it or open it in the studio.</p>
        </div>
        <DrivePackButton primary />
      </div>
      <GalleryGrid items={items} generators={GENERATORS.map((g) => ({ id: g.id, name: g.name }))} />
    </div>
  );
}
