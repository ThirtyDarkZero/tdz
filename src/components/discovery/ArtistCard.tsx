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
  const profileUrl = (() => {
    const rawPath = artist.profile_image_path as string | null | undefined;
    if (!rawPath) return null;
    if (rawPath.startsWith("http")) return rawPath;
    const normalized = rawPath.startsWith("artist-images/") ? rawPath.replace("artist-images/", "") : rawPath;
    return supabase.storage.from("artist-images").getPublicUrl(normalized).data.publicUrl;
  })();
  const followers = artist.monthly_listeners || artist.followers || 0;
  const artistId = artist.user_id || artist.id;

  const fmt = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };

  return (
    <div
      className="flex flex-col items-center gap-2.5 cursor-pointer transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
      style={{ width: 120, textAlign: "center" }}
      onClick={() => onClick?.(artist)}
    >
      {/* Circular avatar */}
      <div className="relative" style={{ width: 88, height: 88 }}>
        <ArtistAvatar src={profileUrl} name={name} size={88} />
      </div>

      <p className="truncate w-full text-[13px] font-semibold" style={{ color: "#fff" }}>{name}</p>
      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
        {followers > 0 ? `${fmt(followers)} listeners` : "Artist"}
      </p>

      <button
        onClick={(e) => { e.stopPropagation(); onToggleFollow?.(artistId); }}
        className="px-4 py-1 rounded-full text-[10px] font-semibold transition-all duration-200"
        style={{
          background: isFollowing ? "hsl(var(--primary) / 0.12)" : "rgba(255,255,255,0.06)",
          border: isFollowing ? "1px solid hsl(var(--primary) / 0.3)" : "1px solid rgba(255,255,255,0.1)",
          color: isFollowing ? "hsl(var(--primary))" : "rgba(255,255,255,0.6)",
        }}
      >
        {isFollowing ? "Following" : "Follow"}
      </button>
    </div>
  );
}
