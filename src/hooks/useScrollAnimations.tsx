import { useEffect, useRef, useState, useCallback, useMemo } from "react";

/**
 * Snapped-style scroll-driven animations
 * - Scale-pop: sections scale from 0.85 → 1.0 as they enter viewport
 * - Emerge: elements slide & fade in with stagger
 * - Parallax depth: layers move at different scroll rates
 * - Screen-pop: inner content scales out of a container (screen-in-screen)
 */

// ─── Scale Pop: Section scales up as it scrolls into view ───
export function useScalePop(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when bottom edge enters, 1 when element center reaches viewport center
      const raw = 1 - Math.max(0, Math.min(1, (rect.top - vh * 0.2) / (vh * 0.6)));
      setProgress(raw);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const style: React.CSSProperties = useMemo(() => ({
    transform: `scale(${0.85 + progress * 0.15})`,
    opacity: Math.min(1, progress * 1.5),
    transition: "transform 0.1s linear, opacity 0.1s linear",
    willChange: "transform, opacity",
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
      const raw = 1 - Math.max(0, Math.min(1, (rect.top - vh * 0.3) / (vh * 0.5)));
      setProgress(raw);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Container shrinks, inner content scales up — "screen popping out" effect
  const containerStyle: React.CSSProperties = useMemo(() => ({
    borderRadius: `${32 - progress * 20}px`,
    overflow: "hidden",
    transition: "border-radius 0.1s linear",
  }), [progress]);

  const innerStyle: React.CSSProperties = useMemo(() => ({
    transform: `scale(${0.92 + progress * 0.08})`,
    opacity: 0.6 + progress * 0.4,
    transition: "transform 0.1s linear, opacity 0.1s linear",
    willChange: "transform, opacity",
  }), [progress]);

  return { ref, containerStyle, innerStyle, progress };
}

// ─── Smooth Emerge: fade + slide with configurable direction ───
export function useEmerge(direction: "up" | "down" | "left" | "right" = "up", distance = 60) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const transforms: Record<string, string> = {
    up: `translateY(${distance}px)`,
    down: `translateY(-${distance}px)`,
    left: `translateX(${distance}px)`,
    right: `translateX(-${distance}px)`,
  };

  const style: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translate(0, 0)" : transforms[direction],
    transition: "opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
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
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const getItemStyle = useCallback(
    (index: number): React.CSSProperties => ({
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0) scale(1)" : "translateY(50px) scale(0.93)",
      transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${index * staggerMs}ms, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${index * staggerMs}ms`,
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
      const raw = 1 - Math.max(0, Math.min(1, (rect.top - vh * 0.4) / (vh * 0.4)));
      setProgress(raw);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const x = fromRight ? (1 - progress) * 80 : (1 - progress) * -80;

  const style: React.CSSProperties = useMemo(() => ({
    transform: `translateX(${x}px)`,
    opacity: Math.min(1, progress * 1.3),
    transition: "transform 0.1s linear, opacity 0.1s linear",
    willChange: "transform, opacity",
  }), [x, progress]);

  return { ref, style, progress };
}

// ─── ScrollReveal wrapper component ───
interface ScrollRevealProps {
  children: React.ReactNode;
  effect?: "scale-pop" | "emerge-up" | "emerge-left" | "emerge-right" | "screen-pop";
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
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const transforms: Record<string, { hidden: string; visible: string }> = {
    "scale-pop": { hidden: "scale(0.85)", visible: "scale(1)" },
    "emerge-up": { hidden: "translateY(60px)", visible: "translateY(0)" },
    "emerge-left": { hidden: "translateX(-60px)", visible: "translateX(0)" },
    "emerge-right": { hidden: "translateX(60px)", visible: "translateX(0)" },
    "screen-pop": { hidden: "scale(0.9) translateY(40px)", visible: "scale(1) translateY(0)" },
  };

  const t = transforms[effect] || transforms["emerge-up"];

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? t.visible : t.hidden,
        transition: `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
        ...extraStyle,
      }}
    >
      {children}
    </div>
  );
}
