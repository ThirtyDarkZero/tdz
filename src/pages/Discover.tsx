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

// Premium components - BPM Supreme style
import { PersistentLayout } from "@/components/discovery/PersistentLayout";
import { PremiumHero } from "@/components/discovery/PremiumHero";
import { Premium3DCarousel } from "@/components/discovery/Premium3DCarousel";

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

  const { currentTrack, playTrack, addToQueue } = usePlayer();

  const {
    tracks,
    singles,
    artists,
    albums,
    playlists,
    likedTracks,
    followedArtists,
    loading,
    user,
    toggleLike,
    toggleFollow,
  } = useDiscoveryData();

  const { role } = useUserRole(user);
  const { hasFeature } = useSubscription(user);
  const isArtist = role === "artist" || role === "verified_artist" || role === "manager";
  const canCreatePlaylists = isArtist || hasFeature("playlists");

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.debug("[Discover] state", {
      activeTab,
      searchQuery,
      selectedGenre,
      loading,
      tracks: tracks.length,
      albums: albums.length,
      userId: user?.id ?? null,
    });
  }, [activeTab, searchQuery, selectedGenre, loading, tracks.length, albums.length, user?.id]);

  // Filter singles by search (safe against null/undefined fields)
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
    const normalizedTrack = {
      ...track,
      duration: track.duration || 0,
      file_path: track.file_path || '',
      play_count: track.play_count || 0,
    };
    playTrack(
      normalizedTrack,
      genreFilteredSingles.map(t => ({
        ...t,
        duration: t.duration || 0,
        file_path: t.file_path || '',
        play_count: t.play_count || 0,
      }))
    );
  };

  const handleAddToQueue = (track: any) => {
    const normalizedTrack = {
      ...track,
      duration: track.duration || 0,
      file_path: track.file_path || '',
      play_count: track.play_count || 0,
    };
    addToQueue(normalizedTrack);
    toast.success(`Added "${track.title}" to queue`);
  };

  const handleGenreSelect = (genreId: string) => {
    setSelectedGenre(genreId === selectedGenre ? undefined : genreId);
  };

  // Generate TDZ release data for 3D carousel - prioritize tracks with cover art
  const tdzReleases = useMemo(() => {
    // Combine albums and tracks with cover art for carousel
    const releasesWithCovers: Array<{
      id: string;
      title: string;
      artist: string;
      image: string;
      genre: string;
    }> = [];
    
    // Add albums first
    albums.filter(a => a.cover_art_path).forEach(album => {
      releasesWithCovers.push({
        id: album.id,
        title: album.title,
        artist: album.artist_name,
        image: supabase.storage.from('album-covers').getPublicUrl(album.cover_art_path!).data.publicUrl,
        genre: album.genre || 'Pop',
      });
    });
    
    // Add tracks with album covers if we need more
    if (releasesWithCovers.length < 8) {
      tracks.filter(t => t.album_cover_path).slice(0, 8 - releasesWithCovers.length).forEach(track => {
        releasesWithCovers.push({
          id: track.id,
          title: track.title,
          artist: track.artist_name,
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
      const normalizedTracks = playlistTracks.map(t => ({
        ...t,
        duration: t.duration || 0,
        file_path: t.file_path || '',
        play_count: t.play_count || 0,
      }));
      playTrack(normalizedTracks[0], normalizedTracks);
      toast.success(`Now playing: ${name}`);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Render content based on active tab
  const renderContent = () => {
    try {
      switch (activeTab) {
        case 'discover':
          // Main TDZ Releases page - focused on native content
          return (
            <div className="space-y-0">
              {/* Fan Impact Card for logged-in users */}
              {user && (
                <ErrorBoundary fallback={null}>
                  <div className="pt-6">
                    <FanImpactCard userId={user.id} />
                  </div>
                </ErrorBoundary>
              )}

              {/* Mood Mix Prompt */}
              <ErrorBoundary fallback={null}>
                <div className="px-4 sm:px-6 lg:px-8 py-4">
                  <div
                    onClick={() => setActiveTab('ai-mix')}
                    className="cursor-pointer rounded-2xl p-5 transition-all hover:-translate-y-0.5"
                    style={{
                      background: "linear-gradient(135deg, rgba(0,207,255,0.06) 0%, rgba(139,92,246,0.06) 100%)",
                      border: "1px solid rgba(0,207,255,0.12)",
                    }}
                  >
                    <p className="text-white font-bold text-sm">🎵 How are you feeling?</p>
                    <p className="text-xs mt-1" style={{ color: "#888" }}>Generate an AI-powered mood mix tailored to your vibe</p>
                  </div>
                </div>
              </ErrorBoundary>

              {/* Listen Together Banner */}
              {user && (
                <ErrorBoundary fallback={null}>
                  <ListenTogetherBanner />
                </ErrorBoundary>
              )}

              {/* Hero Section */}
              <ErrorBoundary fallback={<div className="h-[300px] sm:h-[400px] bg-gradient-to-br from-primary/10 to-secondary/10" />}>
                <PremiumHero tracks={genreFilteredSingles} />
              </ErrorBoundary>

              {/* TDZ Releases Carousel */}
              {tdzReleases.length > 0 && (
                <ErrorBoundary fallback={null}>
                  <Premium3DCarousel
                    sectionNumber={0}
                    title="Top TDZ Releases"
                    subtitle={`${tdzReleases.length} Releases`}
                    albums={tdzReleases}
                    activeCategory={selectedGenre || 'all'}
                    categories={[
                      { id: 'all', name: 'All' },
                      { id: 'pop', name: 'Pop' },
                      { id: 'hip-hop', name: 'Hip-Hop' },
                      { id: 'r-b', name: 'R&B' },
                      { id: 'electronic', name: 'Electronic' },
                    ]}
                    onCategoryChange={handleGenreSelect}
                    onAlbumClick={(album) => {
                      // Check if it's an album or track
                      const isAlbum = albums.some(a => a.id === album.id);
                      if (isAlbum) {
                        navigate(`/album/${album.id}`);
                      } else {
                        navigate(`/track/${album.id}`);
                      }
                    }}
                    onPlayAlbum={(album) => {
                      const albumTracks = tracks.filter((t) =>
                        t.artist_name === album.artist ||
                        (t.genre ?? "").toLowerCase().includes(album.genre.toLowerCase())
                      );
                      if (albumTracks.length > 0) {
                        handlePlayTrack(albumTracks[0]);
                      }
                    }}
                  />
                </ErrorBoundary>
              )}

              {/* New TDZ Releases Track List */}
              <ErrorBoundary fallback={null}>
                <PremiumTrackList
                  sectionNumber={0}
                  title={selectedGenre ? `${selectedGenre} Singles` : "New TDZ Singles"}
                  subtitle="Fresh singles from TDZ artists"
                  tracks={genreFilteredSingles}
                  currentTrackId={currentTrack?.id}
                  likedTracks={Array.from(likedTracks)}
                  onPlayTrack={handlePlayTrack}
                  onToggleLike={toggleLike}
                  onAddToQueue={handleAddToQueue}
                  maxTracks={10}
                />
              </ErrorBoundary>

              {/* Artist Story Cards */}
              {artists.filter(a => a.bio).length > 0 && (
                <ErrorBoundary fallback={null}>
                  <div className="px-4 sm:px-6 lg:px-8 py-6">
                    <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 32, letterSpacing: "0.04em" }}>
                      ARTIST STORIES
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {artists.filter(a => a.bio).slice(0, 3).map(a => (
                        <ArtistStoryCard key={a.user_id} artist={a} />
                      ))}
                    </div>
                  </div>
                </ErrorBoundary>
              )}

              {/* Your Playlists */}
              <ErrorBoundary fallback={null}>
                <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 bg-background/50">
                  <UserPlaylistsSection
                    onPlaylistClick={(id) => navigate(`/playlist/${id}`)}
                    onViewAll={() => setActiveTab('playlists')}
                  />
                </div>
              </ErrorBoundary>

              {/* TDZ Albums Grid */}
              {albums.length > 0 && (
                <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 bg-background">
                  <ErrorBoundary fallback={null}>
                    <MinimalAlbumGrid albums={albums} title="TDZ Albums" />
                  </ErrorBoundary>
                </div>
              )}

              {/* TDZ Artists */}
              <ErrorBoundary fallback={null}>
                <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 bg-background/50">
                  <MinimalArtistGrid
                    artists={artists.slice(0, 8)}
                    followedArtists={followedArtists}
                    onToggleFollow={toggleFollow}
                  />
                </div>
              </ErrorBoundary>
            </div>
          );

        case 'trending':
          // Trending tab - Global charts, city trending, editorial playlists
          return (
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
              <h1 className="text-2xl sm:text-3xl font-bold">Trending</h1>
              
              {/* Top 50 Trending Songs */}
              <ErrorBoundary fallback={null}>
                <GenreTop50Section onViewAll={() => setActiveTab('library')} />
              </ErrorBoundary>
              
              {/* City Trending */}
              <ErrorBoundary fallback={null}>
                <CityTrendingSection
                  sectionNumber={0}
                  onViewAllTrends={() => {
                    setShowTrending(true);
                    setActiveTab('library');
                  }}
                />
              </ErrorBoundary>
              
              {/* Billboard & Editorial Charts */}
              <ErrorBoundary fallback={null}>
                <EditorialPlaylistsSection />
              </ErrorBoundary>
            </div>
          );

        case 'artists':
          return (
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">TDZ Artists</h1>
              <MinimalArtistGrid
                artists={artists}
                followedArtists={followedArtists}
                onToggleFollow={toggleFollow}
              />
            </div>
          );

        case 'playlists':
          return (
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
              <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Your Library</h1>
              
              <ErrorBoundary fallback={null}>
                <UserPlaylistsSection
                  onPlaylistClick={(id) => navigate(`/playlist/${id}`)}
                />
              </ErrorBoundary>
              
              <ErrorBoundary fallback={null}>
                <div className="mt-6 sm:mt-8">
                  <PlaylistManager
                    userId={user?.id || null}
                    onPlaylistSelect={(id) => navigate(`/playlist/${id}`)}
                  />
                </div>
              </ErrorBoundary>
            </div>
          );

        case 'merch':
          return (
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Merch Store</h1>
              <MerchStore variant="full" />
            </div>
          );

        case 'library':
          // Global Library - All global content (Spotify playlists, charts, etc.)
          return (
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
              <h1 className="text-2xl sm:text-3xl font-bold">Global Library</h1>
              
              {/* Spotify Featured Playlists */}
              <ErrorBoundary fallback={null}>
                <SpotifyPlaylistSection />
              </ErrorBoundary>
              
              {/* Unified Library with AI Engine, Discogs, MusicBrainz */}
              <ErrorBoundary fallback={<div className="text-muted-foreground">Library unavailable</div>}>
                <UnifiedLibrary
                  showTrending={showTrending}
                  onPlayYouTube={(videoId, title, artist, thumbnail) => {
                    playTrack({
                      id: videoId,
                      title,
                      artist_name: artist,
                      source: 'youtube',
                      youtubeId: videoId,
                      album_cover_path: thumbnail,
                      duration: 0,
                      file_path: '',
                      play_count: 0,
                    });
                    if (showTrending) setShowTrending(false);
                  }}
                />
              </ErrorBoundary>
            </div>
          );

        case 'ai-mix':
          return (
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <ErrorBoundary fallback={<div className="p-4">AI Mix unavailable</div>}>
                <MoodMixGenerator />
              </ErrorBoundary>
            </div>
          );

        default:
          return (
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <p className="text-muted-foreground">Select a tab</p>
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
