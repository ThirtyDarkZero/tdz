import { useState } from "react";
import { Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AlbumCardProps {
  album: any;
  onClick?: (album: any) => void;
  onPlay?: (album: any) => void;
  size?: "sm" | "md" | "lg";
}

export function AlbumCard({ album, onClick, onPlay, size = "md" }: AlbumCardProps) {
  const [imgError, setImgError] = useState(false);
  const title = album.title || album.name || "Untitled";
  const artist = album.artist_name || album.artist || album.artistName || "Unknown";

  // Robust cover URL resolution
  const getCoverUrl = () => {
    if (imgError) return null;
    if (album.image) return album.image;
    if (album.cover_art_path) {
      return supabase.storage.from("album-covers").getPublicUrl(album.cover_art_path).data.publicUrl;
    }
    if (album.album_cover_path) {
      const bucket = album.album_cover_bucket || "album-covers";
      return supabase.storage.from(bucket).getPublicUrl(album.album_cover_path).data.publicUrl;
    }
    if (album.thumbnail) return album.thumbnail;
    return null;
  };

  const coverUrl = getCoverUrl();
  const year = album.release_date ? new Date(album.release_date).getFullYear() : "";
  const trackCount = album.total_tracks || album.trackCount;

  const dimensions = size === "sm" ? 150 : size === "lg" ? 220 : 180;

  return (
    <div
      className="group flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-2"
      style={{ width: dimensions, flexShrink: 0 }}
      onClick={() => onClick?.(album)}
    >
      {/* Glassmorphic card container */}
      <div
        className="relative rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          width: dimensions,
          height: dimensions,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={title}
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-75"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{
            background: "linear-gradient(135deg, rgba(0,207,255,0.12), rgba(139,92,246,0.12))",
          }}>
            <span style={{ fontSize: 40, opacity: 0.3 }}>🎵</span>
          </div>
        )}

        {/* Glassmorphic bottom overlay */}
        <div
          className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-all duration-300"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
            backdropFilter: "blur(8px)",
            padding: "32px 12px 12px",
          }}
        />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <button
            onClick={(e) => { e.stopPropagation(); onPlay?.(album); }}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{
              background: "rgba(255,255,255,0.95)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.5), 0 0 40px rgba(0,207,255,0.2)",
            }}
          >
            <Play className="w-5 h-5 text-black ml-0.5" fill="black" />
          </button>
        </div>

        {/* Glassmorphic glow ring on hover */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            boxShadow: "inset 0 0 0 1px rgba(0,207,255,0.2), 0 0 30px rgba(0,207,255,0.08)",
          }}
        />
      </div>

      {/* Info */}
      <div className="mt-3 px-1">
        <span
          className="block truncate group-hover:text-[#00CFFF] transition-colors"
          style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: 13, color: "#FFFFFF" }}
        >
          {title}
        </span>
        <span
          className="block truncate mt-0.5"
          style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.45)" }}
        >
          {artist}
        </span>
        {(year || trackCount) && (
          <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
            {year}{trackCount ? ` · ${trackCount} tracks` : ""}
          </span>
        )}
      </div>
    </div>
  );
}
