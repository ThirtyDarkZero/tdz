import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ListMusic, Plus, Lock, Sparkles } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { useDiscoveryData } from "@/hooks/useDiscoveryData";
import { MerchStore } from "@/components/MerchStore";
import { usePlayer } from "@/contexts/PlayerContext";
import { YouTubeVideo } from "@/hooks/useYouTubePlayer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { UnifiedLibrary } from "@/components/discovery/UnifiedLibrary";

// New minimal components
import { MinimalLayout } from "@/components/discovery/MinimalLayout";
import { MinimalTrackList } from "@/components/discovery/MinimalTrackList";
import { MinimalArtistGrid } from "@/components/discovery/MinimalArtistGrid";
import { MinimalAlbumGrid } from "@/components/discovery/MinimalAlbumGrid";
import { MinimalGenreSection } from "@/components/discovery/MinimalGenreSection";

export default function Discover() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("discover");
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>(undefined);
  
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

  const handlePlayYouTube = (video: YouTubeVideo) => {
    const youtubeTrack = {
      id: `yt-${video.id}`,
      title: video.title,
      artist_name: video.channel,
      duration: 0,
      file_path: '',
      play_count: 0,
      source: 'youtube' as const,
      youtubeId: video.id,
      thumbnail: video.thumbnail,
    };
    playTrack(youtubeTrack);
    toast.success(`Now playing: ${video.title}`);
  };

  const handlePlayDiscogsYouTube = (videoId: string, title: string, artist: string, thumbnail: string) => {
    const youtubeTrack = {
      id: `yt-${videoId}`,
      title: title,
      artist_name: artist,
      duration: 0,
      file_path: '',
      play_count: 0,
      source: 'youtube' as const,
      youtubeId: videoId,
      thumbnail: thumbnail,
    };
    playTrack(youtubeTrack);
    toast.success(`Now playing: ${title}`);
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
    switch (activeTab) {
      case 'discover':
        return (
          <div className="space-y-10 py-6">
            {/* Genre/Mood Section */}
            <ErrorBoundary fallback={null}>
              <MinimalGenreSection onGenreSelect={handleGenreSelect} />
            </ErrorBoundary>

            {/* Selected genre indicator */}
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

            {/* Track List */}
            <MinimalTrackList
              tracks={genreFilteredTracks}
              currentTrackId={currentTrack?.id}
              likedTracks={likedTracks}
              onPlayTrack={handlePlayTrack}
              onToggleLike={toggleLike}
              onAddToQueue={handleAddToQueue}
              title={selectedGenre ? `${selectedGenre} Tracks` : "All Tracks"}
            />

            {/* Albums */}
            {albums.length > 0 && (
              <MinimalAlbumGrid
                albums={albums}
                title="Albums"
              />
            )}
          </div>
        );

      case 'library':
        return (
          <div className="py-6">
            <ErrorBoundary fallback={<div className="text-white/50 text-center py-10">Library unavailable</div>}>
              <UnifiedLibrary onPlayYouTube={handlePlayDiscogsYouTube} />
            </ErrorBoundary>
          </div>
        );

      case 'trending':
        return (
          <div className="py-6">
            <MinimalTrackList
              tracks={[...filteredTracks].sort((a, b) => (b.play_count || 0) - (a.play_count || 0)).slice(0, 20)}
              currentTrackId={currentTrack?.id}
              likedTracks={likedTracks}
              onPlayTrack={handlePlayTrack}
              onToggleLike={toggleLike}
              onAddToQueue={handleAddToQueue}
              title="Trending Now"
            />
          </div>
        );

      case 'artists':
        return (
          <div className="py-6">
            <MinimalArtistGrid
              artists={artists}
              followedArtists={followedArtists}
              onToggleFollow={toggleFollow}
              title="Artists"
            />
          </div>
        );

      case 'playlists':
        return (
          <div className="py-6">
            <PlaylistsSection
              playlists={playlists}
              canCreate={canCreatePlaylists}
            />
          </div>
        );

      case 'merch':
        return (
          <div className="py-6">
            <h2 className="text-xl font-bold text-white mb-6">Merch Store</h2>
            <MerchStore variant="full" />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <MinimalLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    >
      {renderContent()}
    </MinimalLayout>
  );
}

// Playlists Section
function PlaylistsSection({ 
  playlists, 
  canCreate
}: {
  playlists: any[];
  canCreate: boolean;
}) {
  const navigate = useNavigate();
  
  const handleCreate = () => {
    if (!canCreate) {
      toast.error("Subscribe to create playlists ($12/mo)", {
        action: {
          label: "Upgrade",
          onClick: () => navigate("/auth?upgrade=true"),
        },
      });
      return;
    }
    // TODO: Open create playlist dialog
    toast.info("Playlist creation coming soon");
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">My Playlists</h2>
        <Button 
          onClick={handleCreate}
          variant="outline"
          size="sm"
          className={`${canCreate 
            ? 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10' 
            : 'border-white/10 text-white/50'
          }`}
        >
          {canCreate ? <Plus className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
          Create
        </Button>
      </div>
      
      {!canCreate && (
        <div className="p-4 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="font-medium text-white text-sm">Unlock Playlists</p>
              <p className="text-xs text-white/50">Subscribe to create and manage playlists</p>
            </div>
          </div>
        </div>
      )}
      
      {playlists.length === 0 ? (
        <div className="text-center py-16">
          <ListMusic className="w-12 h-12 mx-auto text-white/20 mb-4" />
          <p className="text-white/40">No playlists yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {playlists.map((playlist, index) => (
            <div 
              key={playlist.id} 
              className="group cursor-pointer"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => navigate(`/playlist/${playlist.id}`)}
            >
              <div className="aspect-square rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/5 flex items-center justify-center mb-3 group-hover:border-cyan-500/30 transition-colors">
                <ListMusic className="w-8 h-8 text-white/40" />
              </div>
              <h3 className="font-medium text-sm text-white truncate">{playlist.name}</h3>
              <p className="text-xs text-white/40">Playlist</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
