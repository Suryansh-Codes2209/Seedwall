import type { Metadata } from "next";
import Link from "next/link";
import { CopyCode } from "@/components/CopyCode";
import { pageMetadata } from "@/config/seo";
import {
  ANDROID_URL,
  IOS_URL,
  IPAD_URL,
  LINUX_FEH,
  LINUX_GNOME,
  SCRIPT_PATH,
  WINDOWS_INSTALL,
  WINDOWS_REMOVE,
  WINDOWS_SCHEDULE,
  WINDOWS_SCRIPT,
  WINDOWS_STARTUP,
} from "./scripts";

export const metadata: Metadata = pageMetadata({
  title: "A new Seedwall wallpaper every day, on any device",
  description:
    "Set today's Seedwall wallpaper automatically on iPhone and iPad (Shortcuts), Android (Tasker or MacroDroid), Windows (a small PowerShell script and a scheduled task) and Linux (cron with GNOME or feh).",
  path: "/daily",
});

const DEVICES = [
  { href: "#iphone", label: "iPhone and iPad" },
  { href: "#android", label: "Android" },
  { href: "#windows", label: "Windows" },
  { href: "#linux", label: "Linux" },
] as const;

export default function DailyPage() {
  return (
    <div className="container section">
      <section className="gen-hero">
        <div>
          <span className="eyebrow">Daily wallpaper · every device</span>
          <h1>Today&apos;s wallpaper, on every screen you own.</h1>
          <p>
            Every day there is one Seedwall seed, the same for everyone. On a Mac, my menu-bar app sets it for you. Everywhere
            else, a small automation can fetch it from the image API at your screen&apos;s size and set it each morning. Pick
            your device and follow the steps.
          </p>
          <div className="hero-actions">
            {DEVICES.map((d) => (
              <a key={d.href} className="btn" href={d.href}>{d.label}</a>
            ))}
            <Link className="btn" href="/mac">Mac app</Link>
          </div>
          <p className="preview-dims" style={{ textAlign: "left", marginTop: 12 }}>Free · no account · no app to install on most devices</p>
        </div>
        <div className="card-media">
          {/* eslint-disable-next-line @next/next/no-img-element -- the API image is the point here, and it changes daily */}
          <img src="/api/daily?w=1600&h=1000" alt="Today's Seedwall wallpaper" width={1600} height={1000} />
        </div>
      </section>

      <div className="prose narrow">
        <p>
          The day changes at midnight UTC. That is 5:30 in the morning in India and the afternoon or evening before in the
          Americas, so any time in your morning picks up the right one. The Windows and Linux scripts send your local date
          instead, so they change at your own midnight.
        </p>

        <h2 id="iphone">iPhone and iPad: a Shortcuts automation</h2>
        <p>This uses Apple&apos;s Shortcuts app, which is already on your phone. It takes about two minutes.</p>
        <ol>
          <li>Open <strong>Shortcuts</strong>, go to the <strong>Automation</strong> tab and tap <strong>+</strong> (or <strong>New Automation</strong>).</li>
          <li>Choose <strong>Time of Day</strong>. Pick a time such as 7:00, set it to repeat <strong>Daily</strong>, and choose <strong>Run Immediately</strong> so it doesn&apos;t ask you first. (On older iOS versions, turn off <strong>Ask Before Running</strong> instead.) You can also turn off <strong>Notify When Run</strong>.</li>
          <li>Tap <strong>Next</strong>, then <strong>New Blank Automation</strong>.</li>
          <li>Add the <strong>Get Contents of URL</strong> action and paste this address:</li>
        </ol>
        <CopyCode code={IOS_URL} label="iPhone wallpaper URL" />
        <p>For an iPad, use this one instead:</p>
        <CopyCode code={IPAD_URL} label="iPad wallpaper URL" />
        <ol start={5}>
          <li>Add the <strong>Set Wallpaper Photo</strong> action (older iOS versions call it <strong>Set Wallpaper</strong>). It picks up the image from the step before. Choose the Lock Screen, the Home Screen or both.</li>
          <li>Tap the arrow on that action to see more options and turn off <strong>Show Preview</strong>, so it doesn&apos;t stop and wait for you. I also turn off <strong>Crop to Subject</strong>.</li>
          <li>Tap <strong>Done</strong>. To test it, open the automation and run it once.</li>
        </ol>
        <p>
          These names match iOS 17 and 18 as far as I can tell, but Apple renames menus now and then. If a label on your
          phone is slightly different, pick the closest match. Some people on iOS
          18 see Set Wallpaper fail every other run. That is a Shortcuts bug, and the next day&apos;s run usually works.
        </p>

        <h2 id="android">Android: Tasker or MacroDroid</h2>
        <p>
          Android has no built-in way to change the wallpaper on a schedule, so you need an automation app. The idea is the
          same in all of them: at a set time, download the image to a file, then set that file as the wallpaper. With{" "}
          <strong>Tasker</strong> (a one-time purchase):
        </p>
        <ol>
          <li>In <strong>Profiles</strong>, tap <strong>+</strong>, choose <strong>Time</strong> and pick a time in the morning.</li>
          <li>Create a new task. Add <strong>Net → HTTP Request</strong> with method <strong>GET</strong>, this URL, and a file to save the output to, such as <code>Download/seedwall.png</code>:</li>
        </ol>
        <CopyCode code={ANDROID_URL} label="Android wallpaper URL" />
        <ol start={3}>
          <li>Add <strong>Display → Set Wallpaper</strong>, point it at the same file, and choose the home screen, the lock screen or both.</li>
          <li>Run the task once with the play button to check it.</li>
        </ol>
        <p>
          <strong>MacroDroid</strong> is free and can do the same with a <strong>Day/Time</strong> trigger, an{" "}
          <strong>HTTP Request</strong> action that saves the response to a file, and a <strong>Set Wallpaper</strong> action
          that uses that file. I haven&apos;t checked its menus against the latest version, so the labels may differ a little.
          If your phone isn&apos;t 1440 × 3120, replace <code>d=android</code> with your screen size, for example{" "}
          <code>w=1080&amp;h=2400</code>.
        </p>

        <h2 id="windows">Windows: a PowerShell script and a scheduled task</h2>
        <p>
          A short script asks Windows for your screen size, downloads today&apos;s wallpaper at exactly that size, and sets it
          as your desktop background. It only uses parts that come with Windows 10 and 11. It&apos;s
          short, so read it before you run it.
        </p>
        <p>
          <strong>1. Download it and run it once.</strong> Open <strong>Command Prompt</strong> (not PowerShell, because the
          quoting differs) and paste:
        </p>
        <CopyCode code={WINDOWS_INSTALL} label="install commands" />
        <p><strong>2. Run it every day at 00:05.</strong></p>
        <CopyCode code={WINDOWS_SCHEDULE} label="scheduled task command" />
        <p>
          <strong>3. Also run it when you sign in</strong>, because Windows skips a scheduled run if the PC was off at that
          time. This adds a line to your Startup folder and doesn&apos;t need admin rights:
        </p>
        <CopyCode code={WINDOWS_STARTUP} label="sign-in command" />
        <p>
          Here is the whole script. You can also <a href={SCRIPT_PATH} download>download seedwall-daily.ps1</a>.
        </p>
        <CopyCode code={WINDOWS_SCRIPT} label="PowerShell script" />
        <p>To remove it all again:</p>
        <CopyCode code={WINDOWS_REMOVE} label="remove commands" />

        <h2 id="linux">Linux: one line of cron</h2>
        <p>
          Run <code>crontab -e</code> and add one of these lines. Change <code>w=2560&amp;h=1440</code> to your screen size
          (<code>xrandr | grep &apos;*&apos;</code> shows it). Cron needs each <code>%</code> written as <code>\%</code>, which
          is why the dates look like that.
        </p>
        <p><strong>GNOME</strong> (Ubuntu, Fedora and others):</p>
        <CopyCode code={LINUX_GNOME} label="GNOME cron line" />
        <p><strong>feh</strong> (i3, bspwm, Openbox and other X11 window managers):</p>
        <CopyCode code={LINUX_FEH} label="feh cron line" />
        <p>
          A new file name each day makes GNOME notice the change, and the old ones are cleaned up. If your computer is often
          off at 00:05, add the same line again with <code>@reboot sleep 60;</code> in place of <code>5 0 * * *</code>.
        </p>

        <h2 id="api">How it works</h2>
        <p>
          Everything above calls one address. The <Link href="/mac">Mac app</Link> uses it too, and you can use it from any
          script:
        </p>
        <ul>
          <li><code>/api/daily?d=iphone</code>: today&apos;s wallpaper for a device (<code>iphone</code>, <code>ipad</code>, <code>android</code>, <code>macbook14</code>, <code>4k</code> and more).</li>
          <li><code>/api/daily?w=1920&amp;h=1080</code>: any size, up to 6144 pixels on a side.</li>
          <li><code>&amp;date=2026-11-22</code>: a given day, so a script can change at local midnight.</li>
          <li><code>&amp;format=json</code>: the date, the seed and links, without the image.</li>
        </ul>
        <p>
          Want to see it first? <Link href="/today">Here is today&apos;s seed</Link>.
        </p>
      </div>
    </div>
  );
}
