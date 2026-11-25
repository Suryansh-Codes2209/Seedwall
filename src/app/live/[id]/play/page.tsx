import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { LivePlay } from "@/components/LivePlay";
import { LIVE_SCENES, getLiveScene } from "@/live";

export const dynamicParams = false;

export function generateStaticParams() {
  return LIVE_SCENES.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const scene = getLiveScene((await params).id);
  if (!scene) return {};
  return { title: `${scene.name} player`, robots: { index: false, follow: false } };
}

/**
 * The chromeless player the Mac app loads behind the desktop icons. The root layout still renders
 * the header and footer; the full-viewport stage covers them.
 */
export default async function LivePlayPage({ params }: { params: Promise<{ id: string }> }) {
  const scene = getLiveScene((await params).id);
  if (!scene) notFound();
  return (
    <Suspense fallback={<div className="live-play" />}>
      <LivePlay sceneId={scene.id} />
    </Suspense>
  );
}
