import type { Metadata } from "next";
import { Suspense } from "react";
import { AppIntro, StageSkeleton } from "@/components/AppIntro";
import { Studio } from "@/components/Studio";
import { pageMetadata } from "@/config/seo";
import { GENERATORS } from "@/generators";
import { THEMES } from "@/generators/shared/themes";

export const metadata: Metadata = pageMetadata({
  title: "Wallpaper Studio: design your own wallpaper",
  description:
    "Pick a generator, change colours, apply an editor theme, write your own quote or go text-free, then download a full-size PNG or SVG for MacBook, iPhone, Android, iPad, 4K or a custom size.",
  path: "/studio",
});

export default function StudioPage() {
  return (
    <>
      <AppIntro title="Wallpaper studio">
        Pick one of {GENERATORS.length} generators and a preset, change the colours or apply one of {THEMES.length} editor
        themes, write your own quote or go text-free, then download a full-size PNG or SVG for MacBook, iPhone, Android, iPad,
        4K or a custom size. Everything is drawn in your browser.
      </AppIntro>
      <Suspense fallback={<StageSkeleton label="Loading the studio" />}>
        <Studio />
      </Suspense>
    </>
  );
}
