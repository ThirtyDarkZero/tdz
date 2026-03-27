import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer } from "@/contexts/PlayerContext";
import { Play, ChevronLeft, Music, Loader2, Shuffle } from "lucide-react";
import { toast } from "sonner";

const GENRE_META: Record<string, { color: string; label: string }> = {
  "hip-hop": { color: "#8B5CF6", label: "HIP HOP" },
  "r&b": { color: "#EC4899", label: "R&B" },
  "pop": { color: "#22C55E", label: "POP" },
  "rock": { color: "#EF4444", label: "ROCK" },
  "latin": { color: "#EAB308", label: "LATIN" },
  "jazz": { color: "#F59E0B", label: "JAZZ" },
  "dance": { color: "#06B6D4", label: "DANCE" },
  "afrobeats": { color: "#F97316", label: "AFROBEATS" },
};

interface GenrePlaylistDetailProps {
  genre: string;
  onBack: () => void;
}

export function GenrePlaylistDetail({ genre, onBack }: GenrePlaylistDetailProps) {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tdzTracks, setTdzTracks] = useState<any[]>([]);
  const { currentTrack, playTrack } = usePlayer();

  const meta = GENRE_META[genre.toLowerCase()] || { color: "#00CFFF", label: genre.toUpperCase() };

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      setLoading(true);

      // Fetch YouTube Music editorial playlist
      const ytPromise = supabase.functions.invoke("genre-playlist", {
        body: { genre: genre.toLowerCase() },
      });

      // Fetch TDZ artist tracks in this genre
      const genreTerms = [genre.toLowerCase()];
      if (genre.toLowerCase() === "hip-hop") genreTerms.push("hip hop", "rap");
      if (genre.toLowerCase() === "r&b") genreTerms.push("rnb", "r and b", "soul");
      if (genre.toLowerCase() === "dance") genreTerms.push("electronic", "edm", "house");

      const tdzPromise = supabase
        .from("tracks")
        .select("id, title, artist_name, album_cover_path, album_cover_bucket, play_count, duration, file_path, genre, is_published")
        .eq("is_published", true)
        .limit(50);

      const [ytResult, tdzResult] = await Promise.all([ytPromise, tdzPromise]);

      if (cancelled) return;

      // YouTube tracks
      const ytTracks = ytResult.data?.tracks || [];

      // Filter TDZ tracks by genre
      const filteredTdz = (tdzResult.data || []).filter((t: any) => {
        const g = (t.genre || "").toLowerCase();
        return genreTerms.some(term => g.includes(term));
      });

      setTracks(ytTracks);
      setTdzTracks(filteredTdz);
      setLoading(false);
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [genre]);

  const handlePlay = (track: any, list: any[]) => {
    playTrack(
      { ...track, duration: track.duration || 0, file_path: track.file_path || "", play_count: track.play_count || 0 },
      list.map(t => ({ ...t, duration: t.duration || 0, file_path: t.file_path || "", play_count: t.play_count || 0 }))
    );
  };

  const handlePlayAll = () => {
    const allTracks = [...tdzTracks, ...tracks];
    if (allTracks.length === 0) return;
    handlePlay(allTracks[0], allTracks);
    toast.success(`Playing ${meta.label} playlist`);
  };

  const handleShuffle = () => {
    const allTracks = [...tdzTracks, ...tracks];
    if (allTracks.length === 0) return;
    const shuffled = [...allTracks].sort(() => Math.random() - 0.5);
    handlePlay(shuffled[0], shuffled);
    toast.success(`Shuffling ${meta.label}`);
  };

  const resolveArtwork = (track: any) => {
    if (track.thumbnail && track.thumbnail.startsWith("http")) return track.thumbnail;
    if (track.album_cover_path) {
      return supabase.storage.from(track.album_cover_bucket || "album-covers").getPublicUrl(track.album_cover_path).data.publicUrl;
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-1 font-body" style={{ fontSize: 12, color: "#00CFFF" }}>
        <ChevronLeft className="w-4 h-4" /> Back to Explore
      </button>

      {/* Genre header */}
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${meta.color}22, ${meta.color}08)`,
          border: `1px solid ${meta.color}30`,
          borderTop: `3px solid ${meta.color}`,
          borderRadius: "var(--radius-lg)",
          padding: "32px 24px",
        }}
      >
        <Music className="absolute top-4 right-4 h-20 w-20" style={{ color: `${meta.color}10` }} />
        <h1 className="font-display relative z-10" style={{ fontSize: 48, color: "var(--text-1)" }}>{meta.label}</h1>
        <p className="font-body relative z-10" style={{ fontSize: 13, color: "var(--text-3)", marginTop: 4 }}>
          Editorial playlist · {tracks.length + tdzTracks.length} tracks
        </p>
        <div className="flex gap-3 mt-5 relative z-10">
          <button
            onClick={handlePlayAll}
            className="flex items-center gap-2 px-6 py-2.5 font-body transition-all active:scale-95"
            style={{
              fontSize: 12, fontWeight: 700,
              background: meta.color, color: "#fff",
              borderRadius: "var(--radius-pill)",
            }}
          >
            <Play className="w-4 h-4" fill="currentColor" /> Play All
          </button>
          <button
            onClick={handleShuffle}
            className="flex items-center gap-2 px-6 py-2.5 font-body transition-all active:scale-95"
            style={{
              fontSize: 12, fontWeight: 700,
              background: "var(--glass-2)", color: "var(--text-1)",
              borderRadius: "var(--radius-pill)",
              border: "1px solid var(--glass-border)",
            }}
          >
            <Shuffle className="w-4 h-4" /> Shuffle
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: meta.color }} />
          <span className="font-body ml-3" style={{ fontSize: 13, color: "var(--text-3)" }}>Loading {meta.label} playlist…</span>
        </div>
      )}

      {/* TDZ Artist Releases */}
      {!loading && tdzTracks.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-display" style={{ fontSize: 18, color: meta.color }}>TDZ ARTISTS</h3>
          <div
            className="rounded-[var(--radius-md)] overflow-hidden"
            style={{ background: "var(--glass-1)", border: "1px solid var(--glass-border)", borderTop: `2px solid ${meta.color}` }}
          >
            {tdzTracks.map((track, i) => {
              const art = resolveArtwork(track);
              return (
                <div
                  key={track.id}
                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors hover:bg-white/[0.03]"
                  style={{ borderBottom: i < tdzTracks.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                  onClick={() => handlePlay(track, tdzTracks)}
                >
                  <span className="font-body w-7 text-center flex-shrink-0" style={{ fontSize: 12, fontWeight: 700, color: i < 3 ? meta.color : "var(--text-4)" }}>{i + 1}</span>
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "var(--glass-2)" }}>
                    {art ? <img src={art} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Music className="w-4 h-4" style={{ color: "var(--text-4)" }} /></div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-body truncate" style={{ fontSize: 13, fontWeight: 600, color: currentTrack?.id === track.id ? "#00CFFF" : "var(--text-1)" }}>{track.title}</p>
                    <p className="font-body truncate" style={{ fontSize: 11, color: "var(--text-3)" }}>{track.artist_name}</p>
                  </div>
                  <Play className="w-3.5 h-3.5 flex-shrink-0 opacity-40" style={{ color: "var(--text-2)" }} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* YouTube Music Editorial Tracks */}
      {!loading && tracks.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-display" style={{ fontSize: 18, color: "var(--text-2)" }}>EDITORIAL PLAYLIST</h3>
          <div
            className="rounded-[var(--radius-md)] overflow-hidden"
            style={{ background: "var(--glass-1)", border: "1px solid var(--glass-border)" }}
          >
            {tracks.map((track, i) => {
              const art = resolveArtwork(track);
              return (
                <div
                  key={track.id}
                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors hover:bg-white/[0.03]"
                  style={{ borderBottom: i < tracks.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                  onClick={() => handlePlay(track, tracks)}
                >
                  <span className="font-body w-7 text-center flex-shrink-0" style={{ fontSize: 12, fontWeight: 700, color: i < 3 ? meta.color : "var(--text-4)" }}>{i + 1}</span>
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "var(--glass-2)" }}>
                    {art ? <img src={art} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Music className="w-4 h-4" style={{ color: "var(--text-4)" }} /></div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-body truncate" style={{ fontSize: 13, fontWeight: 600, color: currentTrack?.id === track.id ? "#00CFFF" : "var(--text-1)" }}>{track.title}</p>
                    <p className="font-body truncate" style={{ fontSize: 11, color: "var(--text-3)" }}>{track.artist_name}</p>
                  </div>
                  <Play className="w-3.5 h-3.5 flex-shrink-0 opacity-40" style={{ color: "var(--text-2)" }} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && tracks.length === 0 && tdzTracks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Music className="w-10 h-10" style={{ color: "var(--text-4)" }} />
          <p className="font-body" style={{ fontSize: 13, color: "var(--text-3)" }}>No tracks found for {meta.label}</p>
        </div>
      )}
    </div>
  );
}
