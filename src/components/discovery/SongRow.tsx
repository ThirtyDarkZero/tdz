import { useState } from "react";
import { Play, Heart, MoreHorizontal, Plus } from "lucide-react";
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

  // Generate proper cover URL from Supabase storage
  const getCoverUrl = () => {
    if (imgError) return null;
    if (track.thumbnail) return track.thumbnail;
    if (track.album_cover_path) {
      const bucket = track.album_cover_bucket || 'album-covers';
      return supabase.storage.from(bucket).getPublicUrl(track.album_cover_path).data.publicUrl;
    }
    if (track.albums?.cover_art_path) {
      return supabase.storage.from('album-covers').getPublicUrl(track.albums.cover_art_path).data.publicUrl;
    }
    return null;
  };

  const coverSrc = getCoverUrl();

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="group grid items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200"
      style={{
        gridTemplateColumns: "36px 44px 1fr 180px 56px 72px",
        background: isPlaying
          ? "linear-gradient(135deg, rgba(0,207,255,0.08), rgba(139,92,246,0.06))"
          : "transparent",
        backdropFilter: isPlaying ? "blur(12px)" : undefined,
        border: isPlaying ? "1px solid rgba(0,207,255,0.12)" : "1px solid transparent",
      }}
      onClick={() => onPlay?.(track)}
      onMouseEnter={(e) => {
        if (!isPlaying) {
          e.currentTarget.style.background = "rgba(255,255,255,0.04)";
          e.currentTarget.style.backdropFilter = "blur(8px)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isPlaying) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.backdropFilter = "";
        }
      }}
    >
      {/* Index / Play */}
      <div className="relative w-9 text-center">
        <span className="group-hover:hidden" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, fontWeight: 500, color: isPlaying ? "#00CFFF" : "rgba(255,255,255,0.35)" }}>
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
      <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "rgba(255,255,255,0.05)" }}>
        {coverSrc ? (
          <img
            src={coverSrc}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full" style={{ background: "linear-gradient(135deg, rgba(0,207,255,0.15), rgba(139,92,246,0.15))" }} />
        )}
      </div>

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
      <span className="truncate hidden md:block" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
        {track.album_title || track.album?.title || track.albums?.title || "—"}
      </span>

      {/* Duration */}
      <span className="text-right hidden sm:block" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
        {formatDuration(track.duration)}
      </span>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleLike?.(track.id); }}
          className="p-1.5 rounded-full transition-colors hover:bg-white/10"
        >
          <Heart className="w-4 h-4" style={{ color: isLiked ? "#00CFFF" : "rgba(255,255,255,0.4)" }} fill={isLiked ? "#00CFFF" : "none"} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onAddToQueue?.(track); }}
          className="p-1.5 rounded-full transition-colors hover:bg-white/10"
        >
          <Plus className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.4)" }} />
        </button>
      </div>
    </div>
  );
}

export function SongListHeader() {
  return (
    <div
      className="grid items-center gap-3 px-4 py-2 mb-1"
      style={{
        gridTemplateColumns: "36px 44px 1fr 180px 56px 72px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", textAlign: "center" }}>#</span>
      <span />
      <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>TITLE</span>
      <span className="hidden md:block" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>ALBUM</span>
      <span className="hidden sm:block text-right" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>TIME</span>
      <span />
    </div>
  );
}
