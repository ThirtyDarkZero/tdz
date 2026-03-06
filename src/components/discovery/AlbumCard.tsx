import { useState } from "react";
import { Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AlbumCardProps {
  album: any;
  onClick?: (album: any) => void;
  onPlay?: (album: any) => void;
}

export function AlbumCard({ album, onClick, onPlay }: AlbumCardProps) {
  const [imgError, setImgError] = useState(false);
  const title = album.title || album.name || "Untitled";
  const artist = album.artist_name || album.artist || album.artistName || "Unknown";
  const coverUrl = album.cover_art_path && !imgError
    ? (album.image || supabase.storage.from("album-covers").getPublicUrl(album.cover_art_path).data.publicUrl)
    : album.image || null;
  const year = album.release_date ? new Date(album.release_date).getFullYear() : "";
  const trackCount = album.total_tracks || album.trackCount;

  return (
    <div
      className="group flex flex-col gap-2 cursor-pointer transition-transform hover:-translate-y-1.5"
      style={{ width: 180 }}
      onClick={() => onClick?.(album)}
    >
      <div className="relative rounded-xl overflow-hidden" style={{ width: 180, height: 180 }}>
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={title}
            className="w-full h-full object-cover transition-all group-hover:brightness-75"
            style={{ background: "#1A1A2E", borderRadius: 12 }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full" style={{ background: "linear-gradient(135deg, #1A1A2E, #2A2A4E)", borderRadius: 12 }} />
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onPlay?.(album); }}
            className="w-13 h-13 rounded-full flex items-center justify-center transition-transform hover:scale-110"
            style={{
              width: 52, height: 52,
              background: "rgba(255,255,255,0.95)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
            }}
          >
            <Play className="w-5 h-5 text-black ml-0.5" fill="black" />
          </button>
        </div>
      </div>

      <span
        className="truncate"
        style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: 13, color: "#FFFFFF", maxWidth: 180 }}
      >
        {title}
      </span>
      <span
        className="truncate"
        style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.5)" }}
      >
        {artist}
      </span>
      {(year || trackCount) && (
        <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
          {year}{trackCount ? ` · ${trackCount} tracks` : ""}
        </span>
      )}
    </div>
  );
}
