import type { Metadata } from "next";
import Link from "next/link";
import { GuideShell, guideMetadata } from "@/components/GuideShell";
import { DEVICES } from "@/config/devices";

const SLUG = "wallpaper-sizes-for-any-screen";

export const metadata: Metadata = guideMetadata(SLUG);

export default function Guide() {
  return (
    <GuideShell slug={SLUG}>
      <p>
        A wallpaper at the wrong size is easy to spot. It is soft where it should be sharp, the subject is cropped, or the clock
        lands on the most important part. Getting it right comes down to three questions: how many real pixels your screen
        has, what shape it is, and what the system will draw on top. This guide answers each one, then shows how to export the
        exact size from Seedwall.
      </p>

      <h2>Native resolution versus what you see</h2>
      <p>
        Every screen has a native resolution: the number of physical pixels across and down. That is the size you want. The
        confusing part is that modern systems scale the interface, so the number in your settings is often not the number of
        pixels.
      </p>
      <p>
        A 14-inch MacBook Pro, for example, has a panel of 3024 × 1964 pixels. By default, macOS draws the interface as if
        the screen were half that in each direction, so text is a comfortable size. System Settings describes this as the
        screen &quot;looking like&quot; a smaller resolution. A wallpaper made at the smaller, &quot;looks like&quot; size is
        stretched to twice its size and looks soft. Made at 3024 × 1964, it is drawn one image pixel per screen pixel.
      </p>
      <p>
        Windows shows the same idea in a different place. Under Settings, System, Display, the <em>Display resolution</em>{" "}
        marked &quot;Recommended&quot; is normally the native size, and <em>Scale</em> is the separate percentage that enlarges
        text and icons. Use the resolution, not the scale, when you pick a wallpaper size.
      </p>
      <p>
        If you are unsure, err larger. A system shrinking a large image looks clean. A system enlarging a small one always
        looks soft.
      </p>

      <h2>Shape matters more than size</h2>
      <p>
        The second thing is the aspect ratio, the width divided by the height. If the wallpaper&apos;s shape does not match
        the screen&apos;s, the system has two choices. It can fill the screen and crop whatever spills over, or fit the whole
        image and leave bars. Most systems fill by default, so a 16:9 image on a 16:10 laptop loses a strip on each side, and a
        desktop image on a phone loses most of its width.
      </p>
      <p>
        This is why a single image rarely works across a laptop, a phone and an ultrawide monitor. A 3440 × 1440 ultrawide is
        about 2.4 times as wide as it is tall. A recent phone in portrait is roughly 0.46. No crop of one makes a good version
        of the other.
      </p>
      <p>
        Seedwall avoids the problem by not cropping at all. Every generator lays its picture out for the exact size you ask
        for, using a unit of one hundredth of the shorter side. The same seed at a phone size and a desktop size gives two
        compositions of the same look, each made for its screen.
      </p>

      <h2>The sizes built into the studio</h2>
      <p>The device picker in the studio has these presets:</p>
      <ul>
        {DEVICES.map((d) => (
          <li key={d.id}>
            <strong>{d.label}</strong>: {d.w} × {d.h} ({d.kind})
          </li>
        ))}
      </ul>
      <p>
        If your screen is not on the list, choose a custom size and type in its width and height. The studio accepts anything
        from 200 to 8192 pixels per side. The image API used by the Mac app and the daily scripts caps each side at 6144
        pixels and scales larger requests down.
      </p>

      <h2>Phones: leave room for the clock</h2>
      <p>
        A phone lock screen puts a large clock and the date across the top, often with widgets below them. At the bottom
        there are usually the flashlight and camera buttons and the swipe bar. Anything important in those areas gets covered.
      </p>
      <p>
        In the <Link href="/studio">studio</Link>, picking a phone or tablet size shows a <strong>lock-screen safe area</strong>{" "}
        option, built in <code>src/generators/shared/safeArea.ts</code>. On a tall phone in portrait it keeps the top 30% of the
        height clear for the clock and date, and optionally the bottom 12% for the buttons. A portrait tablet uses 24% and
        8%, because its clock takes a smaller share of a taller screen. Looks that keep their shapes away from text also keep
        them out of these bands, so you get a calm space behind the clock rather than a line through it.
      </p>
      <p>
        Two phone settings can also change how the image sits. iOS can zoom the wallpaper slightly for its motion effect,
        which crops the edges; if a detail near the edge goes missing, turn the zoom or motion option off when you set the
        wallpaper. Some Android launchers scroll the wallpaper sideways as you swipe between home screens, which needs an
        image wider than the screen. Most current phones show a fixed image, which is what a Seedwall phone export is made for.
      </p>
      <p>
        The iPhone preset is 1290 × 2796. Recent iPhones are all close to that shape, so it scales cleanly onto other models.
        If you want an exact match, use a custom size with your model&apos;s numbers.
      </p>

      <h2>A matching set for all your screens</h2>
      <p>
        If you want the same look everywhere, the studio can export a matching set in one step: your desktop size plus the
        iPhone, Android and iPad sizes, all with the same generator, colours and seed, downloaded as one zip. The safe area is
        applied to the phones and tablet only, never to the desktop image.
      </p>

      <h2>Two or three monitors</h2>
      <p>
        Multiple monitors raise a new problem. You can put a separate wallpaper on each, or one picture across all of them. One
        picture only lines up if it accounts for the bezels and the gap between screens; otherwise a straight line jumps as it
        crosses from one monitor to the next.
      </p>
      <p>
        The studio&apos;s span option handles this. You list two or three monitors in order with their sizes, measure the gap
        between them in pixels, and choose whether they line up at the top, centre or bottom. Seedwall draws one large canvas
        that includes the gaps, then cuts out one image per monitor at that monitor&apos;s own size. The gap pixels are simply
        dropped, the same way the physical bezel hides them. For Windows, which can stretch one image across screens with its
        &quot;Span&quot; setting, you can also download the slices joined side by side as a single wide file.
      </p>

      <h2>PNG or SVG?</h2>
      <p>
        Every Seedwall wallpaper is drawn as SVG and can be downloaded as either. For setting a wallpaper, use the PNG. Desktop
        and phone systems expect a regular image file, and the PNG is rendered at exactly the size you picked. The SVG is
        useful when you want to keep editing it in a design tool, or need it at a size you have not decided yet, since it scales
        without losing sharpness.
      </p>

      <h2>Let it set itself</h2>
      <p>
        If you would rather not think about pixels at all, the <Link href="/mac">Mac app</Link> asks each display for its native
        resolution and fetches a wallpaper at that size, and it refetches when you plug in or rearrange displays. On other
        devices, the <Link href="/daily">daily setup guide</Link> shows how to pass your screen size to the image API from a
        Shortcut, Tasker, a PowerShell script or cron.
      </p>
      <p>
        To start, open the <Link href="/studio">studio</Link>, pick your device and try a look like{" "}
        <Link href="/generators/cutting-mat">Cutting Mat</Link> or <Link href="/generators/landscape">Landscape</Link> at
        both phone and desktop sizes to see how each composition adapts.
      </p>
    </GuideShell>
  );
}
