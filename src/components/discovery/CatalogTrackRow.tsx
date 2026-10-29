import { Heart, ListPlus, Loader2, Play } from "lucide-react";
import { formatDuration, formatViews, type CatalogTrack } from "@/lib/catalog";

interface Props {
  track: CatalogTrack;
  index: number;
  showThumb?: boolean;
  isCurrent: boolean;
  loading: boolean;
  liked: boolean;
  onPlay: () => void;
  onLike: () => void;
  onAddToPlaylist: () => void;
}

// One song row, shared by the artist "Popular" list and release tracklists.
export function CatalogTrackRow({ track, index, showThumb, isCurrent, loading, liked, onPlay, onLike, onAddToPlaylist }: Props) {
  const unavailable = !!track.lookup_failed && !track.youtube_id;
  return (
    <div
      className={`group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${unavailable ? "opacity-50" : "cursor-pointer hover:bg-white/5"}`}
      onClick={() => !unavailable && onPlay()}
      role="button"
      aria-label={`Play ${track.title}`}
    >
      <div className="w-6 text-center text-sm tabular-nums" style={{ color: isCurrent ? "#FF6347" : "var(--text-4)" }}>
        {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : (
          <>
            <span className="group-hover:hidden">{index + 1}</span>
            <Play className="mx-auto hidden h-4 w-4 group-hover:block" />
          </>
        )}
      </div>
      {showThumb && (
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded" style={{ background: "rgba(255,255,255,0.05)" }}>
          {track.thumbnail && <img src={track.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" style={{ color: isCurrent ? "#FF6347" : "var(--text-1)" }}>{track.title}</p>
        <p className="truncate text-xs" style={{ color: "var(--text-4)" }}>
          {unavailable ? "Not available to stream" : formatViews(track.view_count)}
        </p>
      </div>
      <button
        type="button"
        className="hidden rounded-full p-2 opacity-0 transition-opacity hover:bg-white/10 group-hover:opacity-100 sm:block"
        onClick={(e) => { e.stopPropagation(); onLike(); }}
        aria-label={liked ? "Unlike" : "Like"}
      >
        <Heart className={`h-4 w-4 ${liked ? "fill-[#FF6347] text-[#FF6347] opacity-100" : ""}`} style={{ color: liked ? undefined : "var(--text-4)" }} />
      </button>
      <button
        type="button"
        className="hidden rounded-full p-2 opacity-0 transition-opacity hover:bg-white/10 group-hover:opacity-100 sm:block"
        onClick={(e) => { e.stopPropagation(); onAddToPlaylist(); }}
        aria-label="Add to playlist"
      >
        <ListPlus className="h-4 w-4" style={{ color: "var(--text-4)" }} />
      </button>
      <span className="w-10 shrink-0 text-right text-xs tabular-nums sm:w-12" style={{ color: "var(--text-4)" }}>{formatDuration(track.duration_sec)}</span>
    </div>
  );
}
