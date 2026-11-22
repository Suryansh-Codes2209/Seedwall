"use client";

/** Last resort when the root layout itself fails: plain HTML, no site chrome. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const mail = `mailto:suryansh.codes2001@gmail.com?subject=${encodeURIComponent("Seedwall: the site failed to load")}&body=${encodeURIComponent(
    `Page: ${typeof window !== "undefined" ? window.location.href : ""}\nError: ${error.message}\nDigest: ${error.digest ?? ""}`,
  )}`;
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "64px 20px", maxWidth: 640, margin: "0 auto", lineHeight: 1.55, background: "#0a0d1a", color: "#eef1fa", colorScheme: "dark" }}>
        <h1 style={{ letterSpacing: "-0.03em" }}>Seedwall hit a problem.</h1>
        <p style={{ color: "#9aa4c2" }}>The page couldn&apos;t load. Try again; if it keeps happening, please let Suryansh know.</p>
        <p>
          <button type="button" onClick={reset} style={{ height: 44, padding: "0 18px", marginRight: 12, border: 0, borderRadius: 12, background: "#2a63f6", color: "#fff", font: "600 15px system-ui, sans-serif", cursor: "pointer" }}>Try again</button>
          <a href={mail} style={{ color: "#ffa46b" }}>Email the details</a>
        </p>
      </body>
    </html>
  );
}
