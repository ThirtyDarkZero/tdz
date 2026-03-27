import { useMemo } from "react";

const STAR_COUNT = 120;
const CRYSTAL_COUNT = 6;

export function SpaceBackground() {
  const stars = useMemo(() =>
    Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      duration: 2 + Math.random() * 3,
      delay: Math.random() * 4,
      minOp: 0.15 + Math.random() * 0.2,
      maxOp: 0.5 + Math.random() * 0.5,
    })), []);

  const crystals = useMemo(() =>
    Array.from({ length: CRYSTAL_COUNT }, () => ({
      x: Math.random() * 85 + 7,
      y: Math.random() * 85 + 7,
      size: 6 + Math.random() * 10,
      duration: 6 + Math.random() * 6,
      delay: Math.random() * 5,
    })), []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Layer 1: Deep space void */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 140% 80% at 50% 15%, #0A0A2E 0%, #050510 55%, #000000 100%)",
      }} />

      {/* Layer 2: Nebula clouds — 4 layers with slow drift */}
      <div className="absolute rounded-[50%]" style={{
        width: "70vw", height: "60vh", top: "-10%", left: "-15%",
        background: "radial-gradient(ellipse, var(--nebula-violet, rgba(72,12,168,0.55)), transparent 70%)",
        filter: "blur(80px)",
        animation: "nebulaDrift 22s ease-in-out infinite alternate",
        willChange: "transform",
      }} />
      <div className="absolute rounded-[50%]" style={{
        width: "60vw", height: "70vh", bottom: "-15%", right: "-10%",
        background: "radial-gradient(ellipse, var(--nebula-indigo, rgba(18,48,110,0.65)), transparent 70%)",
        filter: "blur(80px)",
        animation: "nebulaDrift 28s ease-in-out infinite alternate-reverse",
        willChange: "transform",
      }} />
      <div className="absolute rounded-[50%]" style={{
        width: "45vw", height: "50vh", top: "25%", right: "5%",
        background: "radial-gradient(ellipse, var(--nebula-teal, rgba(8,80,120,0.38)), transparent 70%)",
        filter: "blur(80px)",
        animation: "nebulaDrift 20s ease-in-out infinite alternate",
        willChange: "transform",
      }} />
      <div className="absolute rounded-[50%]" style={{
        width: "50vw", height: "40vh", top: "5%", right: "15%",
        background: "radial-gradient(ellipse, var(--nebula-rose, rgba(80,20,120,0.38)), transparent 70%)",
        filter: "blur(80px)",
        animation: "nebulaDrift 25s ease-in-out infinite alternate-reverse",
        willChange: "transform",
      }} />

      {/* Layer 3: Art-reactive nebula — shifts color with playing track */}
      <div className="absolute rounded-[50%]" style={{
        width: "80vw", height: "80vh", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        background: "radial-gradient(ellipse, var(--art-color-1, rgba(0,207,255,0.12)) 0%, var(--art-color-2, rgba(139,92,246,0.08)) 40%, transparent 70%)",
        filter: "blur(60px)",
        transition: "background 3s ease",
        animation: "nebulaDrift 18s ease-in-out infinite alternate",
        willChange: "transform",
      }} />

      {/* Layer 4: Stars */}
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

      {/* Layer 5: Crystal diamonds */}
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
            background: `linear-gradient(135deg, var(--mood-accent, #00CFFF), rgba(139,92,246,0.5))`,
            filter: "blur(0.3px)",
            animation: `crystalFloat ${c.duration}s ease-in-out ${c.delay}s infinite`,
            transition: "background 1.4s ease",
          }}
        />
      ))}
    </div>
  );
}
