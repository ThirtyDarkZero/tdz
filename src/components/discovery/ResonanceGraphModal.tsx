import { useMemo } from "react";
import { X, Share2, Heart, Sparkles } from "lucide-react";
import { useResonanceGraph } from "@/hooks/useResonanceGraph";

interface ResonanceGraphModalProps {
  track: any | null;
  onClose: () => void;
}

export function ResonanceGraphModal({ track, onClose }: ResonanceGraphModalProps) {
  const { nodes, edges, loading } = useResonanceGraph(track?.id);

  // Layout: origin centered; children placed radially based on time order.
  const layout = useMemo(() => {
    if (!nodes.length) return [];
    const w = 560, h = 360;
    const cx = w / 2, cy = h / 2;
    const positioned = nodes.map((n, i) => {
      if (n.id === "origin") return { ...n, x: cx, y: cy };
      const angle = (i / Math.max(1, nodes.length - 1)) * Math.PI * 2;
      const radius = 60 + (i % 4) * 35;
      return {
        ...n,
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
      };
    });
    return positioned;
  }, [nodes]);

  const posMap = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    layout.forEach((n) => m.set(n.id, { x: n.x, y: n.y }));
    return m;
  }, [layout]);

  if (!track) return null;

  const shareCount = nodes.filter((n) => n.kind === "share").length;
  const likeCount = nodes.filter((n) => n.kind === "like").length;

  return (
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center p-4"
      style={{ background: "rgba(3,3,15,0.82)", backdropFilter: "blur(20px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, rgba(167,139,250,0.12), rgba(13,13,13,0.96))",
          border: "1px solid rgba(167,139,250,0.35)",
          boxShadow: "0 24px 80px rgba(167,139,250,0.25)",
          backdropFilter: "blur(80px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/10 z-10"
          aria-label="Close resonance graph"
        >
          <X className="w-4 h-4 text-white/70" />
        </button>

        <div className="p-5 pb-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4" style={{ color: "#A78BFA" }} />
            <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "#A78BFA" }}>
              RESONANCE GRAPH · PROPAGATION PATH
            </span>
          </div>
          <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 36, lineHeight: 0.95, color: "#fff" }}>
            HOW "{track.title?.toUpperCase()}" SPREAD
          </h3>
          <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
            {track.artist_name} · {likeCount} resonated · {shareCount} passed it forward
          </p>
        </div>

        <div className="px-5 pb-5">
          <div
            className="relative overflow-hidden"
            style={{
              height: 360,
              background: "rgba(0,0,0,0.3)",
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#A78BFA", borderTopColor: "transparent" }} />
              </div>
            )}
            {!loading && nodes.length <= 1 && (
              <div className="absolute inset-0 flex items-center justify-center text-center px-6">
                <div>
                  <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 28, color: "#fff", lineHeight: 1 }}>
                    BE THE FIRST RESONANCE
                  </p>
                  <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 6 }}>
                    No one has passed this track forward yet. Start the chain.
                  </p>
                </div>
              </div>
            )}
            {!loading && nodes.length > 1 && (
              <svg width="100%" height="100%" viewBox="0 0 560 360">
                {edges.map((e, i) => {
                  const a = posMap.get(e.from);
                  const b = posMap.get(e.to);
                  if (!a || !b) return null;
                  return (
                    <line
                      key={i}
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke="#A78BFA"
                      strokeOpacity={0.35}
                      strokeWidth={1.2}
                    />
                  );
                })}
                {layout.map((n) => {
                  const isOrigin = n.kind === "origin";
                  const color =
                    n.kind === "origin" ? "#FF6347" : n.kind === "share" ? "#A78BFA" : "#22C55E";
                  return (
                    <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
                      <circle r={isOrigin ? 14 : 6} fill={color} fillOpacity={isOrigin ? 1 : 0.85} />
                      <circle r={isOrigin ? 22 : 11} fill={color} fillOpacity={0.18} />
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: "#FF6347" }} />
              <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, color: "rgba(255,255,255,0.6)" }}>ORIGIN</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Share2 className="w-3 h-3" style={{ color: "#A78BFA" }} />
              <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, color: "rgba(255,255,255,0.6)" }}>RESONATED FORWARD ({shareCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart className="w-3 h-3" style={{ color: "#22C55E" }} />
              <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, color: "rgba(255,255,255,0.6)" }}>RESONATED ({likeCount})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
