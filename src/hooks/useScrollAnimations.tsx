import { useEffect, useRef, useState, useCallback, useMemo } from "react";

/**
 * Ultra-dramatic scroll-driven animations (Snapped-portfolio inspired)
 * - Scale-pop: sections scale from 0.7 → 1.0 with 3D rotation
 * - Emerge: elements slide & fade in with stagger
 * - Parallax depth: layers move at different scroll rates
 * - Screen-pop: inner content scales out of a container with blur
 * - Depth-zoom: fly-toward-viewer effect with blur transition
 */

// ─── Scale Pop: Section scales up dramatically as it scrolls into view ───
export function useScalePop(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const raw = 1 - Math.max(0, Math.min(1, (rect.top - vh * 0.15) / (vh * 0.65)));
      setProgress(raw);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const style: React.CSSProperties = useMemo(() => ({
    transform: `scale(${0.7 + progress * 0.3}) perspective(1200px) rotateX(${(1 - progress) * 8}deg)`,
    opacity: Math.min(1, progress * 1.6),
    filter: `blur(${(1 - progress) * 6}px)`,
    transition: "transform 0.08s linear, opacity 0.08s linear, filter 0.08s linear",
    willChange: "transform, opacity, filter",
  }), [progress]);

  return { ref, style, progress };
}

// ─── Screen Pop: Content appears to emerge from within a container ───
export function useScreenPop() {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const raw = 1 - Math.max(0, Math.min(1, (rect.top - vh * 0.25) / (vh * 0.5)));
      setProgress(raw);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const containerStyle: React.CSSProperties = useMemo(() => ({
    borderRadius: `${40 - progress * 28}px`,
    overflow: "hidden",
    transition: "border-radius 0.08s linear",
  }), [progress]);

  const innerStyle: React.CSSProperties = useMemo(() => ({
    transform: `scale(${0.85 + progress * 0.15}) perspective(1000px) rotateX(${(1 - progress) * 5}deg)`,
    opacity: 0.4 + progress * 0.6,
    filter: `blur(${(1 - progress) * 4}px)`,
    transition: "transform 0.08s linear, opacity 0.08s linear, filter 0.08s linear",
    willChange: "transform, opacity, filter",
  }), [progress]);

  return { ref, containerStyle, innerStyle, progress };
}

// ─── Depth Zoom: fly-toward-viewer with dramatic blur ───
export function useDepthZoom(intensity = 1) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const raw = 1 - Math.max(0, Math.min(1, (rect.top - vh * 0.1) / (vh * 0.7)));
      setProgress(raw);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [intensity]);

  const style: React.CSSProperties = useMemo(() => ({
    transform: `scale(${0.6 + progress * 0.4}) perspective(800px) translateZ(${progress * 60 * intensity}px) rotateY(${(1 - progress) * 6 * intensity}deg)`,
    opacity: Math.min(1, progress * 2),
    filter: `blur(${(1 - progress) * 10 * intensity}px)`,
    transition: "transform 0.06s linear, opacity 0.06s linear, filter 0.06s linear",
    willChange: "transform, opacity, filter",
  }), [progress, intensity]);

  return { ref, style, progress };
}

// ─── Smooth Emerge: fade + slide with configurable direction ───
export function useEmerge(direction: "up" | "down" | "left" | "right" = "up", distance = 80) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const transforms: Record<string, string> = {
    up: `translateY(${distance}px) scale(0.92)`,
    down: `translateY(-${distance}px) scale(0.92)`,
    left: `translateX(${distance}px) scale(0.92)`,
    right: `translateX(-${distance}px) scale(0.92)`,
  };

  const style: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translate(0, 0) scale(1)" : transforms[direction],
    filter: visible ? "blur(0px)" : "blur(6px)",
    transition: "opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1), transform 0.9s cubic-bezier(0.16, 1, 0.3, 1), filter 0.9s cubic-bezier(0.16, 1, 0.3, 1)",
  };

  return { ref, style, visible };
}

// ─── Stagger Emerge: children animate in sequence ───
export function useStaggerEmerge(count: number, staggerMs = 80) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.06 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const getItemStyle = useCallback(
    (index: number): React.CSSProperties => ({
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0) scale(1) rotateX(0deg)" : "translateY(60px) scale(0.88) rotateX(12deg)",
      filter: visible ? "blur(0px)" : "blur(4px)",
      transition: `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * staggerMs}ms, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * staggerMs}ms, filter 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * staggerMs}ms`,
    }),
    [visible, staggerMs]
  );

  return { containerRef, visible, getItemStyle };
}

// ─── Scroll Parallax Layer: moves at a fraction of scroll speed ───
export function useScrollParallax(speed = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const center = rect.top + rect.height / 2 - vh / 2;
      setOffset(center * speed);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [speed]);

  const style: React.CSSProperties = useMemo(() => ({
    transform: `translateY(${offset}px)`,
    willChange: "transform",
  }), [offset]);

  return { ref, style };
}

// ─── Horizontal Scroll Reveal: text/content slides in from the side ───
export function useHorizontalReveal(fromRight = false) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const raw = 1 - Math.max(0, Math.min(1, (rect.top - vh * 0.35) / (vh * 0.45)));
      setProgress(raw);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const x = fromRight ? (1 - progress) * 120 : (1 - progress) * -120;

  const style: React.CSSProperties = useMemo(() => ({
    transform: `translateX(${x}px) scale(${0.9 + progress * 0.1})`,
    opacity: Math.min(1, progress * 1.5),
    filter: `blur(${(1 - progress) * 5}px)`,
    transition: "transform 0.08s linear, opacity 0.08s linear, filter 0.08s linear",
    willChange: "transform, opacity, filter",
  }), [x, progress]);

  return { ref, style, progress };
}

// ─── ScrollReveal wrapper component ───
interface ScrollRevealProps {
  children: React.ReactNode;
  effect?: "scale-pop" | "emerge-up" | "emerge-left" | "emerge-right" | "screen-pop" | "depth-zoom";
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function ScrollReveal({ children, effect = "emerge-up", delay = 0, className = "", style: extraStyle }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const transforms: Record<string, { hidden: string; visible: string; hiddenFilter?: string }> = {
    "scale-pop": { hidden: "scale(0.7) rotateX(10deg)", visible: "scale(1) rotateX(0deg)", hiddenFilter: "blur(8px)" },
    "emerge-up": { hidden: "translateY(80px) scale(0.92)", visible: "translateY(0) scale(1)", hiddenFilter: "blur(5px)" },
    "emerge-left": { hidden: "translateX(-100px) scale(0.9) rotateY(8deg)", visible: "translateX(0) scale(1) rotateY(0deg)", hiddenFilter: "blur(6px)" },
    "emerge-right": { hidden: "translateX(100px) scale(0.9) rotateY(-8deg)", visible: "translateX(0) scale(1) rotateY(0deg)", hiddenFilter: "blur(6px)" },
    "screen-pop": { hidden: "scale(0.75) translateY(60px) rotateX(12deg)", visible: "scale(1) translateY(0) rotateX(0deg)", hiddenFilter: "blur(10px)" },
    "depth-zoom": { hidden: "scale(0.6) translateZ(-100px)", visible: "scale(1) translateZ(0px)", hiddenFilter: "blur(12px)" },
  };

  const t = transforms[effect] || transforms["emerge-up"];

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? t.visible : t.hidden,
        filter: visible ? "blur(0px)" : (t.hiddenFilter || "blur(0px)"),
        transition: `opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, filter 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
        perspective: "1200px",
        ...extraStyle,
      }}
    >
      {children}
    </div>
  );
}
