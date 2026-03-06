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

  return (
    <div
      className="flex flex-col items-center gap-2.5 p-5 rounded-2xl cursor-pointer transition-all hover:-translate-y-1"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        width: 160,
        textAlign: "center",
      }}
      onClick={() => onClick?.(artist)}
    >
      <div className="relative" style={{ width: 120, height: 120 }}>
        <ArtistAvatar src={profileUrl} name={name} size={120} />
        {/* Pulse ring */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: -4,
            border: "1.5px solid rgba(0,207,255,0.3)",
            animation: "portalPulse 4s ease-in-out infinite",
          }}
        />
      </div>

      <span
        className="truncate w-full"
        style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 14, color: "#FFFFFF", maxWidth: 140 }}
      >
        {name}
      </span>

      <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
        {followers > 0 ? `${followers.toLocaleString()} followers` : "TDZ Artist"}
      </span>

      <button
        onClick={(e) => { e.stopPropagation(); onToggleFollow?.(artistId); }}
        className="px-5 py-1.5 rounded-full text-xs transition-all"
        style={{
          fontFamily: "'Raleway', sans-serif",
          fontWeight: 600,
          letterSpacing: "0.08em",
          border: isFollowing ? "1px solid #22C55E" : "1px solid rgba(255,255,255,0.2)",
          background: isFollowing ? "rgba(34,197,94,0.15)" : "transparent",
          color: isFollowing ? "#22C55E" : "rgba(255,255,255,0.8)",
        }}
      >
        {isFollowing ? "Following" : "Follow"}
      </button>

      <style>{`
        @keyframes portalPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(0,207,255,0.2), 0 0 40px rgba(0,207,255,0.08); }
          50% { box-shadow: 0 0 30px rgba(0,207,255,0.4), 0 0 60px rgba(0,207,255,0.15); }
        }
      `}</style>
    </div>
  );
}
