import { useState } from "react";
import { Play, Heart, Plus, MoreHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
      className="group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150"
      style={{
        background: isPlaying ? "hsl(var(--primary) / 0.08)" : "transparent",
      }}
      onClick={() => onPlay?.(track)}
      onMouseEnter={(e) => { if (!isPlaying) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
      onMouseLeave={(e) => { if (!isPlaying) e.currentTarget.style.background = "transparent"; }}
    >
      {/* Index / Play overlay */}
      <div className="relative w-8 text-center flex-shrink-0">
        <span className="group-hover:hidden text-xs" style={{ color: isPlaying ? "hsl(var(--primary))" : "rgba(255,255,255,0.3)", fontWeight: 500 }}>
          {isPlaying ? "♫" : index}
        </span>
        <button className="hidden group-hover:flex absolute inset-0 items-center justify-center" onClick={(e) => { e.stopPropagation(); onPlay?.(track); }}>
          <Play className="w-3.5 h-3.5 text-white" fill="white" />
        </button>
      </div>

      {/* Album art */}
      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "rgba(255,255,255,0.05)" }}>
        {coverSrc ? (
          <img src={coverSrc} alt="" className="w-full h-full object-cover" onError={() => setImgError(true)} loading="lazy" />
        ) : (
          <div className="w-full h-full" style={{ background: "linear-gradient(135deg, hsl(var(--primary)/0.15), hsl(var(--secondary)/0.15))" }} />
        )}
      </div>

      {/* Title + Artist */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium" style={{ color: isPlaying ? "hsl(var(--primary))" : "#fff" }}>{track.title}</p>
        <p className="truncate text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
          {track.artist_name || "Unknown Artist"}
        </p>
      </div>

      {/* Duration */}
      <span className="hidden sm:block text-xs flex-shrink-0" style={{ color: "rgba(255,255,255,0.25)" }}>{fmtDur(track.duration)}</span>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button onClick={(e) => { e.stopPropagation(); onToggleLike?.(track.id); }} className="p-1.5 rounded-full transition-colors hover:bg-white/10">
          <Heart className="w-3.5 h-3.5" style={{ color: isLiked ? "hsl(var(--primary))" : "rgba(255,255,255,0.35)" }} fill={isLiked ? "hsl(var(--primary))" : "none"} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onAddToQueue?.(track); }} className="p-1.5 rounded-full transition-colors hover:bg-white/10">
          <Plus className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.35)" }} />
        </button>
      </div>
    </div>
  );
}

export function SongListHeader() {
  return (
    <div className="flex items-center gap-3 px-3 py-2 mb-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <span className="w-8 text-center" style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>#</span>
      <span className="w-10" />
      <span className="flex-1" style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Title</span>
      <span className="hidden sm:block text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>Time</span>
      <span className="w-16" />
    </div>
  );
}
