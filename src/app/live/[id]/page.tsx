import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { LivePlayerView } from "@/components/LivePlayerView";
import { pageMetadata } from "@/config/seo";
import { LIVE_SCENES, getLiveScene } from "@/live";

export const dynamicParams = false;

export function generateStaticParams() {
  return LIVE_SCENES.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const scene = getLiveScene((await params).id);
  if (!scene) return {};
  const image = `/live/${scene.id}/${scene.presets[0]?.id ?? ""}.jpg`;
  const alt = `${scene.name} live wallpaper made with Seedwall`;
  const meta = pageMetadata({
    title: `${scene.name}: live wallpaper`,
    description: `${scene.description} A seamless ${scene.loopSeconds}-second loop with ${scene.presets.length} presets. Change the colours and seed, then share the link.`,
    path: `/live/${scene.id}`,
    image,
    imageAlt: alt,
  });
  // Posters are 1920×1080, not the 1200×630 OG cards pageMetadata assumes.
  return { ...meta, openGraph: { ...meta.openGraph, images: [{ url: image, width: 1920, height: 1080, alt }] } };
}

export default async function LiveScenePage({ params }: { params: Promise<{ id: string }> }) {
  const scene = getLiveScene((await params).id);
  if (!scene) notFound();
  return (
    <Suspense fallback={<div className="container section"><p className="empty">Loading {scene.name}…</p></div>}>
      <LivePlayerView sceneId={scene.id} />
    </Suspense>
  );
}
