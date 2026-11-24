import type { Metadata } from "next";
import Link from "next/link";
import { AUTHOR, REPO_URL, pageMetadata } from "@/config/seo";

export const metadata: Metadata = pageMetadata({
  title: "Terms of use",
  description:
    "The terms for using Seedwall: free downloads, what you can do with the wallpapers you make, the MIT-licensed code, the image API, ads, and the usual no-warranty notice.",
  path: "/terms",
});

const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noreferrer">{children}</a>
);

export default function TermsPage() {
  return (
    <div className="container section">
      <header className="longform">
        <span className="eyebrow">Policy</span>
        <h1 className="page-h1">Terms of use</h1>
        <p className="lead">
          Seedwall is a free tool made by one person. These terms are short and in plain English. By using the site, its image
          API or the Mac app, you agree to them.
        </p>
        <p className="page-meta">Last updated: 24 November 2026</p>
      </header>

      <div className="prose longform">
        <h2>Who runs Seedwall</h2>
        <p>
          Seedwall (seedwall.suryansh.work) is made and run by me, {AUTHOR.name}. You can reach me at{" "}
          <a href={`mailto:${AUTHOR.email}`}>{AUTHOR.email}</a>.
        </p>

        <h2>Using the site</h2>
        <p>
          The studio, the generators, seed pages, GitHub wallpapers, the gallery, the paint page and the Mac app are free, with
          no account. Please use them in good faith: don&apos;t try to break or overload the site, and don&apos;t use it to
          make anything unlawful.
        </p>

        <h2>Wallpapers you make and download</h2>
        <p>
          Every generated wallpaper is drawn by the site&apos;s open-source code from the settings and seed you choose. You can
          download it as a PNG or SVG and use it on any of your devices. You may also use the images you make in your own
          projects, including commercial ones, such as a website background, a slide, a social image or a README banner.
          Credit to Seedwall is welcome but not required. I don&apos;t claim ownership of the images you generate.
        </p>
        <p>
          The Cutting Mat pack in the <Link href="/gallery">gallery</Link> is also free to download and use as a wallpaper on
          your devices.
        </p>
        <p>A few limits apply:</p>
        <ul>
          <li>
            <strong>Your text is your responsibility.</strong> If you add a quote or other words to a wallpaper, make sure you
            have the right to use them.
          </li>
          <li>
            <strong>Names belong to their owners.</strong> Editor theme names such as Dracula, Nord, Tokyo Night, Gruvbox,
            Catppuccin, One Dark, Rosé Pine, Solarized and GitHub Light refer to their creators&apos; colour schemes. GitHub is
            a trademark of GitHub, Inc. Seedwall isn&apos;t affiliated with or endorsed by any of them.
          </li>
          <li>
            <strong>Don&apos;t imply endorsement.</strong> Please don&apos;t present your images, or a product built with them,
            as made or approved by me unless I&apos;ve agreed to it.
          </li>
        </ul>

        <h2>The source code and fonts</h2>
        <p>
          The Seedwall code is open source under the{" "}
          <A href={`${REPO_URL}/blob/main/LICENSE`}>MIT License</A>, copyright 2026 {AUTHOR.name}. You can use, copy, change and
          distribute it, including commercially, as long as you keep the copyright and licence notice. The fonts bundled in{" "}
          <code>public/fonts</code> are not covered by the MIT License. They are under the SIL Open Font License 1.1, as listed
          in the repository&apos;s <A href={`${REPO_URL}/blob/main/public/fonts/LICENSE.md`}>font licence file</A>, which
          allows using them in images like these wallpapers.
        </p>

        <h2>GitHub wallpapers</h2>
        <p>
          A <code>/u/&lt;username&gt;</code> wallpaper is drawn from that account&apos;s public GitHub activity. The data
          belongs to its owner and to GitHub. Making one of someone else&apos;s account is fine for fun, but please don&apos;t
          use one to impersonate or harass anyone.
        </p>

        <h2>The image API</h2>
        <p>
          The <A href={`${REPO_URL}#seeds-github-wallpapers-and-the-image-api`}>image API</A> is free and open to anyone,
          including the <Link href="/claude">Claude connector</Link> and your own scripts. Use it at a reasonable rate. Sizes
          are capped at 6144 pixels per side, and GitHub wallpapers depend on GitHub&apos;s own rate limits. I may block
          traffic that harms the service for others. There is no guaranteed uptime, and endpoints may change, though I try
          hard to keep seed links stable.
        </p>

        <h2>Ads and links to other sites</h2>
        <p>
          Seedwall may show ads served by Google AdSense, in one labelled space above the footer. I don&apos;t choose or
          endorse individual ads. The site also links to other sites, such as GitHub, Google Drive and my social profiles.
          I&apos;m not responsible for their content or their policies. How ads and analytics use data is covered in the{" "}
          <Link href="/privacy">privacy policy</Link>.
        </p>

        <h2>No warranty</h2>
        <p>
          Seedwall, the wallpapers, the image API and the Mac app are provided &quot;as is&quot;, without warranty of any kind,
          express or implied, including fitness for a particular purpose and non-infringement. I work to keep it running and
          correct, but I can&apos;t promise it will always be available, error-free or suit your purpose.
        </p>

        <h2>Limitation of liability</h2>
        <p>
          To the extent the law allows, I&apos;m not liable for any loss or damage that comes from using or being unable to use
          Seedwall or anything made with it. Nothing in these terms limits any rights you have that the law says can&apos;t be
          limited.
        </p>

        <h2>Changes</h2>
        <p>
          I may update these terms as the site changes. When I do, I&apos;ll change the date at the top of this page. Using the
          site after a change means you accept the updated terms.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about these terms, or about using Seedwall images in something specific, go to{" "}
          <a href={`mailto:${AUTHOR.email}`}>{AUTHOR.email}</a>. See the <Link href="/contact">contact page</Link> for other
          ways to reach me.
        </p>
      </div>
    </div>
  );
}
