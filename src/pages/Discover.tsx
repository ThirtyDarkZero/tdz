import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { useDiscoveryData } from "@/hooks/useDiscoveryData";
import { MerchStore } from "@/components/MerchStore";
import { usePlayer } from "@/contexts/PlayerContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Cosmic components
import { PersistentLayout } from "@/components/discovery/PersistentLayout";
import { PremiumHero } from "@/components/discovery/PremiumHero";
import { Premium3DCarousel } from "@/components/discovery/Premium3DCarousel";
import { CosmicNav } from "@/components/discovery/CosmicNav";
import { CosmicSectionHeader } from "@/components/discovery/CosmicSectionHeader";
import { CosmicTopBar } from "@/components/discovery/CosmicTopBar";

import { PremiumTrackList } from "@/components/discovery/PremiumTrackList";
import { MinimalArtistGrid } from "@/components/discovery/MinimalArtistGrid";
import { MinimalAlbumGrid } from "@/components/discovery/MinimalAlbumGrid";
import { MinimalTrackList } from "@/components/discovery/MinimalTrackList";
import { UnifiedLibrary } from "@/components/discovery/UnifiedLibrary";
import { CityTrendingSection } from "@/components/discovery/CityTrendingSection";
import { SpotifyPlaylistSection } from "@/components/discovery/SpotifyPlaylistSection";
import { UserPlaylistsSection } from "@/components/discovery/UserPlaylistsSection";
import { GenreTop50Section } from "@/components/discovery/GenreTop50Section";
import { EditorialPlaylistsSection } from "@/components/discovery/EditorialPlaylistsSection";
import { PlaylistManager } from "@/components/PlaylistManager";
import { MoodMixGenerator } from "@/components/discovery/MoodMixGenerator";
import { FanImpactCard } from "@/components/discovery/FanImpactCard";
import { ArtistStoryCard } from "@/components/discovery/ArtistStoryCard";
import { ListenTogetherBanner } from "@/components/discovery/ListenTogetherBanner";

export default function Discover() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("discover");
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>(undefined);
  const [showSearch, setShowSearch] = useState(false);
  const [showTrending, setShowTrending] = useState(false);
  const [cosmicCategory, setCosmicCategory] = useState("moodscapes");

  const { currentTrack, playTrack, addToQueue } = usePlayer();

  const {
    tracks, singles, artists, albums, playlists, likedTracks,
    followedArtists, loading, user, toggleLike, toggleFollow,
  } = useDiscoveryData();

  const { role } = useUserRole(user);
  const { hasFeature } = useSubscription(user);
  const isArtist = role === "artist" || role === "verified_artist" || role === "manager";
  const canCreatePlaylists = isArtist || hasFeature("playlists");

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.debug("[Discover] state", { activeTab, searchQuery, selectedGenre, loading, tracks: tracks.length, albums: albums.length, userId: user?.id ?? null });
  }, [activeTab, searchQuery, selectedGenre, loading, tracks.length, albums.length, user?.id]);

  // Filter singles by search
  const filteredSingles = singles.filter((track) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const title = (track.title ?? "").toString().toLowerCase();
    const artist = (track.artist_name ?? "").toString().toLowerCase();
    return title.includes(q) || artist.includes(q);
  });

  // Filter by selected genre
  const genreFilteredSingles = selectedGenre
    ? filteredSingles.filter((t) => {
        const g = (t.genre ?? "").toString().toLowerCase();
        const m = (t.mood ?? "").toString().toLowerCase();
        const sel = selectedGenre.toLowerCase();
        return g.includes(sel) || m.includes(sel);
      })
    : filteredSingles;

  const handlePlayTrack = (track: any) => {
    const normalizedTrack = { ...track, duration: track.duration || 0, file_path: track.file_path || '', play_count: track.play_count || 0 };
    playTrack(normalizedTrack, genreFilteredSingles.map(t => ({ ...t, duration: t.duration || 0, file_path: t.file_path || '', play_count: t.play_count || 0 })));
  };

  const handleAddToQueue = (track: any) => {
    const normalizedTrack = { ...track, duration: track.duration || 0, file_path: track.file_path || '', play_count: track.play_count || 0 };
    addToQueue(normalizedTrack);
    toast.success(`Added "${track.title}" to queue`);
  };

  const handleGenreSelect = (genreId: string) => {
    setSelectedGenre(genreId === selectedGenre ? undefined : genreId);
  };

  // Generate TDZ release data for 3D carousel
  const tdzReleases = useMemo(() => {
    const releasesWithCovers: Array<{ id: string; title: string; artist: string; image: string; genre: string }> = [];
    albums.filter(a => a.cover_art_path).forEach(album => {
      releasesWithCovers.push({
        id: album.id, title: album.title, artist: album.artist_name,
        image: supabase.storage.from('album-covers').getPublicUrl(album.cover_art_path!).data.publicUrl,
        genre: album.genre || 'Pop',
      });
    });
    if (releasesWithCovers.length < 8) {
      tracks.filter(t => t.album_cover_path).slice(0, 8 - releasesWithCovers.length).forEach(track => {
        releasesWithCovers.push({
          id: track.id, title: track.title, artist: track.artist_name,
          image: track.album_cover_bucket
            ? supabase.storage.from(track.album_cover_bucket).getPublicUrl(track.album_cover_path!).data.publicUrl
            : supabase.storage.from('album-covers').getPublicUrl(track.album_cover_path!).data.publicUrl,
          genre: track.genre || 'Pop',
        });
      });
    }
    return releasesWithCovers;
  }, [albums, tracks]);

  const handlePlayPlaylist = (name: string, playlistTracks: any[]) => {
    if (playlistTracks.length > 0) {
      const normalizedTracks = playlistTracks.map(t => ({ ...t, duration: t.duration || 0, file_path: t.file_path || '', play_count: t.play_count || 0 }));
      playTrack(normalizedTracks[0], normalizedTracks);
      toast.success(`Now playing: ${name}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#030308" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#00CFFF", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "#888", fontFamily: "'Raleway', sans-serif" }}>Loading...</p>
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
              {/* Cosmic Top Bar */}
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} />

              {/* Fan Impact Card for logged-in users */}
              {user && (
                <ErrorBoundary fallback={null}>
                  <div className="pt-6"><FanImpactCard userId={user.id} /></div>
                </ErrorBoundary>
              )}

              {/* Mood Mix Prompt */}
              <ErrorBoundary fallback={null}>
                <div className="px-4 sm:px-6 lg:px-8 py-4">
                  <div onClick={() => setActiveTab('ai-mix')} className="cursor-pointer rounded-2xl p-5 transition-all hover:-translate-y-0.5"
                    style={{ background: "linear-gradient(135deg, rgba(0,207,255,0.06) 0%, rgba(139,92,246,0.06) 100%)", border: "1px solid rgba(0,207,255,0.12)" }}>
                    <p className="text-white font-bold text-sm">🎵 How are you feeling?</p>
                    <p className="text-xs mt-1" style={{ color: "#888" }}>Generate an AI-powered mood mix tailored to your vibe</p>
                  </div>
                </div>
              </ErrorBoundary>

              {/* Listen Together Banner */}
              {user && <ErrorBoundary fallback={null}><ListenTogetherBanner /></ErrorBoundary>}

              {/* Hero Section */}
              <ErrorBoundary fallback={<div className="h-[300px] sm:h-[400px]" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(0,207,255,0.1))" }} />}>
                <PremiumHero tracks={genreFilteredSingles} />
              </ErrorBoundary>

              {/* TDZ Releases 3D Carousel */}
              {tdzReleases.length > 0 && (
                <ErrorBoundary fallback={null}>
                  <Premium3DCarousel
                    sectionNumber={0} title="Top TDZ Releases" subtitle={`${tdzReleases.length} Releases`}
                    albums={tdzReleases}
                    activeCategory={selectedGenre || 'all'}
                    categories={[{ id: 'all', name: 'All' }, { id: 'pop', name: 'Pop' }, { id: 'hip-hop', name: 'Hip-Hop' }, { id: 'r-b', name: 'R&B' }, { id: 'electronic', name: 'Electronic' }]}
                    onCategoryChange={handleGenreSelect}
                    onAlbumClick={(album) => {
                      const isAlbum = albums.some(a => a.id === album.id);
                      navigate(isAlbum ? `/album/${album.id}` : `/track/${album.id}`);
                    }}
                    onPlayAlbum={(album) => {
                      const albumTracks = tracks.filter((t) => t.artist_name === album.artist || (t.genre ?? "").toLowerCase().includes(album.genre.toLowerCase()));
                      if (albumTracks.length > 0) handlePlayTrack(albumTracks[0]);
                    }}
                  />
                </ErrorBoundary>
              )}

              {/* Cosmic Orbital Navigation */}
              <ErrorBoundary fallback={null}>
                <CosmicNav activeCategory={cosmicCategory} onCategoryChange={setCosmicCategory} />
              </ErrorBoundary>

              {/* New TDZ Singles */}
              <ErrorBoundary fallback={null}>
                <CosmicSectionHeader title="New Galaxies This Week" subtitle="Fresh singles from TDZ artists" />
                <PremiumTrackList
                  sectionNumber={0} title={selectedGenre ? `${selectedGenre} Singles` : "New TDZ Singles"}
                  subtitle="Fresh singles from TDZ artists" tracks={genreFilteredSingles}
                  currentTrackId={currentTrack?.id} likedTracks={Array.from(likedTracks)}
                  onPlayTrack={handlePlayTrack} onToggleLike={toggleLike} onAddToQueue={handleAddToQueue} maxTracks={10}
                />
              </ErrorBoundary>

              {/* Artist Story Cards - "Editorial Constellations" */}
              {artists.filter(a => a.bio).length > 0 && (
                <ErrorBoundary fallback={null}>
                  <div className="px-4 sm:px-6 lg:px-8 py-6">
                    <CosmicSectionHeader title="Editorial Constellations" subtitle="Stories from the artists" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {artists.filter(a => a.bio).slice(0, 3).map(a => (
                        <ArtistStoryCard key={a.user_id} artist={a} />
                      ))}
                    </div>
                  </div>
                </ErrorBoundary>
              )}

              {/* Artist Portals */}
              <ErrorBoundary fallback={null}>
                <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                  <CosmicSectionHeader title="Artist Portals" subtitle={`${artists.length} Artists`} />
                  <MinimalArtistGrid artists={artists.slice(0, 8)} followedArtists={followedArtists} onToggleFollow={toggleFollow} />
                </div>
              </ErrorBoundary>

              {/* Playlists */}
              <ErrorBoundary fallback={null}>
                <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                  <UserPlaylistsSection onPlaylistClick={(id) => navigate(`/playlist/${id}`)} onViewAll={() => setActiveTab('playlists')} />
                </div>
              </ErrorBoundary>

              {/* Albums - Cosmic Collection */}
              {albums.length > 0 && (
                <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                  <ErrorBoundary fallback={null}>
                    <MinimalAlbumGrid albums={albums} title="TDZ Albums" />
                  </ErrorBoundary>
                </div>
              )}
            </div>
          );

        case 'trending':
          return (
            <div className="space-y-0">
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
              <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
                <CosmicSectionHeader title="Explore" subtitle="Trending across the cosmos" />

                {/* 3D Carousel for explore */}
                {tdzReleases.length > 0 && (
                  <ErrorBoundary fallback={null}>
                    <Premium3DCarousel
                      sectionNumber={0} title="" albums={tdzReleases}
                      activeCategory={selectedGenre || 'all'}
                      categories={[{ id: 'all', name: 'All' }, { id: 'pop', name: 'Pop' }, { id: 'hip-hop', name: 'Hip-Hop' }]}
                      onCategoryChange={handleGenreSelect}
                      onAlbumClick={(album) => {
                        const isAlbum = albums.some(a => a.id === album.id);
                        navigate(isAlbum ? `/album/${album.id}` : `/track/${album.id}`);
                      }}
                      onPlayAlbum={(album) => {
                        const albumTracks = tracks.filter((t) => t.artist_name === album.artist);
                        if (albumTracks.length > 0) handlePlayTrack(albumTracks[0]);
                      }}
                    />
                  </ErrorBoundary>
                )}

                {/* New Galaxies This Week + Editorial Constellations side by side */}
                <div className="grid lg:grid-cols-2 gap-8">
                  <div>
                    <CosmicSectionHeader title="New Galaxies This Week" />
                    <ErrorBoundary fallback={null}>
                      <GenreTop50Section onViewAll={() => setActiveTab('library')} />
                    </ErrorBoundary>
                  </div>
                  <div>
                    <CosmicSectionHeader title="Editorial Constellations" />
                    <ErrorBoundary fallback={null}>
                      <EditorialPlaylistsSection />
                    </ErrorBoundary>
                  </div>
                </div>

                {/* Cosmic Orbital Nav */}
                <CosmicNav activeCategory={cosmicCategory} onCategoryChange={setCosmicCategory} />

                {/* City Trending */}
                <ErrorBoundary fallback={null}>
                  <CityTrendingSection sectionNumber={0} onViewAllTrends={() => { setShowTrending(true); setActiveTab('library'); }} />
                </ErrorBoundary>

                {/* Artist Portals */}
                <ErrorBoundary fallback={null}>
                  <CosmicSectionHeader title="Artist Portals" />
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                    {artists.slice(0, 5).map((artist) => (
                      <div key={artist.user_id} className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => navigate(`/artist/${artist.user_id}`)}>
                        <div className="w-16 h-16 rounded-full overflow-hidden" style={{
                          border: "1px solid rgba(0,207,255,0.2)",
                          boxShadow: "0 0 15px rgba(139,92,246,0.15)",
                        }}>
                          {artist.profile_image_path ? (
                            <img src={supabase.storage.from('artist-profiles').getPublicUrl(artist.profile_image_path).data.publicUrl} alt={artist.artist_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(0,207,255,0.3), rgba(139,92,246,0.3))" }}>
                              <span className="text-lg font-bold text-white/60">{artist.artist_name.charAt(0)}</span>
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-center truncate w-full" style={{ color: "#aaa", fontFamily: "'Raleway', sans-serif" }}>{artist.artist_name}</span>
                      </div>
                    ))}
                  </div>
                </ErrorBoundary>
              </div>
            </div>
          );

        case 'artists':
          return (
            <div className="space-y-0">
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
              <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                <CosmicSectionHeader title="Artist Portals" subtitle={`${artists.length} Artists`} />
                <MinimalArtistGrid artists={artists} followedArtists={followedArtists} onToggleFollow={toggleFollow} />
              </div>
            </div>
          );

        case 'playlists':
          return (
            <div className="space-y-0">
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
              <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
                <CosmicSectionHeader title="Your Library" subtitle="Playlists & Collections" />
                <ErrorBoundary fallback={null}>
                  <UserPlaylistsSection onPlaylistClick={(id) => navigate(`/playlist/${id}`)} />
                </ErrorBoundary>
                <ErrorBoundary fallback={null}>
                  <div className="mt-6 sm:mt-8">
                    <PlaylistManager userId={user?.id || null} onPlaylistSelect={(id) => navigate(`/playlist/${id}`)} />
                  </div>
                </ErrorBoundary>
              </div>
            </div>
          );

        case 'merch':
          return (
            <div className="space-y-0">
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
              <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                <CosmicSectionHeader title="Merch Store" subtitle="Support your favorite artists" />
                <MerchStore variant="full" />
              </div>
            </div>
          );

        case 'library':
          return (
            <div className="space-y-0">
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
              <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
                <CosmicSectionHeader title="Your Cosmic Collection" subtitle="Global Library" />
                
                {/* Library filter tabs */}
                <div className="flex gap-2 flex-wrap">
                  {["PLAYLISTS", "ALBUMS", "ARTISTS", "SONGS", "DOWNLOADED", "RECENTLY ADDED"].map((tab, i) => (
                    <button key={tab} className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all"
                      style={{
                        fontFamily: "'Raleway', sans-serif",
                        background: i === 0 ? "rgba(0,207,255,0.15)" : "rgba(139,92,246,0.06)",
                        border: i === 0 ? "1px solid rgba(0,207,255,0.3)" : "1px solid rgba(139,92,246,0.1)",
                        color: i === 0 ? "#00CFFF" : "#888",
                        letterSpacing: "0.12em",
                      }}>
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Albums as hexagonal grid */}
                {albums.length > 0 && (
                  <ErrorBoundary fallback={null}>
                    <MinimalAlbumGrid albums={albums} title="" />
                  </ErrorBoundary>
                )}

                {/* Smart Library sidebar-style section */}
                <div className="grid lg:grid-cols-[1fr_280px] gap-6">
                  <div>
                    {/* Spotify Featured */}
                    <ErrorBoundary fallback={null}><SpotifyPlaylistSection /></ErrorBoundary>
                    {/* Unified Library */}
                    <ErrorBoundary fallback={<div style={{ color: "#888" }}>Library unavailable</div>}>
                      <UnifiedLibrary showTrending={showTrending} onPlayYouTube={(videoId, title, artist, thumbnail) => {
                        playTrack({ id: videoId, title, artist_name: artist, source: 'youtube', youtubeId: videoId, album_cover_path: thumbnail, duration: 0, file_path: '', play_count: 0 } as any);
                        if (showTrending) setShowTrending(false);
                      }} />
                    </ErrorBoundary>
                  </div>
                  
                  {/* Smart Library Sidebar */}
                  <div className="hidden lg:block space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider" style={{ fontFamily: "'Raleway', sans-serif", color: "#fff", letterSpacing: "0.15em" }}>SMART LIBRARY</h3>
                    {[
                      { title: "Recommended Playlists for You", color: "#00CFFF" },
                      { title: "Albums by Your Favorite Artists", color: "#8B5CF6" },
                      { title: "New Releases This Week", color: "#22C55E" },
                      { title: "Soundtracks of Your Journeys", color: "#D4A017" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.02]"
                        style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.1)" }}>
                        <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ background: `${item.color}20` }} />
                        <span className="text-xs font-medium" style={{ color: "#ccc", fontFamily: "'Raleway', sans-serif" }}>{item.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );

        case 'ai-mix':
          return (
            <div className="space-y-0">
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
              <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                <ErrorBoundary fallback={<div className="p-4">AI Mix unavailable</div>}>
                  <MoodMixGenerator />
                </ErrorBoundary>
              </div>
            </div>
          );

        default:
          return (
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <p style={{ color: "#888" }}>Select a tab</p>
            </div>
          );
      }
    } catch (error) {
      console.error('renderContent error:', error);
      return <div className="p-4 sm:p-8">Something went wrong</div>;
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
