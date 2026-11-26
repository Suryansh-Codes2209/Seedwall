import Link from "next/link";
import { GitHubForm } from "@/components/GitHubForm";

/** /u/<login> for a GitHub user that doesn't exist: a 404 with a way to try another name. */
export default function UserNotFound() {
  return (
    <div className="container section narrow">
      <span className="eyebrow">GitHub wallpaper</span>
      <h1 className="page-h1">No one by that name on GitHub.</h1>
      <p className="lead">Check the spelling and try again. Only public activity is used.</p>
      <GitHubForm initial="" cta="Try again" />
      <p className="hero-actions">
        <Link className="btn" href="/today">Or see today&apos;s seed</Link>
      </p>
    </div>
  );
}
