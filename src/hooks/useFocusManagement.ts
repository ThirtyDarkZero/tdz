import { useCallback, useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Focus an element, making it programmatically focusable if needed. */
export function focusElement(el: HTMLElement | null, opts?: FocusOptions) {
  if (!el) return false;
  if (!el.hasAttribute("tabindex") && !el.matches(FOCUSABLE)) {
    el.setAttribute("tabindex", "-1");
  }
  el.focus({ preventScroll: true, ...opts });
  return document.activeElement === el;
}

/** Focus the first focusable child of a container, else the container itself. */
export function focusFirstIn(container: HTMLElement | null) {
  if (!container) return false;
  const first = container.querySelector<HTMLElement>(FOCUSABLE);
  return focusElement(first ?? container);
}

/**
 * Moves focus into the active tabpanel whenever the active tab changes
 * (but not on first mount, so we don't hijack initial page focus).
 */
export function useTabPanelFocus(activeTab: string, panelId?: string) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const raf = requestAnimationFrame(() => {
      const panel = panelId
        ? document.getElementById(panelId)
        : (document.querySelector('[role="tabpanel"]:not([hidden])') as HTMLElement | null);
      focusElement(panel as HTMLElement | null);
    });
    return () => cancelAnimationFrame(raf);
  }, [activeTab, panelId]);
}

/**
 * Captures the currently focused element and returns a restore() callback.
 * Useful for custom overlays / toasts that are not Radix-managed.
 */
export function useFocusRestore() {
  const previous = useRef<HTMLElement | null>(null);

  const capture = useCallback(() => {
    previous.current = document.activeElement as HTMLElement | null;
  }, []);

  const restore = useCallback(() => {
    const el = previous.current;
    if (el && document.contains(el)) {
      el.focus({ preventScroll: true });
    } else {
      focusElement(document.getElementById("main-content"));
    }
  }, []);

  return { capture, restore };
}
