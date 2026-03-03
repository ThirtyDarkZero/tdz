import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { BookOpen } from "lucide-react";

interface ArtistStoryCardProps {
  artist: {
    user_id: string;
    artist_name: string;
    bio?: string | null;
    profile_image_path?: string | null;
  };
}

export function ArtistStoryCard({ artist }: ArtistStoryCardProps) {
  const navigate = useNavigate();
  if (!artist.bio) return null;

  const avatarUrl = artist.profile_image_path
    ? artist.profile_image_path.startsWith("http")
      ? artist.profile_image_path
      : supabase.storage.from("artist-images").getPublicUrl(artist.profile_image_path).data.publicUrl
    : null;

  const snippet = artist.bio.length > 160 ? artist.bio.slice(0, 160) + "…" : artist.bio;

  return (
    <div
      onClick={() => navigate(`/artist/${artist.user_id}`)}
      className="cursor-pointer group rounded-xl p-5 transition-all hover:-translate-y-0.5"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(0,207,255,0.04) 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-white/10">
          {avatarUrl ? (
            <img src={avatarUrl} alt={artist.artist_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/40 text-lg font-bold">
              {artist.artist_name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-3 h-3" style={{ color: "#00CFFF" }} />
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "#00CFFF", fontFamily: "'Raleway', sans-serif" }}>
              Artist Story
            </span>
          </div>
          <p className="font-bold text-white text-sm mb-1">{artist.artist_name}</p>
          <p className="text-xs leading-relaxed" style={{ color: "#888" }}>{snippet}</p>
        </div>
      </div>
    </div>
  );
}
