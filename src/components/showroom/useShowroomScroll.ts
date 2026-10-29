import { useEffect, useState } from "react";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * One scroll listener for the whole page: reports when the header should turn
 * solid, and gives each [data-chapter] its --e (photo framing) and --t
 * (caption) progress between 0 and 1.
 */
export function useShowroomScroll(root: React.RefObject<HTMLElement>) {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const still = prefersReducedMotion();
    let frame = 0;
    const update = () => {
      frame = 0;
      setSolid(window.scrollY > window.innerHeight * 0.6);
      if (still) return;
      const vh = window.innerHeight;
      for (const c of el.querySelectorAll<HTMLElement>("[data-chapter]")) {
        const r = c.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) continue;
        const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - vh)));
        const e = 1 - Math.pow(1 - Math.min(1, p / 0.55), 3);
        c.style.setProperty("--e", e.toFixed(4));
        c.style.setProperty("--t", Math.min(1, Math.max(0, (p - 0.45) / 0.25)).toFixed(4));
      }
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [root]);
  return solid;
}
