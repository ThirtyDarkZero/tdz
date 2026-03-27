import { useState, memo } from "react";
import { Mic2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ArtistPortalProps {
  artist: {
    user_id: string;
    artist_name: string;
    profile_image_path?: string | null;
  };
  size?: number;
  onClick?: (artist: any) => void;
}

export const ArtistPortal = memo(function ArtistPortal({ artist, size = 72, onClick }: ArtistPortalProps) {
  const [imgError, setImgError] = useState(false);

  const imgUrl = (() => {
    if (imgError || !artist.profile_image_path) return null;
    if (artist.profile_image_path.startsWith("http")) return artist.profile_image_path;
    return supabase.storage.from("artist-assets").getPublicUrl(artist.profile_image_path).data.publicUrl;
  })();

  return (
    <div
      className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0"
      style={{ width: size + 18 }}
      onClick={() => onClick?.(artist)}
    >
      {/* Glow ring container */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: size + 8,
          height: size + 8,
          borderRadius: "50%",
          background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))`,
          padding: 3,
          animation: "portalPulse 2s ease-in-out infinite",
        }}
      >
        <div
          className="rounded-full overflow-hidden flex items-center justify-center"
          style={{
            width: size,
            height: size,
            background: "hsl(var(--bg-surface))",
          }}
        >
          {imgUrl ? (
            <img
              src={imgUrl}
              alt={artist.artist_name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
              loading="eager"
            />
          ) : (
            <Mic2 style={{ width: size * 0.35, height: size * 0.35, color: "rgba(255,255,255,0.3)" }} />
          )}
        </div>
      </div>
      <span
        className="font-body truncate text-center w-full"
        style={{ fontSize: 11, fontWeight: 600, color: "var(--text-2)" }}
      >
        {artist.artist_name}
      </span>
    </div>
  );
});
