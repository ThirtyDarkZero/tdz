import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListMusic, Plus, Lock, Sparkles, Search, Loader2, Youtube, Crown, Mic2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserRole } from "@/hooks/useUserRole";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { useDiscoveryData } from "@/hooks/useDiscoveryData";
import { MerchStore } from "@/components/MerchStore";
import { usePlayer } from "@/contexts/PlayerContext";
import { YouTubeVideo } from "@/hooks/useYouTubePlayer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { UnifiedLibrary } from "@/components/discovery/UnifiedLibrary";
import { LikedSongsPlaylist } from "@/components/discovery/LikedSongsPlaylist";

// New minimal components
import { PersistentLayout } from "@/components/discovery/PersistentLayout";
import { MinimalHero } from "@/components/discovery/MinimalHero";
import { MinimalTrackList } from "@/components/discovery/MinimalTrackList";
import { MinimalArtistGrid } from "@/components/discovery/MinimalArtistGrid";
import { MinimalAlbumGrid } from "@/components/discovery/MinimalAlbumGrid";
import { MinimalGenreSection } from "@/components/discovery/MinimalGenreSection";

interface SearchResult {
  id: string;
  title: string;
  artist_name: string;
  type: 'track' | 'album' | 'artist' | 'youtube';
  thumbnail?: string;
  youtubeData?: YouTubeVideo;
}

export default function Discover() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("discover");
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>(undefined);
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  
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

  // Search functionality
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      
      try {
        const { data: searchTracks } = await supabase
          .from('tracks')
          .select('id, title, artist_name, album_cover_path, album_cover_bucket')
          .eq('is_published', true)
          .or(`title.ilike.%${searchQuery}%,artist_name.ilike.%${searchQuery}%`)
          .limit(5);

        const { data: searchArtists } = await supabase
          .from('artist_profiles')
          .select('user_id, artist_name, profile_image_path')
          .ilike('artist_name', `%${searchQuery}%`)
          .limit(3);

        const { data: ytData } = await supabase.functions.invoke('youtube-search', {
          body: { query: searchQuery, type: 'search', maxResults: 5 }
        });

        const results: SearchResult[] = [];

        searchTracks?.forEach(track => {
          results.push({
            id: track.id,
            title: track.title,
            artist_name: track.artist_name,
            type: 'track',
            thumbnail: track.album_cover_path 
              ? supabase.storage.from(track.album_cover_bucket || 'album-covers').getPublicUrl(track.album_cover_path).data.publicUrl
              : undefined,
          });
        });

        searchArtists?.forEach(artist => {
          results.push({
            id: artist.user_id,
            title: artist.artist_name,
            artist_name: 'Artist',
            type: 'artist',
          });
        });

        if (ytData?.results) {
          ytData.results.forEach((video: YouTubeVideo) => {
            results.push({
              id: `yt-${video.id}`,
              title: video.title,
              artist_name: video.channel,
              type: 'youtube',
              thumbnail: video.thumbnail,
              youtubeData: video,
            });
          });
        }

        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

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

  const handleSearchResultClick = (result: SearchResult) => {
    setSearchQuery('');
    setShowSearch(false);

    if (result.type === 'artist') {
      navigate(`/artist/${result.id}`);
    } else if (result.type === 'youtube' && result.youtubeData) {
      const youtubeTrack = {
        id: result.id,
        title: result.title,
        artist_name: result.artist_name,
        duration: 0,
        file_path: '',
        play_count: 0,
        source: 'youtube' as const,
        youtubeId: result.youtubeData.id,
        thumbnail: result.thumbnail,
      };
      playTrack(youtubeTrack);
      toast.success(`Now playing: ${result.title}`);
    } else if (result.type === 'track') {
      navigate(`/track/${result.id}`);
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
    switch (activeTab) {
      case 'discover':
        return (
          <div className="space-y-10">
            {/* Hero */}
            <MinimalHero tracks={genreFilteredTracks} />

            {/* Main Content */}
            <div className="px-4 sm:px-6 lg:px-8 space-y-10">
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
          </div>
        );

      case 'library':
        return (
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold text-white mb-6">Library</h1>
            <ErrorBoundary fallback={<div className="text-white/50 text-center py-10">Library unavailable</div>}>
              <UnifiedLibrary onPlayYouTube={handlePlayDiscogsYouTube} />
            </ErrorBoundary>
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
            <PlaylistsSection
              playlists={playlists}
              canCreate={canCreatePlaylists}
            />
          </div>
        );

      case 'merch':
        return (
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold text-white mb-6">Merch Store</h1>
            <MerchStore variant="full" />
          </div>
        );

      case 'liked':
        return (
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <LikedSongsPlaylist />
          </div>
        );

      default:
        return null;
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
      {/* Search Overlay */}
      {showSearch && (
        <div className="fixed inset-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-sm pt-14 lg:pt-0 lg:pl-64">
          <div className="max-w-2xl mx-auto px-4 py-8">
            <div ref={searchRef} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search songs, artists, YouTube..."
                className="pl-12 pr-4 py-6 text-lg bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-full"
                autoFocus
              />
            </div>

            {/* Search Results */}
            {searchQuery.length >= 2 && (
              <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <ScrollArea className="max-h-[60vh]">
                  {isSearching ? (
                    <div className="p-8 flex items-center justify-center gap-3 text-white/50">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Searching...</span>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-8 text-center text-white/50">
                      No results for "{searchQuery}"
                    </div>
                  ) : (
                    <div className="py-2">
                      {searchResults.map((result) => (
                        <div
                          key={result.id}
                          onClick={() => handleSearchResultClick(result)}
                          className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors"
                        >
                          <div className="w-12 h-12 rounded-lg bg-white/5 overflow-hidden flex-shrink-0">
                            {result.thumbnail ? (
                              <img src={result.thumbnail} alt={result.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Mic2 className="w-5 h-5 text-white/30" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{result.title}</p>
                            <p className="text-sm text-white/50 truncate">{result.artist_name}</p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              result.type === 'youtube' 
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : result.type === 'artist'
                                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}
                          >
                            {result.type === 'youtube' && <Youtube className="w-3 h-3 mr-1" />}
                            {result.type === 'track' && <Crown className="w-3 h-3 mr-1" />}
                            {result.type === 'youtube' ? 'YouTube' : result.type === 'artist' ? 'Artist' : 'TDZ'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}
          </div>
        </div>
      )}

      {renderContent()}
    </PersistentLayout>
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
    toast.info("Playlist creation coming soon");
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Playlists</h1>
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
        <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
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
        <div className="text-center py-20">
          <ListMusic className="w-16 h-16 mx-auto text-white/10 mb-4" />
          <p className="text-white/40 text-lg">No playlists yet</p>
          <p className="text-white/30 text-sm mt-1">Create your first playlist to get started</p>
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
              <div className="aspect-square rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/5 flex items-center justify-center mb-3 group-hover:border-cyan-500/30 transition-colors">
                <ListMusic className="w-10 h-10 text-white/30" />
              </div>
              <h3 className="font-medium text-sm text-white truncate group-hover:text-cyan-400 transition-colors">{playlist.name}</h3>
              <p className="text-xs text-white/40 mt-0.5">Playlist</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
