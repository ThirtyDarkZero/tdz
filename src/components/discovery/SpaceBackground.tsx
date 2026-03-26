import { useMemo } from "react";

const STAR_COUNT = 150;
const CRYSTAL_COUNT = 8;

interface SpaceBackgroundProps {
  className?: string;
}

export function SpaceBackground({ className = "" }: SpaceBackgroundProps) {
  const stars = useMemo(() =>
    Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      duration: 2 + Math.random() * 3,
      delay: Math.random() * 4,
      minOp: 0.2 + Math.random() * 0.2,
      maxOp: 0.6 + Math.random() * 0.4,
    })), []);

  const crystals = useMemo(() =>
    Array.from({ length: CRYSTAL_COUNT }, () => ({
      x: Math.random() * 90 + 5,
      y: Math.random() * 90 + 5,
      size: 6 + Math.random() * 10,
      duration: 6 + Math.random() * 6,
      delay: Math.random() * 5,
    })), []);

  return (
    <div className={`fixed inset-0 z-0 pointer-events-none overflow-hidden ${className}`}>
      {/* Layer 1: Deep space base — uses mood CSS vars with fallback */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 120% 80% at 50% 20%, var(--mood-nebula1, #0A0A2E) 0%, #050510 60%, #000000 100%)",
        transition: "background 1.2s ease",
      }} />

      {/* Layer 2: Nebula clouds — mood-reactive */}
      <div className="absolute" style={{
        width: "70vw", height: "60vh", top: "-10%", left: "-15%",
        background: "radial-gradient(ellipse, var(--mood-nebula1, rgba(59,15,107,0.55)) 0%, transparent 70%)",
        animation: "nebulaDrift 20s ease-in-out infinite alternate",
        transition: "background 1.2s ease",
      }} />
      <div className="absolute" style={{
        width: "60vw", height: "70vh", bottom: "-15%", right: "-10%",
        background: "radial-gradient(ellipse, var(--mood-nebula2, rgba(14,42,92,0.6)) 0%, transparent 70%)",
        animation: "nebulaDrift 25s ease-in-out infinite alternate-reverse",
        transition: "background 1.2s ease",
      }} />
      <div className="absolute" style={{
        width: "40vw", height: "50vh", top: "30%", right: "10%",
        background: "radial-gradient(ellipse, var(--mood-nebula3, rgba(10,74,110,0.35)) 0%, transparent 70%)",
        animation: "nebulaDrift 18s ease-in-out infinite alternate",
        transition: "background 1.2s ease",
      }} />
      <div className="absolute" style={{
        width: "50vw", height: "40vh", top: "5%", right: "20%",
        background: "radial-gradient(ellipse, rgba(80,20,120,0.4) 0%, transparent 70%)",
        animation: "nebulaDrift 22s ease-in-out infinite alternate-reverse",
      }} />

      {/* Layer 3: Stars */}
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            background: "white",
            animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
            "--min-opacity": star.minOp,
            "--max-opacity": star.maxOp,
          } as React.CSSProperties}
        />
      ))}

      {/* Layer 4: Crystal diamonds */}
      {crystals.map((c, i) => (
        <div
          key={`crystal-${i}`}
          className="absolute"
          style={{
            left: `${c.x}%`,
            top: `${c.y}%`,
            width: c.size,
            height: c.size,
            clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
            background: `linear-gradient(135deg, var(--mood-accent, rgba(125,211,252,0.7)), rgba(192,132,252,0.5))`,
            filter: "blur(0.3px)",
            animation: `crystalFloat ${c.duration}s ease-in-out ${c.delay}s infinite`,
            transition: "background 1.2s ease",
          }}
        />
      ))}

      <style>{`
        @keyframes nebulaDrift {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(20px, -15px) scale(1.05); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: var(--min-opacity, 0.3); }
          50% { opacity: var(--max-opacity, 1); }
        }
        @keyframes crystalFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.5; }
          33% { transform: translateY(-18px) rotate(15deg); opacity: 0.9; }
          66% { transform: translateY(-8px) rotate(-10deg); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
