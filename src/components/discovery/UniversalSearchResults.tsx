import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Globe, Loader2, Music, Play, ExternalLink, ListPlus } from "lucide-react";
import { SongRow, SongListHeader } from "./SongRow";
import { ArtistCard } from "./ArtistCard";
import { AlbumCard } from "./AlbumCard";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer } from "@/contexts/PlayerContext";
import { toast } from "sonner";

interface UniversalSearchResultsProps {
  query: string;
  tracks: any[];
  artists: any[];
  albums: any[];
  currentTrackId?: string;
  likedTracks: string[];
  followedArtists: Set<string>;
  onPlayTrack: (track: any) => void;
  onToggleLike: (trackId: string) => void;
  onToggleFollow: (artistId: string) => void;
  onArtistClick: (artist: any) => void;
  onAlbumClick: (album: any) => void;
  onClose: () => void;
}

const FILTER_TABS = ["ALL", "SONGS", "ARTISTS", "ALBUMS", "GLOBAL"] as const;

export function UniversalSearchResults({
  query, tracks, artists, albums,
  currentTrackId, likedTracks, followedArtists,
  onPlayTrack, onToggleLike, onToggleFollow,
  onArtistClick, onAlbumClick, onClose,
}: UniversalSearchResultsProps) {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<typeof FILTER_TABS[number]>("ALL");
  const [globalResults, setGlobalResults] = useState<any[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [resolvingTrackId, setResolvingTrackId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const { playTrack } = usePlayer();

  const q = query.trim().toLowerCase();

  // Debounced global search
  useEffect(() => {
    if (q.length < 3) { setGlobalResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setGlobalLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("unified-music-search", {
          body: { query: q, limit: 12, sources: ["spotify", "musicbrainz"] },
        });
        if (!error && data?.results) {
          setGlobalResults(data.results.slice(0, 12));
        }
      } catch {
        // Silent
      } finally {
        setGlobalLoading(false);
      }
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q]);

  if (!q) return null;

  const filteredTracks = tracks.filter(t =>
    (t.title || "").toLowerCase().includes(q) || (t.artist_name || "").toLowerCase().includes(q)
  ).slice(0, activeFilter === "SONGS" ? 50 : 5);

  const filteredArtists = artists.filter(a =>
    (a.artist_name || "").toLowerCase().includes(q)
  ).slice(0, activeFilter === "ARTISTS" ? 50 : 6);

  const filteredAlbums = albums.filter(a =>
    (a.title || "").toLowerCase().includes(q) || (a.artist_name || "").toLowerCase().includes(q)
  ).slice(0, activeFilter === "ALBUMS" ? 50 : 6);

  const globalArtists = globalResults.filter(r => r.type === "artist");
  const globalTracks = globalResults.filter(r => r.type === "track");
  const globalAlbums = globalResults.filter(r => r.type === "album");

  const hasLocalResults = filteredTracks.length > 0 || filteredArtists.length > 0 || filteredAlbums.length > 0;
  const hasGlobalResults = globalResults.length > 0;
  const hasResults = hasLocalResults || hasGlobalResults || globalLoading;

  // Fix: Resolve YouTube ID before playing global tracks (fixes double-click bug)
  const handlePlayGlobal = async (item: any) => {
    const trackId = `global-${item.sourceId || item.id}`;
    
    // If already has a youtubeId, play immediately
    if (item.youtubeId) {
      const track = {
        id: trackId,
        title: item.title,
        artist_name: item.artist,
        thumbnail: item.thumbnail,
        youtubeId: item.youtubeId,
        source: 'youtube' as const,
        duration: 0,
        file_path: "",
        play_count: 0,
      };
      playTrack(track, [track]);
      onClose();
      return;
    }

    // Resolve YouTube ID first
    setResolvingTrackId(trackId);
    try {
      const { data } = await supabase.functions.invoke("youtube-search", {
        body: { query: `${item.artist} ${item.title} official audio`, maxResults: 1, officialOnly: true },
      });
      
      const videoId = data?.results?.[0]?.id;
      if (videoId) {
        const track = {
          id: trackId,
          title: item.title,
          artist_name: item.artist,
          thumbnail: data.results[0].thumbnail || item.thumbnail,
          youtubeId: videoId,
          source: 'youtube' as const,
          duration: 0,
          file_path: "",
          play_count: 0,
        };
        playTrack(track, [track]);
        onClose();
      } else {
        toast.error("Could not find this track on YouTube");
      }
    } catch {
      toast.error("Failed to resolve track");
    } finally {
      setResolvingTrackId(null);
    }
  };

  // Navigate to global artist profile
  const handleGlobalArtistClick = (artist: any) => {
    navigate(`/artist/global/${encodeURIComponent(artist.title)}`);
    onClose();
  };

  return (
    <div
      className="absolute top-full left-0 right-0 mt-2 overflow-hidden overflow-y-auto z-[300]"
      style={{
        background: "rgba(8,8,26,0.97)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 20,
        backdropFilter: "blur(40px)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
        maxHeight: "75vh",
      }}
    >
      {/* Filter tabs */}
      <div className="flex gap-2 px-5 pt-4 pb-3 overflow-x-auto scrollbar-hide" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className="px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5"
            style={{
              fontFamily: "'Raleway', sans-serif",
              letterSpacing: "0.08em",
              color: activeFilter === tab ? (tab === "GLOBAL" ? "#22C55E" : "#00CFFF") : "rgba(255,255,255,0.5)",
              background: activeFilter === tab ? (tab === "GLOBAL" ? "rgba(34,197,94,0.12)" : "rgba(0,207,255,0.12)") : "transparent",
              border: activeFilter === tab ? `1px solid ${tab === "GLOBAL" ? "rgba(34,197,94,0.3)" : "rgba(0,207,255,0.3)"}` : "1px solid transparent",
            }}
          >
            {tab === "GLOBAL" && <Globe className="h-3 w-3" />}
            {tab}
            {tab === "GLOBAL" && globalLoading && <Loader2 className="h-3 w-3 animate-spin" />}
          </button>
        ))}
      </div>

      {!hasResults ? (
        <div className="flex flex-col items-center py-16">
          <span className="text-4xl mb-4">🔭</span>
          <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: 16, color: "#FFFFFF" }}>No results found</p>
          <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>Try a different search or explore new releases</p>
        </div>
      ) : (
        <div className="p-4 space-y-6">
          {/* ── LOCAL: Songs ── */}
          {(activeFilter === "ALL" || activeFilter === "SONGS") && filteredTracks.length > 0 && (
            <div>
              <h4 className="px-2 mb-2" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.18em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>
                TDZ SONGS
              </h4>
              <SongListHeader />
              {filteredTracks.map((track, i) => (
                <SongRow key={track.id} track={track} index={i + 1} isPlaying={currentTrackId === track.id} isLiked={likedTracks.includes(track.id)} onPlay={onPlayTrack} onToggleLike={onToggleLike} />
              ))}
            </div>
          )}

          {/* ── LOCAL: Artists ── */}
          {(activeFilter === "ALL" || activeFilter === "ARTISTS") && filteredArtists.length > 0 && (
            <div>
              <h4 className="px-2 mb-3" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.18em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>TDZ ARTISTS</h4>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {filteredArtists.map((artist) => (
                  <ArtistCard key={artist.user_id || artist.id} artist={artist} isFollowing={followedArtists.has(artist.user_id)} onToggleFollow={onToggleFollow} onClick={onArtistClick} />
                ))}
              </div>
            </div>
          )}

          {/* ── LOCAL: Albums ── */}
          {(activeFilter === "ALL" || activeFilter === "ALBUMS") && filteredAlbums.length > 0 && (
            <div>
              <h4 className="px-2 mb-3" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.18em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>TDZ ALBUMS</h4>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {filteredAlbums.map((album) => (
                  <AlbumCard key={album.id} album={album} onClick={onAlbumClick} />
                ))}
              </div>
            </div>
          )}

          {/* ── GLOBAL RESULTS ── */}
          {(activeFilter === "ALL" || activeFilter === "GLOBAL") && (hasGlobalResults || globalLoading) && (
            <div>
              <div className="flex items-center gap-2 px-2 mb-3">
                <Globe className="h-3.5 w-3.5" style={{ color: "#22C55E" }} />
                <h4 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.18em", color: "#22C55E", textTransform: "uppercase" }}>
                  GLOBAL MUSIC LIBRARY
                </h4>
                {globalLoading && <Loader2 className="h-3 w-3 animate-spin" style={{ color: "#22C55E" }} />}
              </div>

              {globalLoading && globalResults.length === 0 && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" style={{ color: "#22C55E" }} />
                  <span className="font-body text-sm" style={{ color: "var(--text-3)" }}>Searching global catalog...</span>
                </div>
              )}

              {/* Global Artists */}
              {globalArtists.length > 0 && (
                <div className="mb-4">
                  <p className="px-2 mb-2 font-body" style={{ fontSize: 10, fontWeight: 600, color: "var(--text-4)", letterSpacing: "0.1em" }}>ARTISTS</p>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {globalArtists.map((artist) => (
                      <div
                        key={artist.id}
                        className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0 transition-transform hover:scale-105"
                        style={{ width: 90 }}
                        onClick={() => handleGlobalArtistClick(artist)}
                      >
                        <div className="w-16 h-16 rounded-full overflow-hidden" style={{ background: "var(--glass-2)" }}>
                          {artist.thumbnail ? (
                            <img src={artist.thumbnail} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Music className="h-5 w-5" style={{ color: "var(--text-4)" }} /></div>
                          )}
                        </div>
                        <span className="font-body text-center truncate w-full" style={{ fontSize: 10, fontWeight: 600, color: "var(--text-2)" }}>{artist.title}</span>
                        <span className="font-body" style={{ fontSize: 8, color: "#22C55E", textTransform: "uppercase" }}>{artist.source}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Global Tracks */}
              {globalTracks.length > 0 && (
                <div className="mb-4">
                  <p className="px-2 mb-2 font-body" style={{ fontSize: 10, fontWeight: 600, color: "var(--text-4)", letterSpacing: "0.1em" }}>SONGS</p>
                  <div className="space-y-0.5">
                    {globalTracks.map((track) => {
                      const trackId = `global-${track.sourceId || track.id}`;
                      const isResolving = resolvingTrackId === trackId;
                      return (
                        <div
                          key={track.id}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors"
                          style={{ background: "rgba(255,255,255,0.02)" }}
                          onClick={() => !isResolving && handlePlayGlobal(track)}
                        >
                          <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "var(--glass-2)" }}>
                            {track.thumbnail ? (
                              <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Music className="h-3 w-3" style={{ color: "var(--text-4)" }} /></div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-body truncate" style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>{track.title}</p>
                            <p className="font-body truncate" style={{ fontSize: 10, color: "var(--text-3)" }}>{track.artist}</p>
                          </div>
                          <span className="font-body flex-shrink-0 px-1.5 py-0.5 rounded" style={{ fontSize: 8, fontWeight: 700, color: "#22C55E", background: "rgba(34,197,94,0.1)", textTransform: "uppercase" }}>{track.source}</span>
                          {isResolving ? (
                            <Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin" style={{ color: "#22C55E" }} />
                          ) : (
                            <Play className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--text-3)" }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Global Albums */}
              {globalAlbums.length > 0 && (
                <div>
                  <p className="px-2 mb-2 font-body" style={{ fontSize: 10, fontWeight: 600, color: "var(--text-4)", letterSpacing: "0.1em" }}>ALBUMS</p>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {globalAlbums.map((album) => (
                      <div
                        key={album.id}
                        className="flex-shrink-0 cursor-pointer transition-transform hover:scale-105"
                        style={{ width: 110 }}
                        onClick={() => onAlbumClick({ id: album.sourceId, title: album.title, artist_name: album.artist, source: album.source })}
                      >
                        <div className="w-full aspect-square rounded-lg overflow-hidden mb-1.5" style={{ background: "var(--glass-2)" }}>
                          {album.thumbnail ? (
                            <img src={album.thumbnail} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Music className="h-6 w-6" style={{ color: "var(--text-4)" }} /></div>
                          )}
                        </div>
                        <p className="font-body truncate" style={{ fontSize: 11, fontWeight: 600, color: "var(--text-1)" }}>{album.title}</p>
                        <p className="font-body truncate" style={{ fontSize: 9, color: "var(--text-3)" }}>{album.artist} · {album.year || ""}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
