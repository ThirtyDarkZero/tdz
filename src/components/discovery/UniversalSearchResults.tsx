import { useState } from "react";
import { Search, X } from "lucide-react";
import { SongRow, SongListHeader } from "./SongRow";
import { ArtistCard } from "./ArtistCard";
import { AlbumCard } from "./AlbumCard";

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

const FILTER_TABS = ["ALL", "SONGS", "ARTISTS", "ALBUMS"] as const;

export function UniversalSearchResults({
  query, tracks, artists, albums,
  currentTrackId, likedTracks, followedArtists,
  onPlayTrack, onToggleLike, onToggleFollow,
  onArtistClick, onAlbumClick, onClose,
}: UniversalSearchResultsProps) {
  const [activeFilter, setActiveFilter] = useState<typeof FILTER_TABS[number]>("ALL");

  const q = query.trim().toLowerCase();
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

  const hasResults = filteredTracks.length > 0 || filteredArtists.length > 0 || filteredAlbums.length > 0;

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
      <div className="flex gap-2 px-5 pt-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className="px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all"
            style={{
              fontFamily: "'Raleway', sans-serif",
              letterSpacing: "0.08em",
              color: activeFilter === tab ? "#00CFFF" : "rgba(255,255,255,0.5)",
              background: activeFilter === tab ? "rgba(0,207,255,0.12)" : "transparent",
              border: activeFilter === tab ? "1px solid rgba(0,207,255,0.3)" : "1px solid transparent",
            }}
          >
            {tab}
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
          {/* Songs */}
          {(activeFilter === "ALL" || activeFilter === "SONGS") && filteredTracks.length > 0 && (
            <div>
              <h4 className="px-2 mb-2" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.18em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>SONGS</h4>
              <SongListHeader />
              {filteredTracks.map((track, i) => (
                <SongRow
                  key={track.id}
                  track={track}
                  index={i + 1}
                  isPlaying={currentTrackId === track.id}
                  isLiked={likedTracks.includes(track.id)}
                  onPlay={onPlayTrack}
                  onToggleLike={onToggleLike}
                />
              ))}
            </div>
          )}

          {/* Artists */}
          {(activeFilter === "ALL" || activeFilter === "ARTISTS") && filteredArtists.length > 0 && (
            <div>
              <h4 className="px-2 mb-3" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.18em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>ARTISTS</h4>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {filteredArtists.map((artist) => (
                  <ArtistCard
                    key={artist.user_id || artist.id}
                    artist={artist}
                    isFollowing={followedArtists.has(artist.user_id)}
                    onToggleFollow={onToggleFollow}
                    onClick={onArtistClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Albums */}
          {(activeFilter === "ALL" || activeFilter === "ALBUMS") && filteredAlbums.length > 0 && (
            <div>
              <h4 className="px-2 mb-3" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.18em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>ALBUMS</h4>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {filteredAlbums.map((album) => (
                  <AlbumCard key={album.id} album={album} onClick={onAlbumClick} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
