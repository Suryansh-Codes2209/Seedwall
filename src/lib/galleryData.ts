import { SITE, driveFolderId } from "@/config/site";
import snapshot from "@/data/drive-snapshot.json";
import manifest from "../../public/gallery/manifest.json";
import { loadDriveItems } from "./drive";
import { validateManifest, type GalleryItem } from "./gallery";

// Validated at module load → a malformed manifest fails `next build`.
const SAMPLES = validateManifest(manifest, "public/gallery/manifest.json");
const SNAPSHOT = validateManifest(snapshot, "src/data/drive-snapshot.json");

/** How often the live Drive listing is re-read (seconds). */
export const DRIVE_REVALIDATE = 3600;

/**
 * Live Drive pack (refreshed hourly), keeping the real pixel sizes from the snapshot.
 * Falls back to the snapshot if Drive is unreachable.
 */
export async function getDriveItems(): Promise<GalleryItem[]> {
  const rootId = driveFolderId(SITE.driveUrl);
  if (!rootId) return [];
  try {
    const live = await loadDriveItems(rootId, { next: { revalidate: DRIVE_REVALIDATE } });
    if (!live.length) return SNAPSHOT;
    const known = new Map(SNAPSHOT.map((i) => [i.id, i]));
    return live.map((i) => {
      const k = known.get(i.id);
      return k ? { ...i, width: k.width, height: k.height } : i;
    });
  } catch {
    return SNAPSHOT;
  }
}

export const getSampleItems = (): GalleryItem[] => SAMPLES;

/** The locally hosted sample wallpapers of one generator (rendered by `npm run samples`). */
export const samplesFor = (generator: string): GalleryItem[] => SAMPLES.filter((i) => i.generator === generator);

/** A landscape sample of this generator's preset (or its first landscape sample), to show before the live render. */
export function posterFor(generator: string, presetId?: string): GalleryItem | undefined {
  const wide = samplesFor(generator).filter((i) => i.width > i.height);
  return wide.find((i) => i.presetId === presetId) ?? (presetId ? undefined : wide[0]);
}

export async function getGallery(): Promise<GalleryItem[]> {
  return [...(await getDriveItems()), ...getSampleItems()];
}
