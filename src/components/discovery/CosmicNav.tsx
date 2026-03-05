import { Sparkles, Music, Globe, Users, Radio } from "lucide-react";

interface CosmicNavProps {
  activeCategory?: string;
  onCategoryChange?: (id: string) => void;
}

const CATEGORIES = [
  { id: "moodscapes", label: "Moodscapes", icon: Sparkles },
  { id: "moodscapes2", label: "Moodscapes", icon: Music },
  { id: "genre-odysseys", label: "Genre Odysseys", icon: Globe },
  { id: "artist-odysseys", label: "Artist Odysseys", icon: Users },
  { id: "artist-portals", label: "Artist Portals", icon: Radio },
];

export function CosmicNav({ activeCategory, onCategoryChange }: CosmicNavProps) {
  return (
    <div className="relative py-12 px-4">
      {/* Connection lines SVG */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cosmicLine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(139,92,246,0.1)" />
            <stop offset="50%" stopColor="rgba(0,207,255,0.2)" />
            <stop offset="100%" stopColor="rgba(139,92,246,0.1)" />
          </linearGradient>
        </defs>
        {/* Horizontal connecting line */}
        <line x1="10%" y1="50%" x2="90%" y2="50%" stroke="url(#cosmicLine)" strokeWidth="1" strokeDasharray="4 4">
          <animate attributeName="stroke-dashoffset" values="0;-8" dur="2s" repeatCount="indefinite" />
        </line>
      </svg>

      <div className="flex items-center justify-center gap-6 sm:gap-10 md:gap-14 flex-wrap relative z-10">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange?.(cat.id)}
              className="flex flex-col items-center gap-2 group transition-all duration-300"
            >
              {/* Orbital bubble */}
              <div className="relative">
                {/* Outer ring */}
                <div
                  className="absolute inset-[-6px] rounded-full transition-opacity duration-500"
                  style={{
                    border: `1px solid ${isActive ? "rgba(0,207,255,0.5)" : "rgba(139,92,246,0.15)"}`,
                    opacity: isActive ? 1 : 0,
                    animation: isActive ? "cosmicOrbitNav 6s linear infinite" : "none",
                  }}
                />
                <div
                  className="absolute inset-[-12px] rounded-full transition-opacity duration-700"
                  style={{
                    border: `1px dashed ${isActive ? "rgba(139,92,246,0.3)" : "rgba(139,92,246,0.08)"}`,
                    opacity: isActive ? 1 : 0,
                    animation: isActive ? "cosmicOrbitNav 10s linear infinite reverse" : "none",
                  }}
                />
                {/* Main bubble */}
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{
                    background: isActive
                      ? "linear-gradient(135deg, rgba(0,207,255,0.2) 0%, rgba(139,92,246,0.2) 100%)"
                      : "rgba(139,92,246,0.06)",
                    border: `1px solid ${isActive ? "rgba(0,207,255,0.4)" : "rgba(139,92,246,0.12)"}`,
                    backdropFilter: "blur(12px)",
                    boxShadow: isActive
                      ? "0 0 25px rgba(0,207,255,0.2), inset 0 0 15px rgba(0,207,255,0.1)"
                      : "0 0 10px rgba(139,92,246,0.05)",
                  }}
                >
                  <cat.icon
                    className="w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-300"
                    style={{ color: isActive ? "#00CFFF" : "#888" }}
                  />
                </div>
              </div>
              
              {/* Label */}
              <span
                className="text-[10px] sm:text-xs font-medium tracking-wider uppercase transition-colors duration-300"
                style={{
                  fontFamily: "'Raleway', sans-serif",
                  color: isActive ? "#00CFFF" : "#666",
                  letterSpacing: "0.12em",
                }}
              >
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Galaxy center icon */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20">
        <div className="w-8 h-8 rounded-full" style={{
          background: "radial-gradient(circle, rgba(0,207,255,0.4) 0%, transparent 70%)",
          animation: "cosmicCenterPulse 4s ease-in-out infinite",
        }} />
      </div>

      <style>{`
        @keyframes cosmicOrbitNav {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes cosmicCenterPulse {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.5); opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
