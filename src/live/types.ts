import type { ParamSchema, Params, Preset } from "@/generators/types";

/**
 * A looping WebGL2 wallpaper. It reuses the generator param schema, so the same
 * ParamsPanel drives it, and carries a GLSL ES 3.00 fragment that defines `vec3 scene(...)`.
 * Time reaches the shader only through the loop phase (`uPhase`), so every loop is seamless.
 */
export interface LiveScene<P extends Params = Params> {
  id: string;
  name: string;
  description: string;
  params: ParamSchema<P>;
  presets: Preset<P>[];
  /** Length of one seamless loop, 8–60 seconds. */
  loopSeconds: number;
  /** Whether the scene reacts to the pointer. */
  mouse: boolean;
  fragment: string;
}

/** The type-erased form stored in the registry. */
export type AnyLiveScene = LiveScene<Params>;
