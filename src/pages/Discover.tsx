import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, Heart, Share2, TrendingUp, Flame, 
  ListMusic, Plus, UserPlus, Music, ShoppingBag
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { MusicPlayer } from "@/components/MusicPlayer";
import { MotionCover } from "@/components/MotionCover";
import { DiscoveryLayout } from "@/components/discovery/DiscoveryLayout";
import { DiscoveryHeader } from "@/components/discovery/DiscoveryHeader";
import { NowPlayingSidebar } from "@/components/discovery/NowPlayingSidebar";
import { LibrarySidebar } from "@/components/discovery/LibrarySidebar";
import { MobileSidebar } from "@/components/discovery/MobileSidebar";
import { DiscoveryHero } from "@/components/discovery/DiscoveryHero";
import { TrackGrid } from "@/components/discovery/TrackGrid";
import { AlbumGrid } from "@/components/discovery/AlbumGrid";
import { ArtistGrid } from "@/components/discovery/ArtistGrid";
import { useDiscoveryData } from "@/hooks/useDiscoveryData";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { MerchStore } from "@/components/MerchStore";

const PREVIEW_DURATION_SECONDS = 30;

export default function Discover() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentArtistInfo, setCurrentArtistInfo] = useState<any>(null);
  const [relatedTracks, setRelatedTracks] = useState<any[]>([]);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
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
  const isArtist = role === 'artist' || role === 'verified_artist' || role === 'manager';
  const isAuthenticated = !!user;

  // Load artist info when current track changes
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

  const handlePlayTrack = (track: any) => {
    setCurrentTrack(track);
    setQueue(filteredTracks);
    const index = filteredTracks.findIndex(t => t.id === track.id);
    setCurrentIndex(index);
  };

  const handleAddToQueue = (track: any) => {
    setQueue(prev => [...prev, track]);
    toast.success(`Added "${track.title}" to queue`);
  };

  const handleNext = () => {
    if (currentIndex < queue.length - 1) {
      const nextTrack = queue[currentIndex + 1];
      setCurrentTrack(nextTrack);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevTrack = queue[currentIndex - 1];
      setCurrentTrack(prevTrack);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleTrackEnd = () => {
    handleNext();
  };

  const filteredTracks = tracks.filter(track =>
    track.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreatePlaylist = async () => {
    if (!user) {
      toast.error("Please sign in to create playlists");
      return;
    }
    // This will be handled by the LibrarySidebar component
  };

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

  // Center column content
  const centerColumn = (
    <div className="space-y-8">
      <Tabs defaultValue="discover" className="space-y-6">
        <div className="flex justify-center overflow-x-auto pb-2 -mx-4 px-4">
          <TabsList className="glass-card-premium p-1.5 md:p-2 gap-1 md:gap-2 h-auto shadow-glow inline-flex min-w-max">
            <TabsTrigger value="discover" className="gap-1.5 md:gap-2 px-3 sm:px-4 md:px-6 py-2 md:py-3 text-sm md:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105 whitespace-nowrap">
              <Flame className="w-4 h-4 md:w-5 md:h-5" />
              <span>Discover</span>
            </TabsTrigger>
            <TabsTrigger value="trending" className="gap-1.5 md:gap-2 px-3 sm:px-4 md:px-6 py-2 md:py-3 text-sm md:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105 whitespace-nowrap">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
              <span>Trending</span>
            </TabsTrigger>
            <TabsTrigger value="artists" className="gap-1.5 md:gap-2 px-3 sm:px-4 md:px-6 py-2 md:py-3 text-sm md:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105 whitespace-nowrap">
              <Music className="w-4 h-4 md:w-5 md:h-5" />
              <span>Artists</span>
            </TabsTrigger>
            <TabsTrigger value="playlists" className="gap-1.5 md:gap-2 px-3 sm:px-4 md:px-6 py-2 md:py-3 text-sm md:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105 whitespace-nowrap">
              <ListMusic className="w-4 h-4 md:w-5 md:h-5" />
              <span>Playlists</span>
            </TabsTrigger>
            <TabsTrigger value="merch" className="gap-1.5 md:gap-2 px-3 sm:px-4 md:px-6 py-2 md:py-3 text-sm md:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all hover:scale-105 whitespace-nowrap">
              <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" />
              <span>Merch</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="discover" className="space-y-8 animate-fade-in">
          <DiscoveryHero />
          
          <TrackGrid
            tracks={filteredTracks}
            title="Latest Releases"
            playlists={playlists}
            likedTracks={likedTracks}
            onPlayTrack={handlePlayTrack}
            onToggleLike={toggleLike}
            onAddToQueue={handleAddToQueue}
            onPlaylistUpdate={refreshPlaylists}
          />
          
          <AlbumGrid
            albums={albums}
            title="Featured Albums"
          />
        </TabsContent>

        <TabsContent value="trending" className="space-y-8 animate-fade-in">
          <TrendingSection
            tracks={filteredTracks}
            likedTracks={likedTracks}
            onPlayTrack={handlePlayTrack}
            onToggleLike={toggleLike}
            formatDuration={formatDuration}
          />
        </TabsContent>

        <TabsContent value="artists" className="space-y-8 animate-fade-in">
          <ArtistGrid
            artists={artists}
            followedArtists={followedArtists}
            onToggleFollow={toggleFollow}
          />
        </TabsContent>

        <TabsContent value="playlists" className="space-y-8 animate-fade-in">
          <PlaylistsSection
            playlists={playlists}
            onCreatePlaylist={handleCreatePlaylist}
          />
        </TabsContent>

        <TabsContent value="merch" className="space-y-8 animate-fade-in">
          <MerchStore variant="full" />
        </TabsContent>
      </Tabs>
    </div>
  );

  const header = (
    <DiscoveryHeader
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      isArtist={isArtist}
      onMenuClick={() => setMobileMenuOpen(true)}
    />
  );

  const handlePreviewEnd = () => {
    setShowSubscriptionModal(true);
    toast.info("Preview ended - Subscribe for unlimited streaming!");
  };

  const player = (
    <MusicPlayer
      currentTrack={currentTrack}
      queue={queue}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onTrackEnd={handleTrackEnd}
      maxDuration={!isAuthenticated ? PREVIEW_DURATION_SECONDS : undefined}
      onPreviewEnd={!isAuthenticated ? handlePreviewEnd : undefined}
    />
  );

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

      <SubscriptionModal
        open={showSubscriptionModal}
        onOpenChange={setShowSubscriptionModal}
      />
    </>
  );
}

// Trending Section Component
function TrendingSection({ 
  tracks, 
  likedTracks, 
  onPlayTrack, 
  onToggleLike,
  formatDuration 
}: {
  tracks: any[];
  likedTracks: Set<string>;
  onPlayTrack: (track: any) => void;
  onToggleLike: (trackId: string) => void;
  formatDuration: (seconds: number) => string;
}) {
  const navigate = useNavigate();
  
  // Sort by play count for trending
  const trendingTracks = [...tracks].sort((a, b) => (b.play_count || 0) - (a.play_count || 0));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
          <span className="glow-text-lg bg-gradient-to-r from-primary via-primary-glow to-secondary bg-clip-text text-transparent">
            THE CHARTS
          </span>
        </h1>
        <p className="text-lg text-muted-foreground">
          Top trending tracks ranked by plays and engagement
        </p>
      </div>

      {trendingTracks.length > 0 ? (
        <Card className="glass-card-premium overflow-hidden border-primary/30 shadow-glow">
          <div className="divide-y divide-border/50">
            {trendingTracks.slice(0, 50).map((track, index) => (
              <div
                key={track.id}
                className="flex items-center gap-4 p-4 hover:bg-primary/5 transition-colors group cursor-pointer"
                onClick={() => onPlayTrack(track)}
              >
                <div className="flex-shrink-0 w-10 text-center">
                  {index < 3 ? (
                    <div className={`text-2xl font-black ${
                      index === 0 ? 'text-yellow-500 glow-text' :
                      index === 1 ? 'text-gray-400' :
                      'text-amber-700'
                    }`}>
                      {index + 1}
                    </div>
                  ) : (
                    <div className="text-lg font-bold text-muted-foreground">
                      {index + 1}
                    </div>
                  )}
                </div>

                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
                    <MotionCover
                      motionCoverPath={track.motion_cover_path}
                      motionCoverBucket={track.motion_cover_bucket}
                      staticCoverPath={track.album_cover_path}
                      staticCoverBucket={track.album_cover_bucket || "album-covers"}
                      alt={track.title}
                      className="w-full h-full"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                    <Play className="w-5 h-5 text-white" fill="currentColor" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{track.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{track.artist_name}</p>
                </div>

                <div className="hidden md:block text-sm text-muted-foreground flex-shrink-0">
                  {formatDuration(track.duration || 0)}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLike(track.id);
                    }}
                    className={likedTracks.has(track.id) ? "text-primary" : ""}
                  >
                    <Heart
                      className="w-5 h-5"
                      fill={likedTracks.has(track.id) ? "currentColor" : "none"}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/track/${track.id}`);
                    }}
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="glass-card-premium p-16 text-center">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-2xl font-bold mb-2">No Trending Tracks Yet</h3>
          <p className="text-muted-foreground">
            Charts are updated based on recent plays and engagement
          </p>
        </Card>
      )}
    </div>
  );
}

// Playlists Section Component
function PlaylistsSection({ 
  playlists, 
  onCreatePlaylist 
}: {
  playlists: any[];
  onCreatePlaylist: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight glow-text">My Playlists</h2>
        <Button 
          onClick={onCreatePlaylist}
          className="bg-gradient-to-r from-primary via-primary-glow to-secondary shadow-glow hover-lift px-6"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Playlist
        </Button>
      </div>
      
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
                Create your first playlist to organize your favorite tracks
              </p>
            </div>
            
            <Button 
              onClick={onCreatePlaylist}
              className="bg-gradient-to-r from-primary to-secondary shadow-glow hover-lift px-8 py-6 text-base mt-6"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Playlist
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
