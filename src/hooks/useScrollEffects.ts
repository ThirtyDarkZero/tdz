import { useState, useEffect, useRef, useCallback } from "react";

/**
 * useParallax — scrolls an element at a different speed
 */
export function useParallax(speed = 0.3) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const viewportCenter = window.innerHeight / 2;
      setOffset((centerY - viewportCenter) * speed);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);

  return { ref, style: { transform: `translateY(${offset}px)` } as React.CSSProperties };
}

/**
 * useCountUp — animates a number counting up when visible
 */
export function useCountUp(target: number, duration = 2000) {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && !started) setStarted(true); },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [started, target, duration]);

  return { ref, value };
}

/**
 * useStaggerReveal — returns refs and visibility for staggered animations
 */
export function useStaggerReveal(count: number, staggerDelay = 100) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const getItemStyle = useCallback(
    (index: number): React.CSSProperties => ({
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0) scale(1)" : "translateY(40px) scale(0.95)",
      transition: `opacity 0.6s ease ${index * staggerDelay}ms, transform 0.6s ease ${index * staggerDelay}ms`,
    }),
    [visible, staggerDelay]
  );

  return { containerRef, visible, getItemStyle };
}

/**
 * useWipeReveal — clip-path wipe animation
 */
export function useWipeReveal(direction: "left" | "right" | "up" | "down" = "up") {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setRevealed(true); },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const clipPaths = {
    up: { hidden: "inset(100% 0 0 0)", visible: "inset(0 0 0 0)" },
    down: { hidden: "inset(0 0 100% 0)", visible: "inset(0 0 0 0)" },
    left: { hidden: "inset(0 100% 0 0)", visible: "inset(0 0 0 0)" },
    right: { hidden: "inset(0 0 0 100%)", visible: "inset(0 0 0 0)" },
  };

  const style: React.CSSProperties = {
    clipPath: revealed ? clipPaths[direction].visible : clipPaths[direction].hidden,
    transition: "clip-path 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
  };

  return { ref, style, revealed };
}
