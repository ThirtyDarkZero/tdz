import { TrendingUp, Play, Music } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMomentumTracks } from "@/hooks/useMomentumTracks";

interface MomentumRowProps {
  tracks: any[];
  cityName?: string | null;
  onPlay: (track: any, list: any[]) => void;
  onShowReason?: (track: any) => void;
}

function cover(t: any) {
  if (t.thumbnail) return t.thumbnail;
  if (t.album_cover_path) {
    return supabase.storage
      .from(t.album_cover_bucket || "album-covers")
      .getPublicUrl(t.album_cover_path).data.publicUrl;
  }
  return null;
}

export function MomentumRow({ tracks, cityName, onPlay }: MomentumRowProps) {
  const momentum = useMomentumTracks(tracks, 12);
  if (!momentum.length) return null;

  const allTracks = momentum.map((m) => m.track);

  return (
    <section className="mx-3 sm:mx-5 my-6" aria-label="Momentum tracks">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4" style={{ color: "#22C55E" }} />
        <span
          style={{
            fontFamily: "'Raleway', sans-serif",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: "#22C55E",
          }}
        >
          MOMENTUM · VELOCITY NOT VOLUME
        </span>
      </div>
      <h2
        style={{
          fontFamily: "'Six Caps', sans-serif",
          fontSize: "clamp(28px, 4.5vw, 44px)",
          lineHeight: 0.95,
          color: "#fff",
          marginBottom: 4,
        }}
      >
        TRACKS RISING FASTEST RIGHT NOW
      </h2>
      <p
        style={{
          fontFamily: "'Raleway', sans-serif",
          fontSize: 11,
          color: "rgba(255,255,255,0.5)",
          marginBottom: 14,
        }}
      >
        Ranked by 24-hour growth velocity, not raw play count.
      </p>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {momentum.map((m) => {
          const img = cover(m.track);
          return (
            <button
              key={m.track.id}
              onClick={() => onPlay(m.track, allTracks)}
              className="group flex-shrink-0 text-left transition-all active:scale-[0.97]"
              style={{
                width: 180,
                background: "linear-gradient(160deg, rgba(34,197,94,0.08), rgba(255,255,255,0.02))",
                border: "1px solid rgba(34,197,94,0.18)",
                borderRadius: 18,
                overflow: "hidden",
                backdropFilter: "blur(80px)",
              }}
            >
              <div className="relative" style={{ aspectRatio: "1" }}>
                {img ? (
                  <img src={img} alt={m.track.title} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <Music className="w-7 h-7 text-white/30" />
                  </div>
                )}
                <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(34,197,94,0.85)" }}>
                  <TrendingUp className="w-3 h-3 text-white" />
                  <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, fontWeight: 800, color: "#fff" }}>
                    +{m.growthPct}%
                  </span>
                </div>
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(0,0,0,0.6)" }}>
                  <span style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 16, color: "#fff", lineHeight: 1 }}>
                    #{m.rank}
                  </span>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(0,0,0,0.4)" }}>
                  <div className="rounded-full p-3" style={{ background: "#22C55E" }}>
                    <Play className="w-5 h-5 text-black" fill="black" />
                  </div>
                </div>
              </div>
              <div className="p-3">
                <p className="truncate" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, fontWeight: 700, color: "#fff" }}>
                  {m.track.title}
                </p>
                <p className="truncate" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
                  {m.track.artist_name}
                </p>
                <p className="mt-1.5 truncate" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, color: "#22C55E", fontWeight: 600, letterSpacing: "0.05em" }}>
                  {m.velocity} PLAYS/DAY{cityName ? ` · RISING IN ${cityName.toUpperCase()}` : ""}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
