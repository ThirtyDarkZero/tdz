import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface AnimatedHeadingProps {
  text: string;
  className?: string;
  variant?: "large" | "medium" | "small";
  gradient?: string;
  animateOnView?: boolean;
  animateOnHover?: boolean;
  staggerDelay?: number;
}

/**
 * Reusable animated heading with smooth letter-by-letter reveal
 * Uses spring physics for buttery smooth animations
 */
export function AnimatedHeading({
  text,
  className,
  variant = "large",
  gradient = "from-primary via-accent to-primary",
  animateOnView = true,
  animateOnHover = false,
  staggerDelay = 0.03,
}: AnimatedHeadingProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLHeadingElement>(null);
  const letters = text.split("");

  // Intersection observer for animate on view
  useEffect(() => {
    if (!animateOnView || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -50px 0px" }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [animateOnView]);

  const shouldAnimate = animateOnView ? isVisible : animateOnHover ? isHovered : true;

  const sizeClasses = {
    large: "text-4xl sm:text-5xl md:text-6xl lg:text-7xl",
    medium: "text-2xl sm:text-3xl md:text-4xl",
    small: "text-xl sm:text-2xl md:text-3xl",
  };

  return (
    <h2
      ref={containerRef}
      className={cn(
        "font-display font-bold leading-tight",
        sizeClasses[variant],
        className
      )}
      onMouseEnter={() => animateOnHover && setIsHovered(true)}
      onMouseLeave={() => animateOnHover && setIsHovered(false)}
    >
      {letters.map((letter, idx) => (
        <span
          key={idx}
          className={cn(
            "inline-block transition-all duration-500 ease-out",
            `bg-gradient-to-r ${gradient} bg-clip-text`,
            letter === " " ? "w-[0.25em]" : ""
          )}
          style={{
            transitionDelay: `${idx * staggerDelay}s`,
            opacity: shouldAnimate ? 1 : 0,
            transform: shouldAnimate
              ? "translateY(0) scale(1)"
              : "translateY(20px) scale(0.9)",
            color: "transparent",
          }}
        >
          {letter === " " ? "\u00A0" : letter}
        </span>
      ))}
    </h2>
  );
}

/**
 * Animated counter for statistics
 */
export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  duration = 2000,
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const startTime = Date.now();
    const endValue = value;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      
      setDisplayValue(Math.floor(eased * endValue));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, value, duration]);

  return (
    <span ref={containerRef} className={cn("tabular-nums", className)}>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}

/**
 * Scroll-triggered reveal wrapper
 */
export function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = "up",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
}) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -30px 0px" }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const transforms = {
    up: "translateY(40px)",
    down: "translateY(-40px)",
    left: "translateX(40px)",
    right: "translateX(-40px)",
  };

  return (
    <div
      ref={containerRef}
      className={cn("transition-all duration-700 ease-out", className)}
      style={{
        transitionDelay: `${delay}s`,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translate(0)" : transforms[direction],
      }}
    >
      {children}
    </div>
  );
}