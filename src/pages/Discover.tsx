import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ListMusic, Plus, Lock, Sparkles
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { DiscoveryLayout } from "@/components/discovery/DiscoveryLayout";
import { DiscoveryHeader } from "@/components/discovery/DiscoveryHeader";
import { NowPlayingSidebar } from "@/components/discovery/NowPlayingSidebar";
import { LibrarySidebar } from "@/components/discovery/LibrarySidebar";
import { MobileSidebar } from "@/components/discovery/MobileSidebar";
import { EnhancedAlbumGrid } from "@/components/discovery/EnhancedAlbumGrid";
import { EnhancedArtistGrid } from "@/components/discovery/EnhancedArtistGrid";
import { EnhancedTrendingSection } from "@/components/discovery/EnhancedTrendingSection";
import { EnhancedTrackGrid } from "@/components/discovery/EnhancedTrackGrid";
import { PremiumTabs } from "@/components/discovery/PremiumTabs";
import { useDiscoveryData } from "@/hooks/useDiscoveryData";
import { MerchStore } from "@/components/MerchStore";
import { usePlayer } from "@/contexts/PlayerContext";
import { GenreHeroSection } from "@/components/discovery/GenreHeroSection";
import { UnifiedMusicStream } from "@/components/discovery/UnifiedMusicStream";
import { GenrePlaylists } from "@/components/discovery/GenrePlaylists";
import { EditorialPlaylists } from "@/components/discovery/EditorialPlaylists";
import { YouTubeVideo } from "@/hooks/useYouTubePlayer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DiscogsLibrary } from "@/components/discovery/DiscogsLibrary";

export default function Discover() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentArtistInfo, setCurrentArtistInfo] = useState<any>(null);
  const [relatedTracks, setRelatedTracks] = useState<any[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>(undefined);
  const [genreError, setGenreError] = useState(false);
  
  // Use global player context for persistent playback across navigation
  const { currentTrack, playTrack, addToQueue } = usePlayer();
  
  const {
    tracks,
    artists,
    albums,
    playlists,
    likedTracks,
    likedTracksList,
    followedArtists,
    loading,
    user,
    toggleLike,
    toggleFollow,
    refreshPlaylists
  } = useDiscoveryData();

  const { role } = useUserRole(user);
  const { hasFeature, isPaidPlan, getPlan } = useSubscription(user);
  const isArtist = role === 'artist' || role === 'verified_artist' || role === 'manager';
  const isAuthenticated = !!user;
  
  // Artists always have playlist access, fans need subscription
  const canCreatePlaylists = isArtist || hasFeature('playlists');

  // Load artist info when current track changes - MUST be before any conditional return
  useEffect(() => {
    if (currentTrack?.artist_user_id || currentTrack?.user_id) {
      loadArtistInfo(currentTrack.artist_user_id || currentTrack.user_id);
      loadRelatedTracks(currentTrack);
    }
  }, [currentTrack]);

  const loadArtistInfo = async (artistUserId: string) => {
    const { data } = await supabase
      .from("artist_profiles")
      .select("*")
      .eq("user_id", artistUserId)
      .single();
    
    if (data) {
      setCurrentArtistInfo({ ...data, id: artistUserId });
    }
  };

  const loadRelatedTracks = async (track: any) => {
    const { data } = await supabase
      .from("tracks")
      .select("*")
      .eq("user_id", track.user_id)
      .neq("id", track.id)
      .eq("is_published", true)
      .limit(5);
    
    if (data) {
      setRelatedTracks(data);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Derived values (keep non-hook to avoid hook-order issues)
  const filteredTracks = tracks.filter(track =>
    track.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Use global player for playback - this persists across navigation
  const handlePlayTrack = (track: any) => {
    // Ensure track has required fields with defaults
    const normalizedTrack = {
      ...track,
      duration: track.duration || 0,
      file_path: track.file_path || '',
      play_count: track.play_count || 0,
    };
    playTrack(
      normalizedTrack,
      filteredTracks.map(t => ({
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

  const handleCreatePlaylist = async () => {
    if (!user) {
      toast.error("Please sign in to create playlists");
      return;
    }
    // This will be handled by the LibrarySidebar component
  };

  const handleGenreSelect = (genreId: string) => {
    setSelectedGenre(genreId);
  };

  const handlePlayGenre = (genre: string, genreTracks: any[]) => {
    if (genreTracks.length > 0) {
      playTrack(genreTracks[0], genreTracks);
      toast.success(`Playing ${genre} playlist`);
    }
  };

  const handlePlayYouTube = (video: YouTubeVideo) => {
    // Convert YouTube video to Track format and play through global player
    const youtubeTrack = {
      id: `yt-${video.id}`,
      title: video.title,
      artist_name: video.channel,
      duration: parseDurationToSeconds(video.duration),
      file_path: '',
      play_count: 0,
      source: 'youtube' as const,
      youtubeId: video.id,
      thumbnail: video.thumbnail,
    };
    playTrack(youtubeTrack);
    toast.success(`Now playing: ${video.title}`);
  };

  // Handle Discogs/YouTube playback
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

  // Helper to parse YouTube duration string to seconds
  function parseDurationToSeconds(duration?: string): number {
    if (!duration) return 0;
    const parts = duration.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return parts[0] || 0;
  }

  // Show loading state while data is being fetched (AFTER all hooks)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white">Loading music...</p>
        </div>
      </div>
    );
  }

  // Left column content - Now Playing info
  const leftColumn = (
    <NowPlayingSidebar
      currentTrack={currentTrack}
      artistInfo={currentArtistInfo}
      relatedTracks={relatedTracks}
      onPlayTrack={handlePlayTrack}
    />
  );

  // Right column content - Library
  const rightColumn = (
    <LibrarySidebar
      userId={user?.id}
      likedTracksCount={likedTracks.size}
      onPlaylistSelect={(playlistId) => navigate(`/playlist/${playlistId}`)}
    />
  );

  // Center column content - with genre features (wrapped in error boundaries)
  const centerColumn = (
    <PremiumTabs
      defaultValue="discover"
      discoverContent={
        <div className="space-y-10">
          {/* Genre Hero Section */}
          <ErrorBoundary fallback={<div className="h-40 bg-muted/20 rounded-lg flex items-center justify-center text-muted-foreground">Genre section unavailable</div>}>
            <GenreHeroSection onGenreSelect={handleGenreSelect} />
          </ErrorBoundary>
          
          {/* Editorial Playlists - Genres, Activities & Moods */}
          <ErrorBoundary fallback={<div className="h-40 bg-muted/20 rounded-lg flex items-center justify-center text-muted-foreground">Playlists section unavailable</div>}>
            <EditorialPlaylists
              tracks={tracks}
              onPlayPlaylist={handlePlayGenre}
              onPlaylistClick={(id) => handleGenreSelect(id.replace(/^(genre|activity|mood)-/, ''))}
            />
          </ErrorBoundary>
          
          {/* Unified Music Stream (TDZ + YouTube) */}
          <ErrorBoundary fallback={<div className="h-40 bg-muted/20 rounded-lg flex items-center justify-center text-muted-foreground">Music stream unavailable</div>}>
            <UnifiedMusicStream
              tdzTracks={filteredTracks}
              likedTracks={likedTracks}
              currentTrackId={currentTrack?.id}
              playlists={playlists}
              selectedGenre={selectedGenre}
              onPlayTrack={handlePlayTrack}
              onToggleLike={toggleLike}
              onAddToQueue={handleAddToQueue}
              onPlayYouTube={handlePlayYouTube}
            />
          </ErrorBoundary>
          
          {/* Featured albums */}
          {albums.length > 0 && (
            <ErrorBoundary>
              <EnhancedAlbumGrid
                albums={albums}
                title="Featured Albums"
              />
            </ErrorBoundary>
          )}
        </div>
      }
      libraryContent={
        <ErrorBoundary fallback={<div className="h-40 bg-muted/20 rounded-lg flex items-center justify-center text-muted-foreground">Library unavailable</div>}>
          <DiscogsLibrary onPlayYouTube={handlePlayDiscogsYouTube} />
        </ErrorBoundary>
      }
      trendingContent={
        <EnhancedTrendingSection
          tracks={filteredTracks}
          likedTracks={likedTracks}
          onPlayTrack={handlePlayTrack}
          onToggleLike={toggleLike}
          formatDuration={formatDuration}
        />
      }
      artistsContent={
        <EnhancedArtistGrid
          artists={artists}
          followedArtists={followedArtists}
          onToggleFollow={toggleFollow}
        />
      }
      playlistsContent={
        <PlaylistsSection
          playlists={playlists}
          onCreatePlaylist={handleCreatePlaylist}
          canCreate={canCreatePlaylists}
        />
      }
      merchContent={
        <MerchStore variant="full" />
      }
    />
  );

  const header = (
    <DiscoveryHeader
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      isArtist={isArtist}
      onMenuClick={() => setMobileMenuOpen(true)}
    />
  );

  // Player is now rendered globally in App.tsx via GlobalMusicPlayer
  // Pass null to DiscoveryLayout's player prop since we use the global one
  const player = null;

  return (
    <>
      <DiscoveryLayout
        leftColumn={leftColumn}
        centerColumn={centerColumn}
        rightColumn={rightColumn}
        header={header}
        player={player}
        isAuthenticated={isAuthenticated}
      />
      
      <MobileSidebar
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        currentTrack={currentTrack}
        artistInfo={currentArtistInfo}
        relatedTracks={relatedTracks}
        onPlayTrack={handlePlayTrack}
        userId={user?.id}
        likedTracksCount={likedTracks.size}
        onPlaylistSelect={(playlistId) => {
          navigate(`/playlist/${playlistId}`);
        }}
      />
    </>
  );
}

// Playlists Section Component
function PlaylistsSection({ 
  playlists, 
  onCreatePlaylist,
  canCreate
}: {
  playlists: any[];
  onCreatePlaylist: () => void;
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
    onCreatePlaylist();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight glow-text">My Playlists</h2>
        <Button 
          onClick={handleCreate}
          className={`${canCreate ? 'bg-gradient-to-r from-primary via-primary-glow to-secondary shadow-glow' : 'bg-muted'} hover-lift px-6`}
        >
          {canCreate ? <Plus className="w-5 h-5 mr-2" /> : <Lock className="w-5 h-5 mr-2" />}
          Create Playlist
        </Button>
      </div>
      
      {/* Subscription notice */}
      {!canCreate && (
        <Card className="p-4 bg-primary/10 border-primary/30">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-primary" />
              <div>
                <p className="font-semibold">Unlock Playlists</p>
                <p className="text-sm text-muted-foreground">Subscribe to create and manage playlists</p>
              </div>
            </div>
            <Button onClick={() => navigate("/auth?upgrade=true")} className="bg-gradient-to-r from-primary to-secondary">
              <Sparkles className="w-4 h-4 mr-2" />
              $12/mo
            </Button>
          </div>
        </Card>
      )}
      
      {playlists.length === 0 ? (
        <Card className="glass-card-premium p-16 text-center shadow-glow-lg">
          <div className="max-w-md mx-auto space-y-6">
            <div className="relative inline-block">
              <ListMusic className="w-20 h-20 mx-auto text-primary" />
              <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl -z-10" />
            </div>
            
            <div className="space-y-3">
              <h3 className="text-3xl font-black">No playlists yet</h3>
              <p className="text-lg text-muted-foreground">
                {canCreate ? "Create your first playlist to organize your favorite tracks" : "Subscribe to start creating playlists"}
              </p>
            </div>
            
            <Button 
              onClick={handleCreate}
              className={`${canCreate ? 'bg-gradient-to-r from-primary to-secondary shadow-glow' : 'bg-muted'} hover-lift px-8 py-6 text-base mt-6`}
            >
              {canCreate ? <Plus className="w-5 h-5 mr-2" /> : <Lock className="w-5 h-5 mr-2" />}
              {canCreate ? "Create Your First Playlist" : "Subscribe to Create"}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {playlists.map((playlist, index) => (
            <Card 
              key={playlist.id} 
              className="glass-card-premium p-5 hover:border-primary/70 transition-all hover-lift shadow-card-hover animate-fade-in cursor-pointer"
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => navigate(`/playlist/${playlist.id}`)}
            >
              <div className="aspect-square rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 mb-4 shadow-glow flex items-center justify-center">
                <ListMusic className="w-12 h-12 text-primary-foreground" />
              </div>
              <h3 className="font-bold text-lg truncate mb-2">{playlist.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{playlist.description || "No description"}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}