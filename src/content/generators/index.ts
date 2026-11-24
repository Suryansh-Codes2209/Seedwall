import type { GeneratorGuide } from "./types";
import ascent from "./ascent";
import attractor from "./attractor";
import aurora from "./aurora";
import blueprint from "./blueprint";
import circuit from "./circuit";
import clockwork from "./clockwork";
import codeCity from "./code-city";
import contributions from "./contributions";
import cuttingMat from "./cutting-mat";
import cymatics from "./cymatics";
import dhruva from "./dhruva";
import eventHorizon from "./event-horizon";
import flowField from "./flow-field";
import frutigerAero from "./frutiger-aero";
import geometric from "./geometric";
import gitGraph from "./git-graph";
import halftone from "./halftone";
import impasto from "./impasto";
import jyotirlinga from "./jyotirlinga";
import kintsugi from "./kintsugi";
import landscape from "./landscape";
import marble from "./marble";
import meshGradient from "./mesh-gradient";
import minimalType from "./minimal-type";
import nebula from "./nebula";
import opArt from "./op-art";
import padmanabha from "./padmanabha";
import pixelDither from "./pixel-dither";
import quasicrystal from "./quasicrystal";
import seedHead from "./seed-head";
import spirograph from "./spirograph";
import sudarshan from "./sudarshan";
import terminal from "./terminal";
import topographic from "./topographic";
import trinetra from "./trinetra";
import truchet from "./truchet";
import waveLines from "./wave-lines";

export type { GeneratorGuide } from "./types";

/**
 * Long-form guides shown on /generators/[id], keyed by generator id.
 * Each guide lives in its own file (`./<id>.ts`, default export). To add one, import it
 * here and add it to this object, e.g. `import topographic from "./topographic";` and
 * `topographic,` (or `"flow-field": flowField,` for ids with a hyphen).
 * A generator without an entry simply shows no guide.
 */
const GUIDES: Record<string, GeneratorGuide> = {
  ascent,
  attractor,
  aurora,
  blueprint,
  circuit,
  clockwork,
  "code-city": codeCity,
  contributions,
  "cutting-mat": cuttingMat,
  cymatics,
  dhruva,
  "event-horizon": eventHorizon,
  "flow-field": flowField,
  "frutiger-aero": frutigerAero,
  geometric,
  "git-graph": gitGraph,
  halftone,
  impasto,
  jyotirlinga,
  kintsugi,
  landscape,
  marble,
  "mesh-gradient": meshGradient,
  "minimal-type": minimalType,
  nebula,
  "op-art": opArt,
  padmanabha,
  "pixel-dither": pixelDither,
  quasicrystal,
  "seed-head": seedHead,
  spirograph,
  sudarshan,
  terminal,
  topographic,
  trinetra,
  truchet,
  "wave-lines": waveLines,
};

export function getGuide(id: string): GeneratorGuide | undefined {
  return Object.hasOwn(GUIDES, id) ? GUIDES[id] : undefined;
}
