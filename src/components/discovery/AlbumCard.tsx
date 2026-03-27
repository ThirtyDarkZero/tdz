import { useState, memo } from "react";
import { Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AlbumCardProps {
  album: any;
  onClick?: (album: any) => void;
  onPlay?: (album: any) => void;
  size?: "sm" | "md" | "lg";
}

export const AlbumCard = memo(function AlbumCard({ album, onClick, onPlay, size = "md" }: AlbumCardProps) {
  const [imgError, setImgError] = useState(false);
  const title = album.title || album.name || "Untitled";
  const artist = album.artist_name || album.artist || "Unknown";

  const getCoverUrl = () => {
    if (imgError) return null;
    if (album.image) return album.image;
    if (album.cover_art_path) return supabase.storage.from("album-covers").getPublicUrl(album.cover_art_path).data.publicUrl;
    if (album.album_cover_path) {
      const bucket = album.album_cover_bucket || "album-covers";
      return supabase.storage.from(bucket).getPublicUrl(album.album_cover_path).data.publicUrl;
    }
    if (album.thumbnail) return album.thumbnail;
    return null;
  };

  const coverUrl = getCoverUrl();
  const dim = size === "sm" ? 140 : size === "lg" ? 200 : 150;

  return (
    <div
      className="group flex flex-col cursor-pointer transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
      style={{ width: dim, flexShrink: 0 }}
      onClick={() => onClick?.(album)}
    >
      <div
        className="relative overflow-hidden"
        style={{ width: dim, height: dim, background: "hsl(var(--bg-surface))", borderRadius: "var(--radius-md)" }}
      >
        {coverUrl ? (
          <img src={coverUrl} alt={title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" onError={() => setImgError(true)} loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(var(--primary)/0.12), hsl(var(--secondary)/0.12))" }}>
            <span style={{ fontSize: 32, opacity: 0.2 }}>🎵</span>
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity duration-200" style={{ background: "rgba(0,0,0,0.35)" }}>
          <button
            onClick={(e) => { e.stopPropagation(); onPlay?.(album); }}
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.95)", color: "#000" }}
          >
            <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
          </button>
        </div>
      </div>
      <div className="mt-2 px-0.5">
        <p className="truncate font-body" style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{title}</p>
        <p className="truncate font-body" style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{artist}</p>
      </div>
    </div>
  );
});
