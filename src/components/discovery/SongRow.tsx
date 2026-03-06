import { useState } from "react";
import { Play, Heart, MoreHorizontal } from "lucide-react";

interface SongRowProps {
  track: any;
  index: number;
  isPlaying?: boolean;
  isLiked?: boolean;
  onPlay?: (track: any) => void;
  onToggleLike?: (trackId: string) => void;
  onAddToQueue?: (track: any) => void;
}

export function SongRow({ track, index, isPlaying, isLiked, onPlay, onToggleLike, onAddToQueue }: SongRowProps) {
  const [imgError, setImgError] = useState(false);
  const coverSrc = track.album_cover_path && !imgError ? track.album_cover_path : null;

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="group grid items-center gap-3 px-5 py-2.5 rounded-xl cursor-pointer transition-colors"
      style={{
        gridTemplateColumns: "40px 44px 1fr 200px 60px 80px",
        background: isPlaying ? "rgba(0,207,255,0.06)" : "transparent",
      }}
      onClick={() => onPlay?.(track)}
      onMouseEnter={(e) => (e.currentTarget.style.background = isPlaying ? "rgba(0,207,255,0.08)" : "rgba(255,255,255,0.05)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = isPlaying ? "rgba(0,207,255,0.06)" : "transparent")}
    >
      {/* Index / Play */}
      <div className="relative w-10 text-center">
        <span className="group-hover:hidden" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: isPlaying ? "#00CFFF" : "rgba(255,255,255,0.35)" }}>
          {isPlaying ? "♫" : index}
        </span>
        <button
          className="hidden group-hover:flex absolute inset-0 items-center justify-center"
          onClick={(e) => { e.stopPropagation(); onPlay?.(track); }}
        >
          <Play className="w-4 h-4 text-white" fill="white" />
        </button>
      </div>

      {/* Album art */}
      {coverSrc ? (
        <img
          src={coverSrc}
          alt=""
          className="w-11 h-11 rounded-md object-cover"
          style={{ background: "#1A1A2E" }}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-11 h-11 rounded-md" style={{ background: "linear-gradient(135deg, #1A1A2E, #2A2A4E)" }} />
      )}

      {/* Title + Artist */}
      <div className="min-w-0">
        <span className="block truncate" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: 14, color: isPlaying ? "#00CFFF" : "#FFFFFF" }}>
          {track.title}
        </span>
        <span className="block truncate" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 400, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
          {track.artist_name || track.artistName || "Unknown Artist"}
        </span>
      </div>

      {/* Album */}
      <span className="truncate hidden md:block" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
        {track.album_title || track.album?.title || "—"}
      </span>

      {/* Duration */}
      <span className="text-right hidden sm:block" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
        {formatDuration(track.duration)}
      </span>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleLike?.(track.id); }}
          className="p-1 transition-colors"
        >
          <Heart className="w-4 h-4" style={{ color: isLiked ? "#22C55E" : "rgba(255,255,255,0.5)" }} fill={isLiked ? "#22C55E" : "none"} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onAddToQueue?.(track); }}
          className="p-1"
        >
          <MoreHorizontal className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} />
        </button>
      </div>
    </div>
  );
}

export function SongListHeader() {
  return (
    <div
      className="grid items-center gap-3 px-5 py-2 mb-1"
      style={{
        gridTemplateColumns: "40px 44px 1fr 200px 60px 80px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", textAlign: "center" }}>#</span>
      <span />
      <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>TITLE</span>
      <span className="hidden md:block" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>ALBUM</span>
      <span className="hidden sm:block text-right" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>TIME</span>
      <span />
    </div>
  );
}
