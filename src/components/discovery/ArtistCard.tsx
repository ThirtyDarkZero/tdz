import { ArtistAvatar } from "./ArtistAvatar";
import { supabase } from "@/integrations/supabase/client";

interface ArtistCardProps {
  artist: any;
  isFollowing?: boolean;
  onToggleFollow?: (artistId: string) => void;
  onClick?: (artist: any) => void;
}

export function ArtistCard({ artist, isFollowing, onToggleFollow, onClick }: ArtistCardProps) {
  const name = artist.artist_name || artist.name || "Unknown";
  const profileUrl = artist.profile_image_path
    ? supabase.storage.from("artist-profiles").getPublicUrl(artist.profile_image_path).data.publicUrl
    : null;
  const followers = artist.monthly_listeners || artist.followers || 0;
  const artistId = artist.user_id || artist.id;

  const formatCount = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };

  return (
    <div
      className="group flex flex-col items-center gap-3 p-5 rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-1.5"
      style={{
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.06)",
        width: 160,
        textAlign: "center",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      }}
      onClick={() => onClick?.(artist)}
    >
      {/* Avatar with glow ring */}
      <div className="relative" style={{ width: 110, height: 110 }}>
        <ArtistAvatar src={profileUrl} name={name} size={110} />
        {/* Glassmorphic pulse ring */}
        <div
          className="absolute rounded-full pointer-events-none transition-all duration-500 group-hover:scale-110"
          style={{
            inset: -5,
            border: "1.5px solid rgba(0,207,255,0.2)",
            boxShadow: "0 0 20px rgba(0,207,255,0.1)",
          }}
        />
        <div
          className="absolute rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            inset: -10,
            border: "1px solid rgba(0,207,255,0.1)",
            boxShadow: "0 0 40px rgba(0,207,255,0.08)",
          }}
        />
      </div>

      <span
        className="truncate w-full group-hover:text-[#00CFFF] transition-colors"
        style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 14, color: "#FFFFFF", maxWidth: 140 }}
      >
        {name}
      </span>

      <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
        {followers > 0 ? `${formatCount(followers)} listeners` : "TDZ Artist"}
      </span>

      <button
        onClick={(e) => { e.stopPropagation(); onToggleFollow?.(artistId); }}
        className="px-5 py-1.5 rounded-full text-xs transition-all duration-200 hover:scale-105"
        style={{
          fontFamily: "'Raleway', sans-serif",
          fontWeight: 600,
          letterSpacing: "0.08em",
          border: isFollowing ? "1px solid rgba(0,207,255,0.4)" : "1px solid rgba(255,255,255,0.15)",
          background: isFollowing
            ? "rgba(0,207,255,0.1)"
            : "rgba(255,255,255,0.04)",
          backdropFilter: "blur(8px)",
          color: isFollowing ? "#00CFFF" : "rgba(255,255,255,0.7)",
        }}
      >
        {isFollowing ? "Following" : "Follow"}
      </button>
    </div>
  );
}
