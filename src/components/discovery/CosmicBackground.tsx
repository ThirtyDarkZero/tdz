import { useEffect, useRef } from "react";

// Generate star positions once
const STAR_COUNT = 200;
const stars = Array.from({ length: STAR_COUNT }, () => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 0.5,
  opacity: Math.random() * 0.8 + 0.2,
  delay: Math.random() * 5,
}));

const PARTICLE_COUNT = 20;
const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 4 + 2,
  duration: Math.random() * 15 + 10,
  delay: Math.random() * 10,
  color: ["rgba(0,207,255,0.3)", "rgba(139,92,246,0.25)", "rgba(34,197,94,0.2)", "rgba(59,130,246,0.25)"][i % 4],
}));

interface CosmicBackgroundProps {
  className?: string;
  intensity?: "low" | "medium" | "high";
  children?: React.ReactNode;
}

export function CosmicBackground({ className = "", intensity = "medium", children }: CosmicBackgroundProps) {
  const opacityMap = { low: 0.4, medium: 0.7, high: 1 };
  const op = opacityMap[intensity];

  return (
    <div className={`relative ${className}`} style={{ background: "#030308" }}>
      {/* Nebula layers */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: op }}>
        {/* Deep space base */}
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse 120% 80% at 20% 10%, rgba(10,0,40,0.9) 0%, transparent 60%),
            radial-gradient(ellipse 100% 60% at 80% 20%, rgba(0,20,50,0.7) 0%, transparent 55%),
            radial-gradient(ellipse 80% 80% at 50% 80%, rgba(20,0,50,0.6) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 10% 60%, rgba(0,40,60,0.4) 0%, transparent 45%)
          `,
        }} />

        {/* Nebula clouds - animated */}
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse 50% 40% at 30% 30%, rgba(139,92,246,0.12) 0%, transparent 70%),
            radial-gradient(ellipse 40% 50% at 70% 60%, rgba(0,207,255,0.1) 0%, transparent 65%),
            radial-gradient(ellipse 60% 30% at 50% 50%, rgba(59,130,246,0.08) 0%, transparent 60%)
          `,
          animation: "cosmicDrift 30s ease-in-out infinite alternate",
        }} />

        {/* Aurora band */}
        <div className="absolute inset-0" style={{
          background: `
            linear-gradient(180deg, 
              transparent 0%,
              rgba(139,92,246,0.04) 30%,
              rgba(0,207,255,0.06) 50%,
              rgba(139,92,246,0.04) 70%,
              transparent 100%
            )
          `,
          animation: "cosmicPulse 20s ease-in-out infinite",
        }} />

        {/* Stars */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {stars.map((star, i) => (
            <circle
              key={i}
              cx={`${star.x}%`}
              cy={`${star.y}%`}
              r={star.size}
              fill="white"
              opacity={star.opacity}
              style={{
                animation: `cosmicTwinkle ${3 + star.delay}s ease-in-out ${star.delay}s infinite`,
              }}
            />
          ))}
        </svg>

        {/* Floating particles */}
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              background: p.color,
              filter: "blur(1px)",
              animation: `cosmicFloat ${p.duration}s ease-in-out ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>

      <style>{`
        @keyframes cosmicDrift {
          0% { transform: translate(0, 0) scale(1); opacity: 0.7; }
          50% { transform: translate(2%, -1%) scale(1.05); opacity: 1; }
          100% { transform: translate(-1%, 1%) scale(0.98); opacity: 0.8; }
        }
        @keyframes cosmicPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        @keyframes cosmicTwinkle {
          0%, 100% { opacity: inherit; }
          50% { opacity: 0.1; }
        }
        @keyframes cosmicFloat {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(20px, -30px); }
          50% { transform: translate(-10px, -50px); }
          75% { transform: translate(15px, -20px); }
        }
      `}</style>
    </div>
  );
}
