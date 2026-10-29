import { useEffect, useState } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CatalogReleaseView } from "./CatalogReleaseView";
import { fetchArtist, normRelease } from "@/lib/catalog";

interface GlobalAlbumDetailProps {
  album: {
    id: string;
    title: string;
    artist: string;
    year?: string;
    coverArt?: string;
    type?: string;
    genres?: string[];
    source: "discogs" | "musicbrainz" | "youtube" | "billboard" | "allmusic" | "catalog";
    releaseId?: string;
  };
  onClose: () => void;
  onAddToPlaylist?: (track: { id: string; title: string; artist_name: string; youtubeId?: string; thumbnail?: string; album_title?: string }) => void;
  onOpenArtist?: (artistName: string) => void;
}

// Album pages opened from search, charts, Discogs or MusicBrainz lists all
// resolve to the same catalog release, so every album plays the same way.
export function GlobalAlbumDetail({ album, onClose, onAddToPlaylist, onOpenArtist }: GlobalAlbumDetailProps) {
  const [releaseId, setReleaseId] = useState<string | null>(album.source === "catalog" ? album.id : null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (album.source === "catalog") { setReleaseId(album.id); return; }
    let cancelled = false;
    setReleaseId(null); setMissing(false);
    fetchArtist({ name: album.artist })
      .then((d) => {
        if (cancelled) return;
        const want = normRelease(album.title);
        const exact = d.releases.filter((r) => normRelease(r.title) === want);
        const pick = exact.find((r) => !album.year || String(r.year) === String(album.year)) ?? exact[0];
        if (pick) setReleaseId(pick.id); else setMissing(true);
      })
      .catch(() => !cancelled && setMissing(true));
    return () => { cancelled = true; };
  }, [album.id, album.title, album.artist, album.year, album.source]);

  if (releaseId) {
    return (
      <CatalogReleaseView releaseId={releaseId} onBack={onClose} onAddToPlaylist={onAddToPlaylist}
        onOpenArtist={(name) => (onOpenArtist ? onOpenArtist(name) : onClose())} />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: "#03030F" }}>
      <Button variant="ghost" size="icon" onClick={onClose} className="absolute left-4 top-4 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} aria-label="Back">
        <ChevronLeft className="h-5 w-5" />
      </Button>
      {!missing ? (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-[#FF6347]" />
          <p style={{ color: "var(--text-3)" }}>Finding {album.title}…</p>
        </>
      ) : (
        <>
          <p className="text-lg font-semibold" style={{ color: "var(--text-1)" }}>{album.title}</p>
          <p className="max-w-sm text-sm" style={{ color: "var(--text-3)" }}>
            This release isn't in {album.artist}'s catalog yet. You can browse everything we have for them.
          </p>
          <Button style={{ background: "#FF6347", color: "#000" }} className="rounded-full"
            onClick={() => (onOpenArtist ? onOpenArtist(album.artist) : onClose())}>
            View {album.artist}
          </Button>
        </>
      )}
    </div>
  );
}
