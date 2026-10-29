import { useEffect, useRef } from "react";

/**
 * A fixed, non-interactive liquid-glass sheen that floats over the page and
 * softly follows the pointer / scroll. Disabled for reduced-motion users.
 */
export function LiquidGlassLayer() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let x = 50, y = 30, tx = 50, ty = 30, raf = 0;
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth) * 100;
      ty = (e.clientY / window.innerHeight) * 100;
    };
    const onScroll = () => { ty = 20 + ((window.scrollY / 6) % 60); };
    const tick = () => {
      x += (tx - x) * 0.06;
      y += (ty - y) * 0.06;
      el.style.setProperty("--lg-x", `${x}%`);
      el.style.setProperty("--lg-y", `${y}%`);
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60]"
      style={{
        background:
          "radial-gradient(420px 320px at var(--lg-x,50%) var(--lg-y,30%), hsl(0 0% 100% / 0.07), transparent 70%)," +
          "radial-gradient(900px 500px at calc(100% - var(--lg-x,50%)) calc(100% - var(--lg-y,30%)), hsl(9 100% 64% / 0.05), transparent 70%)",
        mixBlendMode: "screen",
      }}
    />
  );
}
