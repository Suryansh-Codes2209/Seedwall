import { describe, expect, it, vi } from "vitest";

const profile = vi.fn();

vi.mock("@/lib/server/github", async (orig) => {
  const real = await orig<typeof import("@/lib/server/github")>();
  return { ...real, getGitHubProfile: (login: string) => profile(login) };
});

const props = (user: string) => ({ params: Promise.resolve({ user }), searchParams: Promise.resolve({}) });

/** notFound() throws an error whose digest marks a 404. */
const isNotFound = (e: unknown) => typeof (e as { digest?: unknown })?.digest === "string" && (e as { digest: string }).digest.includes("404");

describe("/u/[user]", () => {
  // Each test sets its own implementation; mockReset here made vitest report the mocked rejection as unhandled.

  it("is a real 404 when GitHub has no such user", async () => {
    const { GitHubError } = await import("@/lib/server/github");
    profile.mockImplementation(async () => { throw new GitHubError("not-found"); });
    const { default: UserPage } = await import("@/app/u/[user]/page");
    const err = await UserPage(props("zzqqxx-nonexistent-user-98765")).then(() => null, (e: unknown) => e);
    expect(isNotFound(err)).toBe(true);
  });

  it("is a 404 for a login GitHub would never accept", async () => {
    const { default: UserPage } = await import("@/app/u/[user]/page");
    const err = await UserPage(props("-bad--login-")).then(() => null, (e: unknown) => e);
    expect(isNotFound(err)).toBe(true);
  });

  it("keeps the retry page when GitHub is rate-limited, but tells crawlers not to index it", async () => {
    const { GitHubError } = await import("@/lib/server/github");
    profile.mockImplementation(async () => { throw new GitHubError("rate-limited"); });
    const { default: UserPage, generateMetadata } = await import("@/app/u/[user]/page");
    await expect(UserPage(props("octocat"))).resolves.toBeTruthy();
    const meta = await generateMetadata(props("octocat"));
    expect(meta.robots).toMatchObject({ index: false });
  });

  it("leaves a real profile indexable as before", async () => {
    profile.mockResolvedValue({ login: "octocat", name: null, total: 1, start: "2025-11-23", levels: "0", longestStreak: 1, currentStreak: 0, commits: [], repos: [] });
    const { generateMetadata } = await import("@/app/u/[user]/page");
    const meta = await generateMetadata(props("octocat"));
    expect(meta.robots).toBeUndefined();
    expect(meta.title).toBe("@octocat's GitHub wallpaper");
  });
});
