import { useEffect, useRef, useState } from "react";
import { agentFace } from "./agentFaces";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * An agent's face: a muted looping video portrait (a still when motion is
 * reduced or the clip is off screen). Falls back to the emoji avatar.
 */
export function AgentFace({ name, fallback, className = "", rounded = "rounded-full", still = false }: {
  name: string; fallback?: string; className?: string; rounded?: string; still?: boolean;
}) {
  const f = agentFace(name);
  const ref = useRef<HTMLVideoElement>(null);
  const [play, setPlay] = useState(false);

  // Only decode video while it's on screen.
  useEffect(() => {
    if (!f || still || reduced() || !ref.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(([e]) => setPlay(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, [f, still]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (play) el.play().catch(() => {}); else el.pause();
  }, [play]);

  if (!f) {
    return <div className={`${className} ${rounded} grid place-items-center bg-white/10`} aria-hidden="true">{fallback}</div>;
  }
  const style = { objectPosition: f.focus };
  return still || reduced() ? (
    <img src={f.poster} alt={name} className={`${className} ${rounded} object-cover`} style={style} />
  ) : (
    <video ref={ref} src={f.video} poster={f.poster} muted loop playsInline preload="none" aria-label={name}
      className={`${className} ${rounded} object-cover`} style={style} />
  );
}
