import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * RouteFocusManager
 *
 * On every route change:
 *  - scrolls to top (unless the browser is restoring a hash target)
 *  - moves keyboard focus to the page's <main> landmark (or a fallback
 *    off-screen announcer) so screen readers start reading the new page
 *  - announces the new page title in a polite live region
 *
 * It intentionally does nothing while a modal dialog / popover is open so it
 * never steals focus from Radix's own focus trap.
 */
export function RouteFocusManager() {
  const location = useLocation();
  const announcerRef = useRef<HTMLDivElement | null>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    // Never fight a Radix focus trap (dialog, alert dialog, sheet, drawer).
    const modalOpen = document.querySelector(
      '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]'
    );
    if (modalOpen) return;

    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    // Hash links keep their native behaviour.
    if (location.hash) return;

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    const raf = window.requestAnimationFrame(() => {
      const target =
        (document.getElementById("main-content") as HTMLElement | null) ??
        (document.querySelector("main") as HTMLElement | null) ??
        announcerRef.current;

      if (target) {
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }

      if (announcerRef.current) {
        const heading = document.querySelector("h1");
        const label = heading?.textContent?.trim() || document.title;
        announcerRef.current.textContent = `${label} — page loaded`;
      }
    });

    return () => window.cancelAnimationFrame(raf);
  }, [location.pathname, location.search, location.hash]);

  return (
    <div
      ref={announcerRef}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      tabIndex={-1}
    />
  );
}

export default RouteFocusManager;
