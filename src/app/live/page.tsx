import type { Metadata } from "next";
import { LiveGrid } from "@/components/LiveGrid";
import { pageMetadata } from "@/config/seo";
import { LIVE_SCENES } from "@/live";

const first = LIVE_SCENES[0];
const image = first ? `/live/${first.id}/${first.presets[0]?.id ?? ""}.jpg` : "/og/default.png";
const meta = pageMetadata({
  title: "Live wallpapers: moving 3D desktop backgrounds",
  description:
    "Free live wallpapers that loop seamlessly: 3D scenes rendered in your browser. Pick a preset, change the colours and seed, then download a still or a video loop.",
  path: "/live",
  image,
  imageAlt: "Seedwall live wallpapers",
});

// Posters are 1920×1080, not the 1200×630 OG cards pageMetadata assumes.
export const metadata: Metadata = first
  ? { ...meta, openGraph: { ...meta.openGraph, images: [{ url: image, width: 1920, height: 1080, alt: "Seedwall live wallpapers" }] } }
  : meta;

export default function LivePage() {
  return (
    <div className="container section">
      <div className="section-head">
        <div>
          <span className="eyebrow">Live</span>
          <h1 className="page-h1">Live <em>wallpapers</em></h1>
          <p>Moving 3D scenes that loop without a seam. Hover over one to play it, or on a touch screen scroll it to the middle of the screen. Open one to change the colours and download a still or a loop.</p>
        </div>
      </div>
      <LiveGrid />
    </div>
  );
}
