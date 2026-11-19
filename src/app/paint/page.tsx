import type { Metadata } from "next";
import { PhotoPainter } from "@/components/PhotoPainter";
import { pageMetadata } from "@/config/seo";

export const metadata: Metadata = pageMetadata({
  title: "Paint my photo — palette-knife impasto wallpaper",
  description:
    "Turn any photo into a thick palette-knife oil painting, sized for your MacBook, iPhone, 4K screen or a custom size. It runs in your browser, so the photo is never uploaded.",
  path: "/paint",
});

export default function PaintPage() {
  return <PhotoPainter />;
}
