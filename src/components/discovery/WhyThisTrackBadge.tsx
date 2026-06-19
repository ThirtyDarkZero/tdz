import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { buildReason } from "@/hooks/useRecommendationReasons";

interface WhyThisTrackBadgeProps {
  track: any;
  followedArtists?: Set<string>;
  likedTracks?: Set<string>;
  lastPlayed?: any | null;
  cityName?: string | null;
  compact?: boolean;
}

export function WhyThisTrackBadge({
  track,
  followedArtists,
  likedTracks,
  lastPlayed,
  cityName,
  compact = false,
}: WhyThisTrackBadgeProps) {
  const [open, setOpen] = useState(false);
  const reason = buildReason({ track, followedArtists, likedTracks, lastPlayed, cityName });

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="inline-flex items-center gap-1 transition-all hover:scale-105 active:scale-95"
        style={{
          padding: compact ? "2px 7px" : "3px 9px",
          borderRadius: "999px",
          background: `linear-gradient(135deg, ${reason.color}22, ${reason.color}08)`,
          border: `1px solid ${reason.color}55`,
          fontFamily: "'Raleway', sans-serif",
          fontSize: compact ? 8.5 : 9.5,
          fontWeight: 700,
          letterSpacing: "0.08em",
          color: reason.color,
          whiteSpace: "nowrap",
          maxWidth: compact ? 180 : 260,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        aria-label={`Why this track: ${reason.label}`}
      >
        <Sparkles className="w-2.5 h-2.5 flex-shrink-0" />
        <span className="truncate">{reason.label}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: "rgba(3,3,15,0.78)", backdropFilter: "blur(20px)" }}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(false);
          }}
        >
          <div
            className="relative max-w-sm w-full p-7 rounded-3xl"
            style={{
              background: `linear-gradient(145deg, ${reason.color}18, rgba(13,13,13,0.95))`,
              border: `1px solid ${reason.color}55`,
              boxShadow: `0 24px 80px ${reason.color}30`,
              backdropFilter: "blur(80px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/10"
            >
              <X className="w-4 h-4 text-white/70" />
            </button>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4" style={{ color: reason.color }} />
              <span
                style={{
                  fontFamily: "'Raleway', sans-serif",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  color: reason.color,
                }}
              >
                WHY THIS TRACK
              </span>
            </div>
            <h3
              style={{
                fontFamily: "'Six Caps', sans-serif",
                fontSize: 34,
                lineHeight: 0.95,
                color: "#fff",
                marginBottom: 10,
              }}
            >
              {reason.label}
            </h3>
            <p
              style={{
                fontFamily: "'Raleway', sans-serif",
                fontSize: 14,
                lineHeight: 1.5,
                color: "rgba(255,255,255,0.78)",
              }}
            >
              {reason.detail}
            </p>
            <div
              className="mt-5 pt-4"
              style={{
                borderTop: "1px solid rgba(255,255,255,0.08)",
                fontFamily: "'Raleway', sans-serif",
                fontSize: 11,
                color: "rgba(255,255,255,0.5)",
              }}
            >
              TDZ recommendations are transparent — no black-box algorithms.
              Spotify and Apple Music hide this. We don't.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
