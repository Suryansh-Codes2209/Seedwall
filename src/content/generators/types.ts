/** Long-form, human-written guide shown on /generators/[id] under the live preview. */
export interface GeneratorGuide {
  /** What the look is and where the idea comes from. 1-2 paragraphs. */
  intro: string[];
  /** How the algorithm builds the image, in plain words. 2-3 paragraphs. */
  howItWorks: string[];
  /** One entry per notable parameter: what it changes and when to move it. */
  settings: { name: string; text: string }[];
  /** Which screens, presets and setups it suits (desktop, phone, OLED, dark mode). 1-2 paragraphs. */
  bestFor: string[];
  /** 3-4 real questions a visitor would ask. */
  faq: { q: string; a: string }[];
}
