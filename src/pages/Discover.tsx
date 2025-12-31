import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ListMusic, Plus, Lock, Sparkles, Search, Loader2, Youtube, Crown, Mic2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserRole } from "@/hooks/useUserRole";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { useDiscoveryData } from "@/hooks/useDiscoveryData";
import { MerchStore } from "@/components/MerchStore";
import { usePlayer } from "@/contexts/PlayerContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// New minimal components
import { PersistentLayout } from "@/components/discovery/PersistentLayout";
import { MinimalHero } from "@/components/discovery/MinimalHero";
import { MinimalTrackList } from "@/components/discovery/MinimalTrackList";
import { MinimalArtistGrid } from "@/components/discovery/MinimalArtistGrid";
import { MinimalAlbumGrid } from "@/components/discovery/MinimalAlbumGrid";
import { MinimalGenreSection } from "@/components/discovery/MinimalGenreSection";
import { Genre3DCarousel } from "@/components/discovery/Genre3DCarousel";
import { CuratedPlaylistGrid } from "@/components/discovery/CuratedPlaylistGrid";

export default function Discover() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("discover");
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>(undefined);
  const [showSearch, setShowSearch] = useState(false);

  const { currentTrack, playTrack, addToQueue } = usePlayer();
  
  const {
    tracks,
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
  const isArtist = role === 'artist' || role === 'verified_artist' || role === 'manager';
  const canCreatePlaylists = isArtist || hasFeature('playlists');

  // Filter tracks by search
  const filteredTracks = tracks.filter(track =>
    track.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter by selected genre
  const genreFilteredTracks = selectedGenre 
    ? filteredTracks.filter(t => 
        t.genre?.toLowerCase().includes(selectedGenre.toLowerCase()) ||
        t.mood?.toLowerCase().includes(selectedGenre.toLowerCase())
      )
    : filteredTracks;

  const handlePlayTrack = (track: any) => {
    const normalizedTrack = {
      ...track,
      duration: track.duration || 0,
      file_path: track.file_path || '',
      play_count: track.play_count || 0,
    };
    playTrack(
      normalizedTrack,
      genreFilteredTracks.map(t => ({
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

  // Generate album data for 3D carousel
  const genreAlbums = useMemo(() => {
    const albumsWithCovers = albums.filter(a => a.cover_art_path).map(album => ({
      id: album.id,
      title: album.title,
      artist: album.artist_name,
      image: album.cover_art_path 
        ? supabase.storage.from('album-covers').getPublicUrl(album.cover_art_path).data.publicUrl
        : 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
      genre: album.genre || 'Pop',
    }));
    
    // Add fallback albums if we don't have enough
    if (albumsWithCovers.length < 8) {
      const fallbackImages = [
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80',
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80',
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
        'https://images.unsplash.com/photo-1571266028243-d220c6e3d9ec?w=400&q=80',
        'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&q=80',
        'https://images.unsplash.com/photo-1504509546545-e000b4a62425?w=400&q=80',
        'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80',
      ];
      
      for (let i = albumsWithCovers.length; i < 8; i++) {
        albumsWithCovers.push({
          id: `placeholder-${i}`,
          title: `Trending Album ${i + 1}`,
          artist: 'Various Artists',
          image: fallbackImages[i % fallbackImages.length],
          genre: selectedGenre || 'Pop',
        });
      }
    }
    
    return albumsWithCovers;
  }, [albums, selectedGenre]);

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
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Render content based on active tab
  const renderContent = () => {
    try {
      switch (activeTab) {
        case 'discover':
          return (
            <div className="space-y-10">
              <ErrorBoundary fallback={<div className="h-[400px] bg-gradient-to-br from-cyan-900/30 to-purple-900/30" />}>
                <MinimalHero tracks={genreFilteredTracks} />
              </ErrorBoundary>

              <ErrorBoundary fallback={null}>
                <Genre3DCarousel
                  albums={genreAlbums}
                  activeGenre={selectedGenre || 'pop'}
                  onGenreChange={handleGenreSelect}
                  onAlbumClick={(album) => {
                    if (!album.id.startsWith('placeholder')) {
                      navigate(`/album/${album.id}`);
                    }
                  }}
                  onPlayAlbum={(album) => {
                    const albumTracks = tracks.filter(t => 
                      t.artist_name === album.artist || 
                      t.genre?.toLowerCase().includes(album.genre.toLowerCase())
                    );
                    if (albumTracks.length > 0) {
                      handlePlayTrack(albumTracks[0]);
                    }
                  }}
                />
              </ErrorBoundary>

              <div className="px-4 sm:px-6 lg:px-8 space-y-10">
                <ErrorBoundary fallback={null}>
                  <CuratedPlaylistGrid
                    tracks={tracks}
                    onPlayPlaylist={handlePlayPlaylist}
                    onViewAll={(category) => toast.info(`Viewing all ${category}`)}
                  />
                </ErrorBoundary>

                <ErrorBoundary fallback={null}>
                  <MinimalGenreSection onGenreSelect={handleGenreSelect} />
                </ErrorBoundary>

                {selectedGenre && (
                  <div className="flex items-center gap-2">
                    <span className="text-white/60 text-sm">Filtering by:</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedGenre(undefined)}
                      className="bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                    >
                      {selectedGenre} ×
                    </Button>
                  </div>
                )}

                <ErrorBoundary fallback={null}>
                  <MinimalTrackList
                    tracks={genreFilteredTracks}
                    currentTrackId={currentTrack?.id}
                    likedTracks={likedTracks}
                    onPlayTrack={handlePlayTrack}
                    onToggleLike={toggleLike}
                    onAddToQueue={handleAddToQueue}
                    title={selectedGenre ? `${selectedGenre} Tracks` : "All Tracks"}
                  />
                </ErrorBoundary>

                {albums.length > 0 && (
                  <ErrorBoundary fallback={null}>
                    <MinimalAlbumGrid albums={albums} title="Albums" />
                  </ErrorBoundary>
                )}
              </div>
            </div>
          );

        case 'trending':
          return (
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <h1 className="text-3xl font-bold text-white mb-6">Trending</h1>
              <MinimalTrackList
                tracks={[...filteredTracks].sort((a, b) => (b.play_count || 0) - (a.play_count || 0)).slice(0, 20)}
                currentTrackId={currentTrack?.id}
                likedTracks={likedTracks}
                onPlayTrack={handlePlayTrack}
                onToggleLike={toggleLike}
                onAddToQueue={handleAddToQueue}
              />
            </div>
          );

        case 'artists':
          return (
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <h1 className="text-3xl font-bold text-white mb-6">Artists</h1>
              <MinimalArtistGrid
                artists={artists}
                followedArtists={followedArtists}
                onToggleFollow={toggleFollow}
              />
            </div>
          );

        case 'playlists':
          return (
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <h1 className="text-3xl font-bold text-white mb-6">Playlists</h1>
              <p className="text-white/50">Create and manage your playlists</p>
            </div>
          );

        case 'merch':
          return (
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <h1 className="text-3xl font-bold text-white mb-6">Merch Store</h1>
              <MerchStore variant="full" />
            </div>
          );

        case 'library':
          return (
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <h1 className="text-3xl font-bold text-white mb-6">Library</h1>
              <p className="text-white/50">Your music library</p>
            </div>
          );

        default:
          return (
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <p className="text-white/50">Select a tab</p>
            </div>
          );
      }
    } catch (error) {
      console.error('renderContent error:', error);
      return <div className="p-8 text-white">Something went wrong</div>;
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
