import { ViewTransition } from "react";

/**
 * Page enter/exit transitions. A template remounts on every top-level navigation, so its
 * <ViewTransition> runs the "page-exit" animation on the old page and "page-enter" on the
 * new one (both defined in globals.css). Browsers without the View Transitions API just
 * swap pages; reduced motion turns the animations off.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      {children}
    </ViewTransition>
  );
}
