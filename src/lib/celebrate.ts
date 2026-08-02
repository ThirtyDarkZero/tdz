import confetti from "canvas-confetti";

const COLORS = ["#FF6347", "#FFD166", "#FFFFFF", "#FF8C69", "#8BE9FD"];

function reduced() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** Quick pop from a specific element (stage completions, small wins). */
export function burstFrom(el?: HTMLElement | null) {
  if (reduced()) return;
  let origin = { x: 0.5, y: 0.4 };
  if (el) {
    const r = el.getBoundingClientRect();
    origin = {
      x: (r.left + r.width / 2) / window.innerWidth,
      y: (r.top + r.height / 2) / window.innerHeight,
    };
  }
  confetti({
    particleCount: 45,
    spread: 60,
    startVelocity: 28,
    scalar: 0.8,
    ticks: 120,
    colors: COLORS,
    origin,
    disableForReducedMotion: true,
  });
}

/** Full-screen celebration for the victory screen. */
export function celebrate(durationMs = 2200) {
  if (reduced()) return;
  const end = Date.now() + durationMs;
  confetti({
    particleCount: 140,
    spread: 100,
    startVelocity: 45,
    origin: { y: 0.5 },
    colors: COLORS,
    disableForReducedMotion: true,
  });
  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: COLORS,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: COLORS,
      disableForReducedMotion: true,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

/** Short shower used when an export/download succeeds. */
export function exportShower() {
  if (reduced()) return;
  confetti({
    particleCount: 70,
    spread: 75,
    startVelocity: 32,
    scalar: 0.9,
    origin: { y: 0.35 },
    colors: COLORS,
    disableForReducedMotion: true,
  });
}
