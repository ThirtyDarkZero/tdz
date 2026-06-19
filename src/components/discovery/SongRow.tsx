import { useState, memo } from "react";
import { Play, MoreHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WhyThisTrackBadge } from "./WhyThisTrackBadge";

interface SongRowProps {
  track: any;
  index: number;
  isPlaying?: boolean;
  isLiked?: boolean;
  onPlay?: (track: any) => void;
  onToggleLike?: (trackId: string) => void;
  onAddToQueue?: (track: any) => void;
  onShowResonance?: (track: any) => void;
}

export const SongRow = memo(function SongRow({ track, index, isPlaying, onPlay, onShowResonance }: SongRowProps) {
  const [imgError, setImgError] = useState(false);

  const getCoverUrl = () => {
    if (imgError) return null;
    if (track.thumbnail) return track.thumbnail;
    if (track.album_cover_path) {
      const bucket = track.album_cover_bucket || "album-covers";
      return supabase.storage.from(bucket).getPublicUrl(track.album_cover_path).data.publicUrl;
    }
    if (track.albums?.cover_art_path) {
      return supabase.storage.from("album-covers").getPublicUrl(track.albums.cover_art_path).data.publicUrl;
    }
    return null;
  };

  const coverSrc = getCoverUrl();
  const fmtDur = (s?: number) => {
    if (!s) return "—";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="group flex items-center gap-3 rounded-[var(--radius-sm)] cursor-pointer transition-all duration-150"
      style={{
        padding: "10px 20px",
        background: isPlaying ? "var(--glass-1)" : "transparent",
      }}
      onClick={() => onPlay?.(track)}
      onMouseEnter={(e) => { if (!isPlaying) (e.currentTarget.style.background = "var(--glass-1)"); }}
      onMouseLeave={(e) => { if (!isPlaying) (e.currentTarget.style.background = "transparent"); }}
    >
      {/* Number */}
      <span className="w-5 text-center flex-shrink-0 font-body" style={{
        fontSize: 13, color: isPlaying ? "#00CFFF" : "var(--text-4)", fontWeight: 500,
      }}>
        {isPlaying ? "♫" : index}
      </span>

      {/* Art — 52x52 */}
      <div
        className="w-[52px] h-[52px] rounded-[10px] overflow-hidden flex-shrink-0 transition-shadow duration-200"
        style={{
          background: "hsl(var(--bg-surface))",
          boxShadow: isPlaying ? "0 0 16px #00CFFF" : "none",
        }}
      >
        {coverSrc ? (
          <img src={coverSrc} alt="" className="w-full h-full object-cover" onError={() => setImgError(true)} loading="lazy" />
        ) : (
          <div className="w-full h-full" style={{ background: "linear-gradient(135deg, hsl(var(--primary)/0.15), hsl(var(--secondary)/0.15))" }} />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-body" style={{ fontSize: 14, fontWeight: 700, color: isPlaying ? "#00CFFF" : "var(--text-1)" }}>
          {track.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 min-w-0">
          <p className="truncate font-body" style={{ fontSize: 12, color: "var(--text-3)" }}>
            {track.artist_name || "Unknown Artist"}
          </p>
          <span className="hidden md:inline-flex flex-shrink-0">
            <WhyThisTrackBadge track={track} compact />
          </span>
        </div>
      </div>

      {/* Duration */}
      <span className="hidden sm:block font-body flex-shrink-0" style={{ fontSize: 12, color: "var(--text-4)" }}>
        {fmtDur(track.duration)}
      </span>

      {/* Menu */}
      <button
        onClick={(e) => { e.stopPropagation(); onShowResonance?.(track); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 flex-shrink-0"
        style={{ color: "var(--text-3)" }}
        title="Show resonance graph"
        aria-label="Show resonance graph"
      >
        <MoreHorizontal className="w-[18px] h-[18px]" />
      </button>
    </div>
  );
});

export function SongListHeader() {
  return (
    <div className="flex items-center gap-3 py-2 mb-1 font-body" style={{ padding: "8px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <span className="w-5 text-center" style={{ fontSize: 10, fontWeight: 600, color: "var(--text-4)", letterSpacing: "0.1em" }}>#</span>
      <span className="w-[52px]" />
      <span className="flex-1" style={{ fontSize: 10, fontWeight: 600, color: "var(--text-4)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Title</span>
      <span className="hidden sm:block" style={{ fontSize: 10, color: "var(--text-4)" }}>Time</span>
      <span className="w-8" />
    </div>
  );
}
