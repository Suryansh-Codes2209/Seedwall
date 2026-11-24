import type { Metadata } from "next";
import Link from "next/link";
import { AUTHOR, REPO_URL, pageMetadata } from "@/config/seo";

export const metadata: Metadata = pageMetadata({
  title: "Privacy policy",
  description:
    "What Seedwall collects and why: Google Analytics, Google AdSense, a few settings kept in your browser, and nothing else. Photos you paint never leave your device.",
  path: "/privacy",
});

const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noreferrer">{children}</a>
);

export default function PrivacyPage() {
  return (
    <div className="container section">
      <header className="longform">
        <span className="eyebrow">Policy</span>
        <h1 className="page-h1">Privacy policy</h1>
        <p className="lead">
          Seedwall has no accounts and no sign-up, and I don&apos;t run a database of visitors. This page explains exactly what
          the site, its image API and the Mac app do with data, and what the Google services on the site collect.
        </p>
        <p className="page-meta">Last updated: 24 November 2026</p>
      </header>

      <div className="prose longform">
        <h2>Who I am</h2>
        <p>
          Seedwall (seedwall.suryansh.work) is made and run by me, {AUTHOR.name}, on my own. When this policy says
          &quot;I&quot; or &quot;me&quot;, it means me. You can reach me at{" "}
          <a href={`mailto:${AUTHOR.email}`}>{AUTHOR.email}</a>. The site&apos;s code is open source at{" "}
          <A href={REPO_URL}>{REPO_URL.replace("https://", "")}</A>, so you can check everything below against it.
        </p>

        <h2>The short version</h2>
        <ul>
          <li>Google Analytics measures how the site is used. It sets cookies.</li>
          <li>Google AdSense may show ads in one labelled space at the bottom of the page. Google and its partners use cookies for that.</li>
          <li>Your light or dark theme choice and your saved collection are stored in your own browser, not on my server.</li>
          <li>Photos you use on <Link href="/paint">/paint</Link> or for &quot;colours from a photo&quot; in the studio are processed on your device and never uploaded.</li>
          <li>GitHub wallpapers read only public GitHub data, and I don&apos;t keep a list of the usernames people look up.</li>
        </ul>

        <h2>Analytics</h2>
        <p>
          The site loads Google Analytics through Google Tag Manager. Google Analytics uses first-party cookies to tell visits
          apart and records things like the pages you view, the page that sent you here, your browser and device type, and an
          approximate location that Google derives from your IP address.
        </p>
        <p>
          When you download a wallpaper, the site also sends a <code>wallpaper_download</code> event. It contains where the
          download happened (the studio, a seed page, the gallery or the paint page), whether it was a PNG or an SVG, the
          generator&apos;s name and the image size. It does not contain the image or any text you wrote.
        </p>
        <p>
          The studio keeps your settings in the page address, so a link reproduces the wallpaper exactly. That includes any
          text you type, encoded but not encrypted. Because Google Analytics records page addresses, those settings can end up
          in its reports. The same goes for the username in a <code>/u/&lt;username&gt;</code> address.
        </p>
        <p>
          I use these reports to see which pages and looks people use and where things break. Google processes the data under
          the <A href="https://policies.google.com/privacy">Google Privacy Policy</A>. You can stop Google Analytics on every
          site with Google&apos;s <A href="https://tools.google.com/dlpage/gaoptout">opt-out browser add-on</A>, or by blocking
          cookies or scripts from Google in your browser.
        </p>

        <h2>Advertising</h2>
        <p>
          Seedwall may show ads served by Google AdSense, in one space labelled &quot;Advertisement&quot; above the footer. I
          don&apos;t choose the individual ads, and I don&apos;t pass Google anything about you beyond what its own script
          collects.
        </p>
        <ul>
          <li>
            Third-party vendors, including Google, use cookies to serve ads based on a user&apos;s prior visits to this website
            or other websites.
          </li>
          <li>
            Google&apos;s use of advertising cookies enables it and its partners to serve ads to users based on their visit to
            this site and/or other sites on the Internet.
          </li>
          <li>
            You can opt out of personalised advertising by visiting{" "}
            <A href="https://www.google.com/settings/ads">Google Ads Settings</A>.
          </li>
          <li>
            You can opt out of some third-party vendors&apos; use of cookies for personalised advertising by visiting{" "}
            <A href="https://www.aboutads.info/choices/">www.aboutads.info/choices</A>.
          </li>
        </ul>
        <p>
          Google explains how it uses information from sites that use its services at{" "}
          <A href="https://policies.google.com/technologies/partner-sites">
            How Google uses information from sites or apps that use our services
          </A>
          .
        </p>

        <h2>What is stored in your browser</h2>
        <p>Seedwall&apos;s own code sets no cookies. It stores two things in your browser&apos;s local storage:</p>
        <ul>
          <li><code>ws.theme</code>: whether you picked the light or dark theme.</li>
          <li><code>ws.collection.v1</code>: wallpapers you save to your collection in the studio, as a title, the settings and the time you saved it.</li>
        </ul>
        <p>
          A small service worker also keeps an offline page and the two fonts it uses, so you see a friendly message instead of
          a browser error when you are offline. It does not cache anything else. None of this is sent to me. Clearing the
          site&apos;s data in your browser removes all of it.
        </p>

        <h2>Photos on /paint and in the studio</h2>
        <p>
          When you choose a photo on <Link href="/paint">/paint</Link>, or use &quot;colours from a photo&quot; in the studio,
          your browser decodes the file, draws a scaled-down copy on a canvas on your device, and the painting or palette is
          worked out by JavaScript running in that page. No request sends the photo anywhere: it is never uploaded to my server
          or to anyone else. The download is created on your device too. Closing or reloading the tab discards the photo. The
          only trace is the analytics download event described above, which records the size and format, not the image.
        </p>

        <h2>GitHub wallpapers</h2>
        <p>
          When you type a GitHub username, the site opens <code>/u/&lt;username&gt;</code>. The server then asks GitHub for that
          account&apos;s public data: its display name, its public contribution calendar, and recent commits from recently
          updated public repositories (repository names, short commit hashes, messages and dates). It never asks you to sign in
          and cannot see private data.
        </p>
        <p>
          The responses are cached by the hosting platform for up to six hours, and the finished images by its content
          network, so repeat visits are fast. There is no database: I don&apos;t keep a list of usernames or a history of who
          looked up whom. The page shows only what GitHub already shows publicly, and if that changes on GitHub, Seedwall
          follows once its cache expires, usually within a day.
        </p>

        <h2>The gallery</h2>
        <p>
          The Cutting Mat pack in the <Link href="/gallery">gallery</Link> is stored in a public Google Drive folder. Its
          thumbnails and downloads load directly from Google&apos;s servers, so Google receives your IP address and browser
          details when you view or download them, under its own privacy policy.
        </p>

        <h2>Bug reports and email</h2>
        <p>
          The &quot;Report a bug&quot; links open your own email app with a message already filled in. It includes the address
          of the page you were on, the error message if there was one, and your browser&apos;s user-agent string, so I can
          reproduce the problem. Nothing is sent until you press Send, and you can edit or delete any of it first. If you email
          me, I keep the conversation in my inbox so I can reply, and I&apos;ll delete it if you ask.
        </p>

        <h2>Hosting, the image API and the Claude connector</h2>
        <p>
          Seedwall is hosted on Vercel. Like any web host, it handles the standard information every request carries (your IP
          address, browser user-agent and the address requested) to deliver pages and keep short-term operational logs,
          under Vercel&apos;s own privacy policy. I look at those logs only to fix errors. The site&apos;s fonts are served from
          this domain, not from a font service.
        </p>
        <p>
          The <A href={`${REPO_URL}#seeds-github-wallpapers-and-the-image-api`}>image API</A> endpoints work the same way: a request carries only the settings in its
          address, and the images are cached publicly because the same address always gives the same image. The{" "}
          <Link href="/claude">Claude connector</Link> renders through this same API. As that page says, it stores nothing.
        </p>

        <h2>The Mac app</h2>
        <p>
          The <Link href="/mac">Seedwall Mac app</Link> has no account and no analytics. It stores its settings in your
          Mac&apos;s own preferences: the mode you chose, a pinned seed, a GitHub username if you enter one, the look and theme,
          and which seed it last applied and when. Once a day, and when your displays change, it asks seedwall.suryansh.work for
          the day&apos;s seed and downloads an image at each display&apos;s size. In GitHub mode, the username is part of that
          request&apos;s address. The images are saved in the app&apos;s folder in your Library&apos;s Application Support, and
          older ones are deleted automatically.
        </p>

        <h2>How long data is kept</h2>
        <ul>
          <li>Browser storage: until you clear it or remove items from your collection.</li>
          <li>Google Analytics: for the retention period set on the Seedwall property, which for detailed data is at most 14 months.</li>
          <li>Advertising cookies: as set by Google and its partners; you can clear them at any time in your browser.</li>
          <li>GitHub data: in the cache for up to about a day, then fetched again or dropped.</li>
          <li>Hosting logs: for Vercel&apos;s short operational retention period.</li>
          <li>Email: until the conversation is no longer needed, or sooner if you ask.</li>
        </ul>

        <h2>Your rights</h2>
        <p>
          Depending on where you live, laws such as the GDPR, the UK GDPR or the California Consumer Privacy Act give you rights
          to access, correct or delete personal data, and to object to or limit how it is used. Because Seedwall has no
          accounts, I can&apos;t link analytics or ad data to you by name. Most of it is held by Google, which you can manage
          through the opt-out links above and your Google account settings. For anything I hold, such as an email you sent,
          write to me and I&apos;ll deal with your request as the law that applies to you requires.
        </p>

        <h2>Children</h2>
        <p>
          Seedwall is a general-audience site and is not directed at children under 13. I don&apos;t knowingly collect personal
          information from children. If you think a child has sent me personal information, email me and I&apos;ll delete it.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          If what the site does with data changes, I&apos;ll update this page and the date at the top. The history of this file
          is also public in the repository.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about privacy go to {AUTHOR.name} at <a href={`mailto:${AUTHOR.email}`}>{AUTHOR.email}</a>. Other ways to
          reach me are on the <Link href="/contact">contact page</Link>.
        </p>
      </div>
    </div>
  );
}
