import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, ChevronLeft, Disc, Loader2, Play, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CatalogTrackRow } from "./CatalogTrackRow";
import { CatalogReleaseView } from "./CatalogReleaseView";
import { useCatalogPlayback } from "@/hooks/useCatalogPlayback";
import {
  artistRef, fetchArtist, RELEASE_LABEL, type ArtistPayload, type CatalogRelease, type ReleaseType,
} from "@/lib/catalog";

interface GlobalArtistProfileProps {
  /** Artist name, or "mbid:<MusicBrainz id>" / "id:<catalog id>". */
  artistName: string;
  /** MusicBrainz id when the caller has one. */
  artistId?: string;
  source: "discogs" | "musicbrainz" | "allmusic";
  onClose: () => void;
  onAddToPlaylist?: Parameters<typeof useCatalogPlayback>[1];
}

const TABS: Array<{ key: string; label: string; types: ReleaseType[] }> = [
  { key: "albums", label: "Albums", types: ["album"] },
  { key: "singles", label: "Singles & EPs", types: ["single", "ep"] },
  { key: "more", label: "Compilations & Live", types: ["compilation", "live", "other"] },
];

function ReleaseCard({ release, onOpen }: { release: CatalogRelease; onOpen: () => void }) {
  const [src, setSrc] = useState<string | null>(release.cover_url ?? release.fallback_cover);
  return (
    <button type="button" onClick={onOpen} className="group w-full text-left">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
        {src ? (
          <img src={src} alt={release.title} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105"
            onError={() => setSrc(src !== release.fallback_cover ? release.fallback_cover : null)} />
        ) : (
          <div className="flex h-full w-full items-center justify-center"><Disc className="h-10 w-10" style={{ color: "var(--text-4)" }} /></div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <Play className="h-10 w-10 fill-white text-white" />
        </div>
      </div>
      <p className="mt-2 truncate text-sm font-medium" style={{ color: "var(--text-1)" }}>{release.title}</p>
      <p className="truncate text-xs" style={{ color: "var(--text-4)" }}>
        {[release.year, RELEASE_LABEL[release.release_type]].filter(Boolean).join(" · ")}
      </p>
    </button>
  );
}

// Artist profile for anyone in the global catalog: photo, popular songs and a
// full discography (albums, singles, EPs), all playable. Built once from
// MusicBrainz + YouTube Music and then served from the TDZ database.
export function GlobalArtistProfile({ artistName, artistId, source, onClose, onAddToPlaylist }: GlobalArtistProfileProps) {
  const navigate = useNavigate();
  const [data, setData] = useState<ArtistPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("albums");
  const [openRelease, setOpenRelease] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const [reload, setReload] = useState(0);

  const ref = useMemo(
    () => artistRef(artistName, source === "musicbrainz" ? artistId : undefined),
    [artistName, artistId, source],
  );
  const name = data?.artist.name ?? (artistName.includes(":") ? "" : artistName);
  const pb = useCatalogPlayback(name, onAddToPlaylist);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    const load = async (attempt = 0) => {
      try {
        const d = await fetchArtist(ref);
        if (cancelled) return;
        setData(d);
        setError(null);
        // Another visitor is building this profile right now: check back shortly.
        if (d.syncing && attempt < 10) timer = window.setTimeout(() => load(attempt + 1), 3000);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    };
    setData(null); setError(null); setImgFailed(false); setOpenRelease(null);
    load();
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [ref, reload]);

  const groups = useMemo(() => {
    const releases = data?.releases ?? [];
    return TABS.map((t) => ({ ...t, items: releases.filter((r) => t.types.includes(r.release_type)) }))
      .filter((g) => g.items.length > 0);
  }, [data]);
  const activeTab = groups.find((g) => g.key === tab) ?? groups[0];
  const topTracks = data?.topTracks ?? [];

  if (openRelease) {
    return (
      <CatalogReleaseView
        releaseId={openRelease}
        onBack={() => setOpenRelease(null)}
        onOpenArtist={() => setOpenRelease(null)}
        onAddToPlaylist={onAddToPlaylist}
      />
    );
  }

  const image = !imgFailed ? data?.artist.image_url : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: "#03030F" }}>
      {image && (
        <div className="fixed inset-0 z-0" style={{
          backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center",
          filter: "blur(80px) saturate(1.5) brightness(0.15)", transform: "scale(1.2)",
        }} />
      )}
      <div className="fixed inset-0 z-0" style={{ background: "linear-gradient(to bottom, rgba(3,3,15,0.4), rgba(3,3,15,0.9) 60%, rgba(3,3,15,0.98))" }} />

      <div className="sticky top-0 z-20" style={{ background: "rgba(3,3,15,0.75)", backdropFilter: "blur(32px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-4 px-4 py-3 md:px-6">
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} aria-label="Back">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="truncate text-lg font-bold" style={{ color: "var(--text-1)" }}>{name}</h1>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 pb-32 md:px-6">
        {error && (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <p style={{ color: "var(--text-3)" }}>{error}</p>
            <Button variant="outline" onClick={() => setReload((n) => n + 1)}><RefreshCw className="mr-2 h-4 w-4" /> Try again</Button>
          </div>
        )}

        {!data && !error && (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#FF6347]" />
            <p style={{ color: "var(--text-2)" }}>Loading {name || "artist"}…</p>
            <p className="max-w-sm text-xs" style={{ color: "var(--text-4)" }}>
              The first visit to a new artist builds their profile and discography. It takes a few seconds, then it's instant for everyone.
            </p>
          </div>
        )}

        {data && (
          <>
            <div className="flex flex-col items-center pb-8 pt-10 text-center">
              <div className="relative mb-6">
                <div className="absolute -inset-4 rounded-full" style={{ background: "rgba(255,99,71,0.2)", filter: "blur(30px)" }} />
                <div className="relative h-44 w-44 overflow-hidden rounded-full md:h-56 md:w-56" style={{
                  border: "3px solid rgba(255,99,71,0.3)", boxShadow: "0 0 40px rgba(255,99,71,0.15)",
                }}>
                  {image ? (
                    <img src={image} alt={name} className="h-full w-full object-cover" onError={() => setImgFailed(true)} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(255,99,71,0.2), rgba(139,92,246,0.2))" }}>
                      <span className="text-5xl font-black" style={{ color: "rgba(255,255,255,0.3)" }}>{name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                </div>
              </div>
              <h2 className="text-4xl font-black md:text-6xl" style={{ color: "var(--text-1)" }}>{name}</h2>
              {data.artist.disambiguation && (
                <p className="mt-1 text-sm" style={{ color: "var(--text-4)" }}>{data.artist.disambiguation}</p>
              )}
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {data.artist.tdz_user_id && (
                  <Badge className="cursor-pointer" style={{ background: "#FF6347", color: "#000" }}
                    onClick={() => navigate(`/artist/${data.artist.tdz_user_id}`)}>
                    <BadgeCheck className="mr-1 h-3.5 w-3.5" /> On TDZ Distribution
                  </Badge>
                )}
                {data.artist.genres.slice(0, 4).map((g) => (
                  <Badge key={g} variant="outline" className="capitalize" style={{ borderColor: "rgba(255,255,255,0.15)", color: "var(--text-3)" }}>{g}</Badge>
                ))}
                {data.artist.country && (
                  <Badge variant="outline" style={{ borderColor: "rgba(255,255,255,0.15)", color: "var(--text-3)" }}>{data.artist.country}</Badge>
                )}
              </div>
              <Button className="mt-6 rounded-full px-10" style={{ background: "#FF6347", color: "#000" }}
                disabled={topTracks.length === 0} onClick={() => topTracks[0] && pb.play(topTracks[0], topTracks)}>
                <Play className="mr-2 h-5 w-5 fill-current" /> Play
              </Button>
            </div>

            {data.syncing && (
              <p className="mb-6 flex items-center justify-center gap-2 text-sm" style={{ color: "var(--text-3)" }}>
                <Loader2 className="h-4 w-4 animate-spin" /> Adding more of {name}'s music…
              </p>
            )}

            {topTracks.length > 0 ? (
              <section className="mb-10">
                <h3 className="mb-3 text-2xl font-black" style={{ color: "var(--text-1)" }}>Popular</h3>
                <div className="space-y-1">
                  {topTracks.map((t, i) => (
                    <CatalogTrackRow key={t.id} track={pb.withVideo(t)} index={i} showThumb
                      isCurrent={pb.isCurrent(t)} loading={pb.loadingId === t.id} liked={pb.liked(t)}
                      onPlay={() => pb.play(t, topTracks)} onLike={() => pb.like(t)} onAddToPlaylist={() => pb.addToPlaylist(t)} />
                  ))}
                </div>
              </section>
            ) : !data.syncing && (
              <p className="mb-10 rounded-lg p-4 text-center text-sm" style={{ background: "rgba(255,255,255,0.04)", color: "var(--text-3)" }}>
                {data.artist.sync_error === "youtube_quota"
                  ? "Streaming for this artist is being set up and will be ready shortly. You can open any release to play it now."
                  : "Open a release below to play this artist's music."}
              </p>
            )}

            {groups.length > 0 && activeTab && (
              <section>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <h3 className="mr-4 text-2xl font-black" style={{ color: "var(--text-1)" }}>Discography</h3>
                  {groups.map((g) => (
                    <button key={g.key} type="button" onClick={() => setTab(g.key)}
                      className="rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
                      style={g.key === activeTab.key
                        ? { background: "var(--text-1)", color: "#03030F" }
                        : { background: "rgba(255,255,255,0.06)", color: "var(--text-2)" }}>
                      {g.label} <span className="opacity-60">{g.items.length}</span>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {activeTab.items.map((r) => (
                    <ReleaseCard key={r.id} release={r} onOpen={() => setOpenRelease(r.id)} />
                  ))}
                </div>
              </section>
            )}

            {groups.length === 0 && topTracks.length === 0 && !data.syncing && (
              <p className="py-12 text-center text-sm" style={{ color: "var(--text-3)" }}>
                We couldn't find music for {name} yet.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
