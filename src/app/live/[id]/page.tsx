import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AppIntro, StageSkeleton } from "@/components/AppIntro";
import { LivePlayerView } from "@/components/LivePlayerView";
import { pageMetadata } from "@/config/seo";
import { LIVE_SCENES, getLiveScene } from "@/live";
import { posterPath } from "@/live/poster";

export const dynamicParams = false;

export function generateStaticParams() {
  return LIVE_SCENES.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const scene = getLiveScene((await params).id);
  if (!scene) return {};
  const image = posterPath(scene.id, scene.presets[0]?.id ?? "");
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
  const first = scene.presets[0];
  const names = scene.presets.map((p) => p.title).join(", ");
  return (
    <>
      <AppIntro
        title={`${scene.name} live wallpaper`}
        poster={first && { src: posterPath(scene.id, first.id), width: 1920, height: 1080, alt: `${scene.name} live wallpaper, ${first.title} preset` }}
      >
        {scene.description} A seamless {scene.loopSeconds}-second loop with {scene.presets.length} presets: {names}. Change the
        colours and seed, then download a still or a video loop.
      </AppIntro>
      <Suspense fallback={<StageSkeleton label={`Loading ${scene.name}`} />}>
        <LivePlayerView sceneId={scene.id} />
      </Suspense>
    </>
  );
}
