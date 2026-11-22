import { zipSync, type Zippable } from "fflate";

export interface ZipEntry {
  name: string;
  data: Uint8Array;
}

/** A zip of the given files. PNGs are already compressed, so they are stored as they are. */
export function buildZip(files: readonly ZipEntry[]): Uint8Array {
  const tree: Zippable = {};
  for (const f of files) tree[f.name] = [f.data, { level: 0 }];
  return zipSync(tree);
}
