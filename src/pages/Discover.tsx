import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { useDiscoveryData } from "@/hooks/useDiscoveryData";
import { MerchStore } from "@/components/MerchStore";
import { usePlayer } from "@/contexts/PlayerContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Play, Shuffle } from "lucide-react";

// Layout + nav
import { PersistentLayout } from "@/components/discovery/PersistentLayout";
import { CosmicTopBar } from "@/components/discovery/CosmicTopBar";

// Universal components
import { SongRow, SongListHeader } from "@/components/discovery/SongRow";
import { ArtistCard } from "@/components/discovery/ArtistCard";
import { AlbumCard } from "@/components/discovery/AlbumCard";
import { UniversalSearchResults } from "@/components/discovery/UniversalSearchResults";

// Existing functional components
import { UnifiedLibrary } from "@/components/discovery/UnifiedLibrary";
import { SpotifyPlaylistSection } from "@/components/discovery/SpotifyPlaylistSection";
import { UserPlaylistsSection } from "@/components/discovery/UserPlaylistsSection";
import { GenreTop50Section } from "@/components/discovery/GenreTop50Section";
import { EditorialPlaylistsSection } from "@/components/discovery/EditorialPlaylistsSection";
import { PlaylistManager } from "@/components/PlaylistManager";
import { MoodMixGenerator } from "@/components/discovery/MoodMixGenerator";
import { FanImpactCard } from "@/components/discovery/FanImpactCard";
import { CityTrendingSection } from "@/components/discovery/CityTrendingSection";

// Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Autoplay } from "swiper/modules";
// @ts-ignore
import "swiper/css";
// @ts-ignore
import "swiper/css/effect-coverflow";

// ── Section Header ──
function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h2 style={{
          fontFamily: "'Six Caps', sans-serif",
          fontSize: "clamp(28px, 4vw, 48px)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          lineHeight: 1,
          background: "linear-gradient(180deg, #FFFFFF 0%, #999999 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

// ── Genre Filter Pill ──
function GenrePill({ label, isSelected, onClick }: { label: string; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap"
      style={{
        fontFamily: "'Raleway', sans-serif",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        background: isSelected ? "rgba(0,207,255,0.12)" : "rgba(255,255,255,0.03)",
        border: isSelected ? "1px solid rgba(0,207,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(8px)",
        color: isSelected ? "#00CFFF" : "rgba(255,255,255,0.45)",
      }}
    >
      {label}
    </button>
  );
}

export default function Discover() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("discover");
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>(undefined);
  const [showSearch, setShowSearch] = useState(false);
  const [showTrending, setShowTrending] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState("PLAYLISTS");
  const [activeSlide, setActiveSlide] = useState(0);

  const { currentTrack, playTrack, addToQueue } = usePlayer();
  const {
    tracks, singles, artists, albums, playlists, likedTracks,
    followedArtists, loading, user, toggleLike, toggleFollow,
  } = useDiscoveryData();
  const { role } = useUserRole(user);
  const { hasFeature } = useSubscription(user);

  const filteredSingles = singles.filter((track) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (track.title ?? "").toLowerCase().includes(q) || (track.artist_name ?? "").toLowerCase().includes(q);
  });

  const genreFilteredSingles = selectedGenre
    ? filteredSingles.filter((t) => {
        const g = (t.genre ?? "").toLowerCase();
        const m = (t.mood ?? "").toLowerCase();
        const sel = selectedGenre.toLowerCase();
        return g.includes(sel) || m.includes(sel);
      })
    : filteredSingles;

  const handlePlayTrack = (track: any) => {
    const nt = { ...track, duration: track.duration || 0, file_path: track.file_path || '', play_count: track.play_count || 0 };
    playTrack(nt, genreFilteredSingles.map(t => ({ ...t, duration: t.duration || 0, file_path: t.file_path || '', play_count: t.play_count || 0 })));
  };

  const handleAddToQueue = (track: any) => {
    addToQueue({ ...track, duration: track.duration || 0, file_path: track.file_path || '', play_count: track.play_count || 0 });
    toast.success(`Added "${track.title}" to queue`);
  };

  const handleShuffleAll = () => {
    if (genreFilteredSingles.length > 0) {
      const normalized = genreFilteredSingles.map(t => ({ ...t, duration: t.duration || 0, file_path: t.file_path || '', play_count: t.play_count || 0 }));
      const shuffled = [...normalized].sort(() => Math.random() - 0.5);
      playTrack(shuffled[0], shuffled);
    }
  };

  // Build carousel data
  const tdzReleases = useMemo(() => {
    const r: Array<{ id: string; title: string; artist: string; image: string; genre: string; type: 'album' | 'track' }> = [];
    albums.filter(a => a.cover_art_path).forEach(album => {
      r.push({
        id: album.id, title: album.title, artist: album.artist_name,
        image: supabase.storage.from('album-covers').getPublicUrl(album.cover_art_path!).data.publicUrl,
        genre: album.genre || 'Music', type: 'album',
      });
    });
    // Also include singles with cover art
    if (r.length < 10) {
      singles.filter(t => t.album_cover_path).slice(0, 10 - r.length).forEach(track => {
        const bucket = track.album_cover_bucket || 'album-covers';
        r.push({
          id: track.id, title: track.title, artist: track.artist_name,
          image: supabase.storage.from(bucket).getPublicUrl(track.album_cover_path!).data.publicUrl,
          genre: track.genre || 'Music', type: 'track',
        });
      });
    }
    return r;
  }, [albums, singles]);

  const GENRES = ["Hip-Hop", "R&B", "Pop", "Electronic", "Rock", "Soul", "Latin", "Alternative"];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#050510" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#00CFFF", borderTopColor: "transparent" }} />
          <p style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Raleway', sans-serif", fontSize: 13 }}>Loading...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    try {
      switch (activeTab) {
        case 'discover':
          return (
            <div className="space-y-0">
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} />

              <div className="px-4 sm:px-6 lg:px-8">
                {/* Search results overlay */}
                {searchQuery.trim() && (
                  <div className="relative">
                    <UniversalSearchResults
                      query={searchQuery}
                      tracks={singles}
                      artists={artists}
                      albums={albums}
                      currentTrackId={currentTrack?.id}
                      likedTracks={Array.from(likedTracks)}
                      followedArtists={followedArtists}
                      onPlayTrack={handlePlayTrack}
                      onToggleLike={toggleLike}
                      onToggleFollow={toggleFollow}
                      onArtistClick={(a) => navigate(`/artist/${a.user_id}`)}
                      onAlbumClick={(a) => navigate(`/album/${a.id}`)}
                      onClose={() => setSearchQuery("")}
                    />
                  </div>
                )}

                {/* Fan Impact */}
                {user && (
                  <ErrorBoundary fallback={null}>
                    <div className="pt-6"><FanImpactCard userId={user.id} /></div>
                  </ErrorBoundary>
                )}

                {/* ── Hero: For You - 3D Coverflow Carousel ── */}
                {tdzReleases.length > 0 && (
                  <div className="py-8">
                    <SectionHeader title="For You" subtitle="Your personalized releases" />
                    <div className="flex items-end gap-8">
                      <div className="flex-1">
                        <Swiper
                          modules={[EffectCoverflow, Autoplay]}
                          effect="coverflow"
                          grabCursor
                          centeredSlides
                          slidesPerView="auto"
                          loop={tdzReleases.length > 3}
                          autoplay={{ delay: 4000, disableOnInteraction: true }}
                          coverflowEffect={{ rotate: 20, stretch: 10, depth: 200, modifier: 1.2, slideShadows: true }}
                          onSlideChange={(s) => setActiveSlide(s.realIndex)}
                          className="max-w-3xl"
                        >
                          {tdzReleases.map((release) => (
                            <SwiperSlide key={release.id} style={{ width: 240, height: 240 }}>
                              <div
                                className="w-full h-full rounded-2xl overflow-hidden cursor-pointer group relative"
                                style={{
                                  border: "1px solid rgba(255,255,255,0.08)",
                                  boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 60px rgba(0,207,255,0.08)",
                                }}
                                onClick={() => navigate(release.type === 'album' ? `/album/${release.id}` : `/track/${release.id}`)}
                              >
                                <img
                                  src={release.image}
                                  alt={release.title}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                                {/* Glassmorphic info overlay on hover */}
                                <div
                                  className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all duration-300"
                                  style={{
                                    background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)",
                                    backdropFilter: "blur(8px)",
                                  }}
                                >
                                  <p className="text-white text-sm font-bold truncate" style={{ fontFamily: "'Raleway', sans-serif" }}>{release.title}</p>
                                  <p className="text-white/50 text-xs truncate" style={{ fontFamily: "'Raleway', sans-serif" }}>{release.artist}</p>
                                </div>
                              </div>
                            </SwiperSlide>
                          ))}
                        </Swiper>
                      </div>
                      {/* Featured info panel */}
                      {tdzReleases[activeSlide] && (
                        <div className="hidden lg:block w-64">
                          <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 42, color: "#FFFFFF", letterSpacing: "0.03em", lineHeight: 1.1 }}>
                            {tdzReleases[activeSlide].artist}
                          </p>
                          <p className="mt-2" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 400, fontSize: 16, color: "rgba(255,255,255,0.6)" }}>
                            {tdzReleases[activeSlide].title}
                          </p>
                          <div className="flex gap-3 mt-5">
                            <button
                              onClick={() => {
                                const t = tracks.find(tr => tr.artist_name === tdzReleases[activeSlide].artist);
                                if (t) handlePlayTrack(t);
                              }}
                              className="px-6 py-2.5 rounded-full flex items-center gap-2 transition-all hover:scale-105"
                              style={{ background: "#FFFFFF", color: "#000", fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 13 }}
                            >
                              <Play className="w-4 h-4" fill="black" /> Play
                            </button>
                            <button
                              onClick={handleShuffleAll}
                              className="px-5 py-2.5 rounded-full flex items-center gap-2 transition-all hover:scale-105"
                              style={{
                                background: "rgba(255,255,255,0.06)",
                                backdropFilter: "blur(8px)",
                                border: "1px solid rgba(255,255,255,0.12)",
                                color: "#FFFFFF",
                                fontFamily: "'Raleway', sans-serif",
                                fontWeight: 600,
                                fontSize: 13,
                              }}
                            >
                              <Shuffle className="w-4 h-4" /> Shuffle
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Genre Filters ── */}
                <div className="py-6">
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <GenrePill label="All" isSelected={!selectedGenre} onClick={() => setSelectedGenre(undefined)} />
                    {GENRES.map((genre) => (
                      <GenrePill
                        key={genre}
                        label={genre}
                        isSelected={selectedGenre === genre}
                        onClick={() => setSelectedGenre(selectedGenre === genre ? undefined : genre)}
                      />
                    ))}
                  </div>
                </div>

                {/* ── Artist Portals ── */}
                <div className="py-6">
                  <SectionHeader title="Artist Portals" subtitle={`${artists.length} Artists`} />
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {artists.slice(0, 8).map((artist) => (
                      <ArtistCard
                        key={artist.user_id}
                        artist={artist}
                        isFollowing={followedArtists.has(artist.user_id)}
                        onToggleFollow={toggleFollow}
                        onClick={(a) => navigate(`/artist/${a.user_id}`)}
                      />
                    ))}
                  </div>
                </div>

                {/* ── New This Week (Singles with artwork) ── */}
                <div className="py-6">
                  <SectionHeader title="New This Week" subtitle="Fresh releases from TDZ artists" />
                  <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
                    {genreFilteredSingles.slice(0, 10).map((track) => {
                      const coverUrl = track.album_cover_path
                        ? supabase.storage.from(track.album_cover_bucket || 'album-covers').getPublicUrl(track.album_cover_path).data.publicUrl
                        : null;
                      return (
                        <AlbumCard
                          key={track.id}
                          album={{
                            ...track,
                            cover_art_path: track.album_cover_path,
                            image: coverUrl,
                          }}
                          onClick={() => navigate(`/track/${track.id}`)}
                          onPlay={() => handlePlayTrack(track)}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* ── TDZ Singles Track List ── */}
                <div className="py-6">
                  <SectionHeader title={selectedGenre ? `${selectedGenre} Singles` : "TDZ Singles"} />
                  {/* Glassmorphic container for track list */}
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      backdropFilter: "blur(16px)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      boxShadow: "0 4px 32px rgba(0,0,0,0.3)",
                    }}
                  >
                    <div className="p-2">
                      <SongListHeader />
                      {genreFilteredSingles.slice(0, 15).map((track, i) => (
                        <SongRow
                          key={track.id}
                          track={track}
                          index={i + 1}
                          isPlaying={currentTrack?.id === track.id}
                          isLiked={likedTracks.has(track.id)}
                          onPlay={handlePlayTrack}
                          onToggleLike={toggleLike}
                          onAddToQueue={handleAddToQueue}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── Editorial Picks ── */}
                <div className="py-6">
                  <SectionHeader title="Editorial Picks" />
                  <ErrorBoundary fallback={null}>
                    <EditorialPlaylistsSection />
                  </ErrorBoundary>
                </div>

                {/* ── Albums ── */}
                {albums.length > 0 && (
                  <div className="py-6">
                    <SectionHeader title="TDZ Albums" />
                    <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
                      {albums.map((album) => (
                        <AlbumCard
                          key={album.id}
                          album={{
                            ...album,
                            image: album.cover_art_path
                              ? supabase.storage.from('album-covers').getPublicUrl(album.cover_art_path).data.publicUrl
                              : null,
                          }}
                          onClick={() => navigate(`/album/${album.id}`)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Playlists */}
                <ErrorBoundary fallback={null}>
                  <div className="py-6">
                    <UserPlaylistsSection onPlaylistClick={(id) => navigate(`/playlist/${id}`)} onViewAll={() => setActiveTab('playlists')} />
                  </div>
                </ErrorBoundary>
              </div>
            </div>
          );

        case 'trending':
          return (
            <div className="space-y-0">
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
              <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                <div>
                  <h2 style={{
                    fontFamily: "'Six Caps', sans-serif",
                    fontSize: "clamp(40px, 5vw, 56px)",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    lineHeight: 1,
                    background: "linear-gradient(180deg, #FFFFFF 0%, #888888 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}>
                    EXPLORE TDZ
                  </h2>
                  <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 300, fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                    Stream independent artists worldwide. Every play pays.
                  </p>
                </div>

                {/* Category grid - Glassmorphic */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {["TRENDING NOW", "NEW RELEASES", "TOP CHARTS", "HIP-HOP", "R&B / SOUL", "ELECTRONIC", "POP", "ROCK", "LATIN"].map((cat, i) => (
                    <div
                      key={cat}
                      className="relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 group"
                      style={{
                        height: 180,
                        background: "rgba(255,255,255,0.03)",
                        backdropFilter: "blur(16px)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
                      }}
                      onClick={() => {
                        if (cat === "TRENDING NOW") setSelectedGenre(undefined);
                        else setSelectedGenre(cat.split(" / ")[0]);
                        setActiveTab("discover");
                      }}
                    >
                      <div className="absolute inset-0" style={{
                        background: [
                          "linear-gradient(135deg, rgba(0,207,255,0.08), rgba(139,92,246,0.06))",
                          "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(0,207,255,0.06))",
                          "linear-gradient(135deg, rgba(212,160,23,0.08), rgba(239,68,68,0.06))",
                          "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.06))",
                          "linear-gradient(135deg, rgba(236,72,153,0.08), rgba(139,92,246,0.06))",
                          "linear-gradient(135deg, rgba(0,207,255,0.1), rgba(34,197,94,0.06))",
                          "linear-gradient(135deg, rgba(249,115,22,0.08), rgba(234,179,8,0.06))",
                          "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(249,115,22,0.06))",
                          "linear-gradient(135deg, rgba(34,197,94,0.1), rgba(234,179,8,0.06))",
                        ][i],
                      }} />
                      {/* Glassmorphic glow on hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
                        style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08), 0 0 30px rgba(0,207,255,0.05)" }} />
                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <span style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 28, color: "#FFFFFF", letterSpacing: "0.04em" }}>{cat}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Charts */}
                <div className="grid lg:grid-cols-2 gap-8">
                  <div>
                    <ErrorBoundary fallback={null}><GenreTop50Section onViewAll={() => setActiveTab('library')} /></ErrorBoundary>
                  </div>
                  <div>
                    <SectionHeader title="Editorial Picks" />
                    <ErrorBoundary fallback={null}><EditorialPlaylistsSection /></ErrorBoundary>
                  </div>
                </div>

                {/* City Trending */}
                <ErrorBoundary fallback={null}>
                  <CityTrendingSection sectionNumber={0} onViewAllTrends={() => { setShowTrending(true); setActiveTab('library'); }} />
                </ErrorBoundary>
              </div>
            </div>
          );

        case 'library':
          return (
            <div className="space-y-0">
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
              <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                <SectionHeader title="Your Collection" subtitle="Global Library" />

                {/* Library filter pills - glassmorphic */}
                <div className="flex gap-2 flex-wrap">
                  {["PLAYLISTS", "ALBUMS", "ARTISTS", "SONGS", "DOWNLOADED", "RECENTLY ADDED"].map((tab) => (
                    <GenrePill key={tab} label={tab} isSelected={libraryFilter === tab} onClick={() => setLibraryFilter(tab)} />
                  ))}
                </div>

                {/* Albums grid - glassmorphic cards */}
                {(libraryFilter === "ALBUMS" || libraryFilter === "PLAYLISTS") && albums.length > 0 && (
                  <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
                    {albums.map((album) => (
                      <AlbumCard
                        key={album.id}
                        size="sm"
                        album={{
                          ...album,
                          image: album.cover_art_path
                            ? supabase.storage.from('album-covers').getPublicUrl(album.cover_art_path).data.publicUrl
                            : null,
                        }}
                        onClick={() => navigate(`/album/${album.id}`)}
                      />
                    ))}
                  </div>
                )}

                {/* Songs list */}
                {libraryFilter === "SONGS" && (
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      backdropFilter: "blur(16px)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div className="p-2">
                      <SongListHeader />
                      {genreFilteredSingles.map((track, i) => (
                        <SongRow
                          key={track.id}
                          track={track}
                          index={i + 1}
                          isPlaying={currentTrack?.id === track.id}
                          isLiked={likedTracks.has(track.id)}
                          onPlay={handlePlayTrack}
                          onToggleLike={toggleLike}
                          onAddToQueue={handleAddToQueue}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Artists grid */}
                {libraryFilter === "ARTISTS" && (
                  <div className="flex gap-4 flex-wrap">
                    {artists.map((artist) => (
                      <ArtistCard
                        key={artist.user_id}
                        artist={artist}
                        isFollowing={followedArtists.has(artist.user_id)}
                        onToggleFollow={toggleFollow}
                        onClick={(a) => navigate(`/artist/${a.user_id}`)}
                      />
                    ))}
                  </div>
                )}

                {/* Main library content */}
                <div className="grid lg:grid-cols-[1fr_280px] gap-6">
                  <div>
                    <ErrorBoundary fallback={null}><SpotifyPlaylistSection /></ErrorBoundary>
                    <ErrorBoundary fallback={<div style={{ color: "rgba(255,255,255,0.5)" }}>Library unavailable</div>}>
                      <UnifiedLibrary showTrending={showTrending} onPlayYouTube={(videoId, title, artist, thumbnail) => {
                        playTrack({ id: videoId, title, artist_name: artist, source: 'youtube', youtubeId: videoId, album_cover_path: thumbnail, duration: 0, file_path: '', play_count: 0 } as any);
                        if (showTrending) setShowTrending(false);
                      }} />
                    </ErrorBoundary>
                  </div>

                  {/* Smart Library Sidebar */}
                  <div className="hidden lg:block space-y-3">
                    <h3 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 800, fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                      SMART LIBRARY
                    </h3>
                    {[
                      { title: "Recommended Playlists for You", color: "#00CFFF" },
                      { title: "Albums by Your Favorite Artists", color: "#8B5CF6" },
                      { title: "New Releases from Artists You Follow", color: "#22C55E" },
                      { title: "Soundtracks of Your Journey", color: "#D4A017" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-white/[0.06]"
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(255,255,255,0.04)",
                        }}>
                        <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ background: `${item.color}15`, border: `1px solid ${item.color}20` }} />
                        <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 500, lineHeight: 1.4 }}>{item.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );

        case 'artists':
          return (
            <div className="space-y-0">
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
              <div className="px-4 sm:px-6 lg:px-8 py-6">
                <SectionHeader title="Artist Portals" subtitle={`${artists.length} Artists`} />
                <div className="flex gap-4 flex-wrap">
                  {artists.map((artist) => (
                    <ArtistCard
                      key={artist.user_id}
                      artist={artist}
                      isFollowing={followedArtists.has(artist.user_id)}
                      onToggleFollow={toggleFollow}
                      onClick={(a) => navigate(`/artist/${a.user_id}`)}
                    />
                  ))}
                </div>
              </div>
            </div>
          );

        case 'playlists':
          return (
            <div className="space-y-0">
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
              <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-8">
                <SectionHeader title="Your Library" subtitle="Playlists & Collections" />
                <ErrorBoundary fallback={null}>
                  <UserPlaylistsSection onPlaylistClick={(id) => navigate(`/playlist/${id}`)} />
                </ErrorBoundary>
                <ErrorBoundary fallback={null}>
                  <PlaylistManager userId={user?.id || null} onPlaylistSelect={(id) => navigate(`/playlist/${id}`)} />
                </ErrorBoundary>
              </div>
            </div>
          );

        case 'merch':
          return (
            <div className="space-y-0">
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
              <div className="px-4 sm:px-6 lg:px-8 py-6">
                <SectionHeader title="Merch Store" subtitle="Support your favorite artists" />
                <MerchStore variant="full" />
              </div>
            </div>
          );

        case 'ai-mix':
          return (
            <div className="space-y-0">
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
              <div className="px-4 sm:px-6 lg:px-8 py-6">
                <ErrorBoundary fallback={<div className="p-4">AI Mix unavailable</div>}>
                  <MoodMixGenerator />
                </ErrorBoundary>
              </div>
            </div>
          );

        default:
          return (
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <p style={{ color: "rgba(255,255,255,0.5)" }}>Select a tab</p>
            </div>
          );
      }
    } catch (error) {
      console.error('renderContent error:', error);
      return <div className="p-8">Something went wrong</div>;
    }
  };

  return (
    <PersistentLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      showSearch={showSearch}
      onToggleSearch={() => setShowSearch(!showSearch)}
    >
      {renderContent()}
    </PersistentLayout>
  );
}
