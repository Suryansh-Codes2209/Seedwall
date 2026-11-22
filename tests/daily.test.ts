import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getDevice } from "@/config/devices";
import { dailySeed } from "@/lib/seed";

const BASE = "https://seedwall.suryansh.work";

describe("/api/daily serves every size the /daily page documents", () => {
  const get = async (query: string) => {
    const { GET } = await import("@/app/api/daily/route");
    return GET(new Request(`${BASE}/api/daily?${query}`));
  };

  it.each(["iphone", "ipad", "android"])("?d=%s renders at that device's size", async (d) => {
    const dev = getDevice(d)!;
    const res = await get(`d=${d}&format=svg`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain(`viewBox="0 0 ${dev.w} ${dev.h}"`);
  });

  it("?w=&h= renders at a custom screen size", async () => {
    const res = await get("w=2560&h=1440&format=svg");
    expect(await res.text()).toContain('viewBox="0 0 2560 1440"');
  });

  it("&date= picks that day's seed, so scripts can rotate at local midnight", async () => {
    const res = await get("date=2026-11-22&d=android&format=json");
    const body = (await res.json()) as { seed: number; image: string };
    expect(body.seed).toBe(dailySeed("2026-11-22"));
    expect(body.image).toContain("w=1440&h=3120");
  });
});

describe("/daily setup page", () => {
  it("publishes the same Windows script it shows", async () => {
    const { WINDOWS_SCRIPT } = await import("@/app/daily/scripts");
    expect(readFileSync("public/daily/seedwall-daily.ps1", "utf8")).toBe(WINDOWS_SCRIPT);
  });

  it("uses the real API in every snippet", async () => {
    const s = await import("@/app/daily/scripts");
    expect(s.IOS_URL).toBe(`${BASE}/api/daily?d=iphone`);
    expect(s.WINDOWS_SCRIPT).toContain(`${BASE}/api/daily?w=$w&h=$h&date=$date`);
    expect(s.WINDOWS_SCRIPT).toContain("SystemParametersInfo");
    expect(s.WINDOWS_SCHEDULE).toMatch(/schtasks \/Create \/SC DAILY/);
    expect(s.LINUX_GNOME).toContain("gsettings set org.gnome.desktop.background picture-uri");
    expect(s.LINUX_FEH).toContain("feh --bg-fill");
    // cron treats a bare % as a newline, so every one must be escaped.
    for (const line of [s.LINUX_GNOME, s.LINUX_FEH]) expect(line.replaceAll("\\%", "")).not.toContain("%");
  });

  it("has no em or en dashes in its copy", () => {
    for (const f of ["src/app/daily/page.tsx", "src/app/daily/scripts.ts", "public/daily/seedwall-daily.ps1"])
      expect(readFileSync(f, "utf8"), f).not.toMatch(/[\u2013\u2014]/);
  });

  it("is in the sitemap and llms.txt", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    expect(sitemap().map((e) => e.url)).toContain(`${BASE}/daily`);
    const { GET } = await import("@/app/llms.txt/route");
    expect(await GET().text()).toContain(`${BASE}/daily`);
  });
});
