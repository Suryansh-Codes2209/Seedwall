import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { GitHubForm } from "@/components/GitHubForm";
import { PersonalView } from "@/components/PersonalView";
import { ReportLink } from "@/components/ReportLink";
import { pageMetadata } from "@/config/seo";
import { GitHubError, getGitHubProfile, isValidLogin } from "@/lib/server/github";
import type { PersonalData } from "@/lib/personal";

export const revalidate = 21600;

/** One GitHub lookup per request, shared by the metadata and the page. */
const loadProfile = cache(getGitHubProfile);

type Props = { params: Promise<{ user: string }>; searchParams: Promise<{ look?: string; theme?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const login = (await params).user;
  if (!isValidLogin(login)) return { title: "GitHub wallpaper", robots: { index: false } };
  // A profile that can't be loaded right now (rate limit, GitHub down) gets a retry page: keep it out of the index.
  let problem: GitHubError["code"] | null = null;
  try {
    await loadProfile(login);
  } catch (e) {
    if (!(e instanceof GitHubError)) throw e;
    problem = e.code;
  }
  if (problem === "not-found") return { title: "GitHub wallpaper", robots: { index: false } };
  const meta = pageMetadata({
    title: `@${login}'s GitHub wallpaper`,
    description: `A wallpaper made from @${login}'s real GitHub contribution graph and commit history. Make your own from your username on Seedwall.`,
    path: `/u/${login}`,
    image: `/api/u/${login}?w=1200&h=630`,
    imageAlt: `@${login}'s contribution graph as a wallpaper`,
  });
  return problem ? { ...meta, robots: { index: false, follow: false } } : meta;
}

export default async function UserPage({ params, searchParams }: Props) {
  const login = (await params).user;
  const { look, theme } = await searchParams;
  if (!isValidLogin(login)) notFound();
  let data: PersonalData | null = null;
  let problem: GitHubError["code"] = "not-found";
  try {
    const p = await loadProfile(login);
    data = { login: p.login, total: p.total, start: p.start, levels: p.levels, longestStreak: p.longestStreak, currentStreak: p.currentStreak, commits: p.commits, repos: p.repos };
  } catch (e) {
    if (!(e instanceof GitHubError)) throw e;
    problem = e.code;
  }

  // No such user: a real 404 (the friendly copy is in ./not-found.tsx).
  if (!data && problem === "not-found") notFound();

  if (!data)
    return (
      <div className="container section narrow">
        <span className="eyebrow">GitHub wallpaper</span>
        <h1 className="page-h1">GitHub is busy right now.</h1>
        <p className="lead">Seedwall hit GitHub&apos;s rate limit, or GitHub didn&apos;t answer. Give it a few minutes, then reload.</p>
        <GitHubForm initial={login} cta="Retry" />
        <p className="hero-actions">
          <Link className="btn" href="/today">Or see today&apos;s seed</Link>
          <ReportLink className="btn" error={`GitHub ${problem} for @${login}`}>Still broken? Tell Suryansh</ReportLink>
        </p>
      </div>
    );

  return <PersonalView data={data} initialLook={look} initialTheme={theme} />;
}
