import type { Metadata } from "next";
import Link from "next/link";
import { ReportLink } from "@/components/ReportLink";
import { AUTHOR, REPO_URL, pageMetadata } from "@/config/seo";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description:
    "How to reach the maker of Seedwall: email, GitHub issues and social profiles. Bug reports, ideas for new generators and questions about using the wallpapers are all welcome.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="container section">
      <header className="longform">
        <span className="eyebrow">Contact</span>
        <h1 className="page-h1">Say <em>hello</em>.</h1>
        <p className="lead">
          Seedwall is made by one person, me, {AUTHOR.name}. Every message comes straight to me.
        </p>
      </header>

      <div className="prose longform">
        <h2>Ways to reach me</h2>
        <ul>
          <li>
            <strong>Email</strong>: <a href={`mailto:${AUTHOR.email}`}>{AUTHOR.email}</a>. Best for anything private, such as
            licensing questions or a problem you&apos;d rather not post in public.
          </li>
          <li>
            <strong>GitHub issues</strong>: <a href={`${REPO_URL}/issues`}>{REPO_URL.replace("https://", "")}/issues</a>. Best
            for bugs and feature requests, because other people can see and add to them.
          </li>
          <li>
            <strong>X</strong>: <a href={AUTHOR.x}>{AUTHOR.xHandle}</a>, and <strong>LinkedIn</strong>:{" "}
            <a href={AUTHOR.linkedin}>suryansh-chaudhary-2209</a>. Good for a quick question, or to show me the wallpaper you
            made.
          </li>
        </ul>

        <h2>What to write about</h2>
        <h3>Something broke</h3>
        <p>
          The quickest way is <ReportLink>this pre-filled bug report email</ReportLink>. It opens your email app with the page
          address and your browser details already in it, and you just add what you were doing. You can also{" "}
          <a href={`${REPO_URL}/issues/new?template=bug.yml`}>open a bug report on GitHub</a>. Either way, the most useful
          details are the link to the wallpaper (copy it from the studio&apos;s share button or the address bar), the device
          or size you picked, and what you expected to see.
        </p>

        <h3>An idea for a generator</h3>
        <p>
          New looks are the most useful thing people send me. If you have one in mind, a sketch, a photo or a link to a reference
          helps a lot. Use the <a href={`${REPO_URL}/issues/new?template=design-idea.yml`}>design idea form</a> on GitHub, or
          email me. If you would like to build it yourself, each generator is a single TypeScript file, and the{" "}
          <a href={`${REPO_URL}/blob/main/CONTRIBUTING.md`}>contributing guide</a> explains how.
        </p>

        <h3>Using the wallpapers or the code</h3>
        <p>
          The <Link href="/terms">terms of use</Link> cover what you can do with the images you make, and the code is under the
          MIT License. If your case isn&apos;t covered there, such as a product, print run or large project, email me with a
          short description and I&apos;ll tell you what I think.
        </p>

        <h3>Security problems</h3>
        <p>
          Please don&apos;t post security issues in public. Report them privately through{" "}
          <a href={`${REPO_URL}/security/advisories/new`}>GitHub&apos;s private vulnerability reporting</a>, or by email.
        </p>

        <h3>Privacy</h3>
        <p>
          For questions about data, including a request to delete an email you sent me, see the{" "}
          <Link href="/privacy">privacy policy</Link> or write to the address above.
        </p>

        <p>
          You can read more about the project on the <Link href="/about">about page</Link>, and see my other work at{" "}
          <a href={AUTHOR.url}>suryansh.work</a>.
        </p>
      </div>
    </div>
  );
}
