import { useState } from "react";
import { Radio } from "lucide-react";
import { useLivePulse } from "@/hooks/useLivePulse";
import { PulseGlobe } from "./PulseGlobe";

interface PulseRailProps {
  onCityClick?: (city: string) => void;
}

export function PulseRail({ onCityClick }: PulseRailProps) {
  const { cities, loading } = useLivePulse(5000);
  const [activeCity, setActiveCity] = useState<string | undefined>();

  if (loading && cities.length === 0) return null;

  return (
    <section
      className="relative mx-3 sm:mx-5 my-4 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(0,207,255,0.08), rgba(255,99,71,0.04))",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 24,
        backdropFilter: "blur(80px)",
      }}
      aria-label="Live global listening pulse"
    >
      <div className="flex flex-col md:flex-row items-stretch">
        {/* Globe */}
        <div className="flex items-center justify-center p-3 md:p-5">
          <PulseGlobe cities={cities} activeCity={activeCity} size={180} />
        </div>

        {/* Cities scroller */}
        <div className="flex-1 min-w-0 flex flex-col justify-center p-4 md:p-5 md:pl-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF6347] opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF6347]" />
            </span>
            <Radio className="w-3.5 h-3.5" style={{ color: "#FF6347" }} />
            <span
              style={{
                fontFamily: "'Raleway', sans-serif",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: "#FF6347",
              }}
            >
              LIVE PULSE · GLOBAL RESONANCE
            </span>
          </div>
          <h2
            style={{
              fontFamily: "'Six Caps', sans-serif",
              fontSize: "clamp(26px, 4vw, 38px)",
              lineHeight: 0.95,
              color: "#fff",
              marginBottom: 10,
            }}
          >
            WHAT THE WORLD IS RESONATING NOW
          </h2>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {cities.map((c) => {
              const isActive = activeCity === c.city;
              return (
                <button
                  key={c.city}
                  onMouseEnter={() => setActiveCity(c.city)}
                  onMouseLeave={() => setActiveCity(undefined)}
                  onClick={() => {
                    setActiveCity(c.city);
                    onCityClick?.(c.city);
                  }}
                  className="flex-shrink-0 transition-all active:scale-95"
                  style={{
                    padding: "8px 14px",
                    borderRadius: 999,
                    background: isActive
                      ? `linear-gradient(135deg, ${c.color}30, ${c.color}10)`
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${isActive ? c.color + "70" : "rgba(255,255,255,0.08)"}`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full"
                      style={{
                        width: 7,
                        height: 7,
                        background: c.color,
                        boxShadow: `0 0 8px ${c.color}`,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "'Raleway', sans-serif",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        color: isActive ? c.color : "rgba(255,255,255,0.85)",
                      }}
                    >
                      {c.city.toUpperCase()}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Raleway', sans-serif",
                        fontSize: 10,
                        fontWeight: 600,
                        color: "rgba(255,255,255,0.5)",
                      }}
                    >
                      · {c.count}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          {activeCity && (
            <div
              className="mt-2 truncate"
              style={{
                fontFamily: "'Raleway', sans-serif",
                fontSize: 11,
                color: "rgba(255,255,255,0.55)",
              }}
            >
              Top in {activeCity}:{" "}
              {cities.find((c) => c.city === activeCity)?.topTrack?.title ?? "—"}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
