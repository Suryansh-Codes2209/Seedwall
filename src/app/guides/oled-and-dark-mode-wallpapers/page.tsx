import type { Metadata } from "next";
import Link from "next/link";
import { GuideShell, guideMetadata } from "@/components/GuideShell";

const SLUG = "oled-and-dark-mode-wallpapers";

export const metadata: Metadata = guideMetadata(SLUG);

export default function Guide() {
  return (
    <GuideShell slug={SLUG}>
      <p>
        A dark wallpaper seems like the easy choice for a phone in dark mode or a desktop you use late at night. In practice a
        few details decide whether it looks deep and calm or muddy and hard to read over: what kind of screen you have, how
        black the black really is, and what sits on top of the wallpaper. Here is what matters, and where the common advice about
        OLED screens is right or wrong.
      </p>

      <h2>OLED and LCD treat black differently</h2>
      <p>
        On an LCD, which most desktop monitors and many laptops still use, a backlight shines through the whole panel all the
        time. Black is made by blocking that light, and some always leaks through. A pure black wallpaper on an LCD looks dark
        grey in a dark room, and it uses the same power as any other colour, because the backlight stays on regardless.
      </p>
      <p>
        On an OLED, which most recent flagship phones and a growing number of laptops and monitors use, every pixel makes its
        own light. A pixel showing pure black, <code>#000000</code>, is switched off. That is why black on an OLED looks
        bottomless, and why the edges of a black wallpaper seem to melt into the bezel.
      </p>
      <p>
        That gives the first rule. If your screen is OLED and you want the deepest look, use real black, not a colour that only
        looks black. Many &quot;dark&quot; designs use a near black like <code>#0a0d1a</code>, a very dark navy. On an OLED
        those pixels stay lit at a low level, and in a dark room you can see it.
      </p>

      <h2>True black in Seedwall</h2>
      <p>
        Most Seedwall looks use a near black by default, because it reads better on LCD screens and gives soft glows something
        to blend into. Many of them have a <strong>True black (OLED)</strong> toggle in the studio. Turning it on sets the
        background to pure <code>#000000</code>. It also checks the other colours against black. Any ink that would be too
        dark to see is lightened until it reaches a set contrast: 4.5 to 1 for your text, which is the usual guideline for
        readable body text, and 3 to 1 for lines and shapes. Your colour choices survive, but nothing disappears into the
        background.
      </p>

      <h2>Does a black wallpaper save battery?</h2>
      <p>
        On an OLED, dark pixels use less power than bright ones, so a mostly black wallpaper costs less to show than a bright
        photo. The honest answer is that the saving is real but small in daily use. You only see the wallpaper on the lock
        screen and the home screen. Most of the time, an app covers it, and the app&apos;s own colours matter far more. Choose
        a black wallpaper because you like how it looks, and treat any battery gain as a bonus. On an LCD there is no saving at
        all.
      </p>

      <h2>Burn-in: what is true and what is not</h2>
      <p>
        Burn-in, more precisely called image retention or uneven wear, happens because OLED pixels age a little every time they
        are lit, and brighter pixels age faster. If the same bright shape sits in the same place for hundreds of hours, those
        pixels wear more than the ones around them. Eventually a faint ghost of the shape stays visible.
      </p>
      <p>
        A few things follow from that, and they cut against some popular advice:
      </p>
      <ul>
        <li>
          <strong>The wallpaper is rarely the culprit.</strong> The parts of a phone screen that wear first are the things that
          never move: the status bar, the navigation bar or gesture line, the keyboard, and app toolbars. They sit on top of
          the wallpaper, not in it.
        </li>
        <li>
          <strong>A dark wallpaper does not prevent burn-in.</strong> It slightly reduces wear on the home screen, but it does
          nothing for the bars and icons, which are drawn over it in the same place either way.
        </li>
        <li>
          <strong>Bright, static, high-contrast details are the risk</strong>, wherever they come from. A white logo on black
          that stays on screen for hours is worse than a busy, colourful image.
        </li>
        <li>
          <strong>Modern phones already protect themselves.</strong> They shift static elements by a pixel or two, dim the
          screen when idle, and limit the brightness of always-on displays.
        </li>
      </ul>
      <p>
        On an OLED desktop monitor or laptop, the wallpaper is visible for much longer, so it is worth more thought. Let the
        dock or taskbar hide itself, use a screen saver or let the display sleep, and avoid a wallpaper with one bright,
        sharp shape in a fixed spot. Changing the wallpaper now and then also spreads the wear. The{" "}
        <Link href="/mac">Seedwall Mac app</Link> and the <Link href="/daily">daily setup for other devices</Link> do that
        automatically, with a new seed each day.
      </p>

      <h2>A pure black catch on some phones</h2>
      <p>
        Some OLED panels take a moment to switch a pixel on from fully off. When you swipe between home screens, bright edges
        moving across pure black can leave a faint purple or grey trail for a fraction of a second, sometimes called black
        smear. Not every panel shows it. If yours does and it bothers you, turn True black off: the default near black keeps
        the pixels slightly lit and the smear goes away.
      </p>

      <h2>Keep icons, widgets and the clock readable</h2>
      <p>
        On a dark home screen, app labels and the clock are usually white. They need calm space behind them, and a dark
        wallpaper is not automatically calm. Thin bright lines, star fields and fine grids can cross every label and make the
        screen feel busy. A few habits help:
      </p>
      <ul>
        <li>Put the detail where the icons are not: the edges, one corner, or the lower third on a phone with few icons.</li>
        <li>Keep the overall brightness low and let one accent colour carry the image.</li>
        <li>Leave the top of a phone wallpaper quiet. That is where the lock screen puts the clock and date.</li>
      </ul>
      <p>
        Seedwall helps with the last one. When you pick a phone or tablet size in the <Link href="/studio">studio</Link>, a{" "}
        <strong>lock-screen safe area</strong> option appears. It keeps the top band clear for the clock and date, and can
        also clear a strip at the bottom for the flashlight and camera buttons. Looks that keep their shapes out of the
        text area keep them out of these zones too. If you add your own quote, the same clear zones keep lines from running
        through it.
      </p>

      <h2>Dark mode on a desktop</h2>
      <p>
        On a desktop, the wallpaper shows around your windows and behind translucent parts of the system. On a Mac, the menu
        bar and some sidebars pick up a tint from what is behind them, so a wallpaper with strong colour along the top edge can
        tint the menu bar. A darker, quieter top edge keeps it neutral. Desktop icons need the same calm space as phone icons;
        if you keep files on the desktop, choose a look with open areas.
      </p>
      <p>
        If you work in a code editor all day, matching the wallpaper to the editor theme makes the whole screen feel like one
        thing. Every Seedwall look can be recoloured with editor themes such as Dracula, Nord, Tokyo Night, Gruvbox and
        Catppuccin Mocha, from the theme chips in the studio.
      </p>

      <h2>Seedwall looks that suit a dark screen</h2>
      <ul>
        <li>
          <Link href="/generators/nebula">Nebula</Link>: glowing gas clouds and stars. The{" "}
          <Link href="/studio?g=nebula&p=oled-quote">Black + quote preset</Link> already has True black on.
        </li>
        <li>
          <Link href="/generators/dhruva">Dhruva</Link>: star trails wheeling around the pole star. The{" "}
          <Link href="/studio?g=dhruva&p=few">Few stars preset</Link> is pure black with sparse, dim trails.
        </li>
        <li>
          <Link href="/generators/event-horizon">Event Horizon</Link>: a black hole drawn in lines, mostly empty space.
        </li>
        <li>
          <Link href="/generators/attractor">Strange Attractor</Link> and <Link href="/generators/spirograph">Spirograph</Link>:
          one intricate shape of thin glowing lines, with lots of dark room around it.
        </li>
        <li>
          <Link href="/generators/minimal-type">Minimal Type</Link>: a flat dark colour and one line of text. The quietest choice
          for a busy home screen.
        </li>
        <li>
          <Link href="/generators/code-city">Code City</Link> and <Link href="/generators/terminal">Terminal</Link>: dark scenes
          built around editor colours, for a desktop that matches your editor.
        </li>
      </ul>
      <p>
        Whatever you pick, look at it on the real device before you settle. A preview in a browser window is never quite as
        dark, as bright, or as small as the screen in your hand.
      </p>
    </GuideShell>
  );
}
