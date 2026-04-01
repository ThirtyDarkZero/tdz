import { memo } from "react";
import { Play, Music } from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import { SongRow, SongListHeader } from "@/components/discovery/SongRow";
import { useScalePop, useEmerge, ScrollReveal } from "@/hooks/useScrollAnimations";

interface ImmersiveTrackSectionProps {
  title: string;
  subtitle?: string;
  tracks: any[];
  currentTrackId?: string;
  likedTracks: Set<string>;
  onPlayTrack: (track: any) => void;
  onToggleLike: (trackId: string) => void;
  onAddToQueue: (track: any) => void;
  accentColor?: string;
  maxTracks?: number;
}

export const ImmersiveTrackSection = memo(function ImmersiveTrackSection({
  title,
  subtitle,
  tracks,
  currentTrackId,
  likedTracks,
  onPlayTrack,
  onToggleLike,
  onAddToQueue,
  accentColor = "#00CFFF",
  maxTracks = 10,
}: ImmersiveTrackSectionProps) {
  if (tracks.length === 0) return null;

  const scalePop = useScalePop(0.12);

  return (
    <section ref={scalePop.ref} className="relative w-full min-h-[60vh] flex items-center py-20" style={scalePop.style}>
      {/* Section accent line */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-full hidden lg:block"
        style={{ height: 120, background: `linear-gradient(to bottom, transparent, ${accentColor}, transparent)` }}
      />

      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <ScrollReveal effect="emerge-left" className="mb-8">
          <h2
            className="font-display"
            style={{ fontSize: "clamp(40px, 8vw, 72px)", color: "var(--text-1)", lineHeight: 0.9 }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="font-body mt-2" style={{ fontSize: 14, color: "var(--text-3)" }}>
              {subtitle}
            </p>
          )}
          <div className="mt-4 w-20 h-0.5 rounded-full" style={{ background: accentColor }} />
        </ScrollReveal>

        {/* Track list with glass container — screen-pop effect */}
        <ScrollReveal effect="screen-pop" delay={0.15}>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
              border: "1px solid rgba(255,255,255,0.06)",
              backdropFilter: "blur(40px)",
            }}
          >
            <SongListHeader />
            {tracks.slice(0, maxTracks).map((track, i) => (
              <SongRow
                key={track.id}
                track={track}
                index={i + 1}
                isPlaying={currentTrackId === track.id}
                isLiked={likedTracks.has(track.id)}
                onPlay={onPlayTrack}
                onToggleLike={onToggleLike}
                onAddToQueue={onAddToQueue}
              />
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
});