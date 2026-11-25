/** Site path of a preset's poster: 1920×1080, or 1179×2556 with `phone`. Written by `npm run live:posters`. */
export function posterPath(sceneId: string, presetId: string, phone = false): string {
  return `/live/${sceneId}/${presetId}${phone ? "-phone" : ""}.jpg`;
}
