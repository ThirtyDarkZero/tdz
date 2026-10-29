import { useEffect, useState } from "react";
import { ChevronLeft, Disc, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CatalogTrackRow } from "./CatalogTrackRow";
import { useCatalogPlayback } from "@/hooks/useCatalogPlayback";
import { fetchRelease, formatDuration, RELEASE_LABEL, type ReleasePayload } from "@/lib/catalog";

interface Props {
  releaseId: string;
  onBack: () => void;
  onOpenArtist?: (artistName: string) => void;
  onAddToPlaylist?: Parameters<typeof useCatalogPlayback>[1];
}

// An album, single or EP from the global catalog: official tracklist, every
// song playable through YouTube.
export function CatalogReleaseView({ releaseId, onBack, onOpenArtist, onAddToPlaylist }: Props) {
  const [data, setData] = useState<ReleasePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const artistName = data?.release.artist.name ?? "";
  const pb = useCatalogPlayback(artistName, onAddToPlaylist);

  useEffect(() => {
    let cancelled = false;
    setData(null); setError(null);
    fetchRelease(releaseId)
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setCover(d.release.cover_url ?? d.tracks.find((t) => t.thumbnail)?.thumbnail ?? null);
      })
      .catch((e) => !cancelled && setError(e.message));
    return () => { cancelled = true; };
  }, [releaseId]);

  const tracks = data?.tracks ?? [];
  const firstPlayable = tracks.map(pb.withVideo).find((t) => t.youtube_id) ?? tracks.find((t) => !t.lookup_failed);
  const totalSec = tracks.reduce((s, t) => s + (t.duration_sec ?? 0), 0);
  const fallbackThumb = tracks.find((t) => t.thumbnail)?.thumbnail ?? null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: "#03030F" }}>
      {cover && (
        <div className="fixed inset-0 z-0" style={{
          backgroundImage: `url(${cover})`, backgroundSize: "cover", backgroundPosition: "center",
          filter: "blur(80px) saturate(1.5) brightness(0.15)", transform: "scale(1.2)",
        }} />
      )}
      <div className="sticky top-0 z-20" style={{ background: "rgba(3,3,15,0.75)", backdropFilter: "blur(32px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-4 px-4 py-3 md:px-6">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} aria-label="Back">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="truncate text-lg font-bold" style={{ color: "var(--text-1)" }}>{data?.release.title ?? "Loading…"}</h1>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 pb-32 pt-8 md:px-6">
        {error && <p className="py-20 text-center" style={{ color: "var(--text-3)" }}>{error}</p>}
        {!data && !error && (
          <div className="flex flex-col items-center gap-3 py-24">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF6347]" />
            <p className="text-sm" style={{ color: "var(--text-3)" }}>Loading tracklist…</p>
          </div>
        )}
        {data && (
          <>
            <div className="mb-8 flex flex-col items-center gap-6 md:flex-row md:items-end">
              <div className="h-52 w-52 shrink-0 overflow-hidden rounded-xl shadow-2xl" style={{ background: "rgba(255,255,255,0.05)" }}>
                {cover ? (
                  <img src={cover} alt={data.release.title} className="h-full w-full object-cover"
                    onError={() => setCover(cover !== fallbackThumb ? fallbackThumb : null)} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center"><Disc className="h-16 w-16" style={{ color: "var(--text-4)" }} /></div>
                )}
              </div>
              <div className="min-w-0 text-center md:text-left">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#FF6347" }}>
                  {RELEASE_LABEL[data.release.release_type]}
                </p>
                <h2 className="mt-1 text-3xl font-black md:text-5xl" style={{ color: "var(--text-1)" }}>{data.release.title}</h2>
                <p className="mt-2 text-sm" style={{ color: "var(--text-3)" }}>
                  <button type="button" className="font-semibold hover:underline" style={{ color: "var(--text-1)" }}
                    onClick={() => onOpenArtist?.(artistName)}>{artistName}</button>
                  {data.release.year ? ` · ${data.release.year}` : ""}
                  {` · ${tracks.length} song${tracks.length === 1 ? "" : "s"}`}
                  {totalSec ? ` · ${Math.round(totalSec / 60)} min` : ""}
                </p>
                <Button className="mt-4 rounded-full px-8" style={{ background: "#FF6347", color: "#000" }}
                  disabled={!firstPlayable} onClick={() => firstPlayable && pb.play(firstPlayable, tracks, data.release.title)}>
                  <Play className="mr-2 h-5 w-5 fill-current" /> Play
                </Button>
              </div>
            </div>

            {tracks.length === 0 ? (
              <p className="py-12 text-center text-sm" style={{ color: "var(--text-3)" }}>
                No tracklist is available for this release yet.
              </p>
            ) : (
              <div className="space-y-1">
                {tracks.map((t, i) => (
                  <CatalogTrackRow
                    key={t.id}
                    track={pb.withVideo(t)}
                    index={i}
                    isCurrent={pb.isCurrent(t)}
                    loading={pb.loadingId === t.id}
                    liked={pb.liked(t)}
                    onPlay={() => pb.play(t, tracks, data.release.title)}
                    onLike={() => pb.like(t, data.release.title)}
                    onAddToPlaylist={() => pb.addToPlaylist(t, data.release.title)}
                  />
                ))}
                {totalSec > 0 && (
                  <p className="px-3 pt-4 text-xs" style={{ color: "var(--text-4)" }}>
                    {data.release.release_date ?? data.release.year ?? ""} · {formatDuration(totalSec)} total
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
