import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, User, Mic2, Menu, LayoutDashboard, LogOut, UserCircle, Loader2, Youtube, Crown, X } from "lucide-react";
import tdzLogo from "@/assets/tdz-logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { hardSignOut } from "@/lib/auth";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { usePlayer } from "@/contexts/PlayerContext";
import { YouTubeVideo } from "@/hooks/useYouTubePlayer";

interface SearchResult {
  id: string;
  title: string;
  artist_name: string;
  type: 'track' | 'album' | 'artist' | 'youtube';
  thumbnail?: string;
  youtubeData?: YouTubeVideo;
}

interface DiscoveryHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isArtist: boolean;
  onMenuClick?: () => void;
}

export function DiscoveryHeader({ 
  searchQuery, 
  onSearchChange, 
  isArtist,
  onMenuClick 
}: DiscoveryHeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { playTrack } = usePlayer();
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  
  // CEO check
  const isCEO = user?.email === 'info@thirtydarkzero.com';

  // Search both TDZ and YouTube when query changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setShowResults(true);
      
      try {
        // Search TDZ tracks
        const { data: tracks } = await supabase
          .from('tracks')
          .select('id, title, artist_name, album_cover_path, album_cover_bucket')
          .eq('is_published', true)
          .or(`title.ilike.%${searchQuery}%,artist_name.ilike.%${searchQuery}%`)
          .limit(5);

        // Search TDZ artists
        const { data: artists } = await supabase
          .from('artist_profiles')
          .select('user_id, artist_name, profile_image_path')
          .ilike('artist_name', `%${searchQuery}%`)
          .limit(3);

        // Search YouTube
        const { data: ytData, error: ytError } = await supabase.functions.invoke('youtube-search', {
          body: { query: searchQuery, type: 'search', maxResults: 5 }
        });

        const results: SearchResult[] = [];

        // Add TDZ tracks
        tracks?.forEach(track => {
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

        // Add TDZ artists
        artists?.forEach(artist => {
          results.push({
            id: artist.user_id,
            title: artist.artist_name,
            artist_name: 'Artist',
            type: 'artist',
            thumbnail: artist.profile_image_path 
              ? supabase.storage.from('avatars').getPublicUrl(artist.profile_image_path).data.publicUrl
              : undefined,
          });
        });

        // Add YouTube results
        if (!ytError && ytData?.results) {
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
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    onSearchChange('');

    if (result.type === 'artist') {
      navigate(`/artist/${result.id}`);
    } else if (result.type === 'youtube' && result.youtubeData) {
      // Play YouTube track through global player
      const youtubeTrack = {
        id: result.id,
        title: result.title,
        artist_name: result.artist_name,
        duration: parseDurationToSeconds(result.youtubeData.duration),
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

  const handleArtistClick = (artistName: string, isYouTube: boolean) => {
    if (isYouTube) {
      navigate(`/artist/youtube/${encodeURIComponent(artistName)}`);
    }
  };

  function parseDurationToSeconds(duration?: string): number {
    if (!duration) return 0;
    const parts = duration.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] || 0;
  }

  // Proper sign out that clears all session data
  const handleSignOut = async () => {
    const { error } = await hardSignOut();
    if (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out. Please try again.");
      return;
    }

    toast.success("Signed out successfully");
    window.location.assign("/");
  };

  return (
    <div className="max-w-full mx-auto px-3 sm:px-4 md:px-6 py-3">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Logo + Menu */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <img 
            src={tdzLogo} 
            alt="TDZ" 
            className="h-8 sm:h-10 w-auto flex-shrink-0 cursor-pointer" 
            onClick={() => navigate("/")}
          />
          <span className="font-display font-bold text-sm sm:text-base md:text-xl hidden sm:block truncate">
            TDZ STREAMING
          </span>
        </div>

        {/* Center: Search */}
        <div ref={searchRef} className="flex-1 max-w-xs sm:max-w-md lg:max-w-xl relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
              placeholder="Search songs, artists, YouTube..."
              className="pl-10 pr-10 bg-background/80 backdrop-blur-sm h-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => {
                  onSearchChange('');
                  setShowResults(false);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-background/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden z-50">
              <ScrollArea className="max-h-96">
                {isSearching ? (
                  <div className="p-6 flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Searching...</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    No results found for "{searchQuery}"
                  </div>
                ) : (
                  <div className="py-2">
                    {searchResults.map((result) => (
                      <div
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-primary/10 cursor-pointer transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {result.thumbnail ? (
                            <img src={result.thumbnail} alt={result.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Mic2 className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm">{result.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{result.artist_name}</p>
                        </div>
                        <Badge variant="outline" className={
                          result.type === 'youtube' 
                            ? 'bg-red-600/20 text-red-400 border-red-600/30'
                            : result.type === 'artist'
                            ? 'bg-primary/20 text-primary border-primary/30'
                            : 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30'
                        }>
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

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {user && <NotificationsPanel />}
          
          {isArtist && (
            <Button 
              variant="outline"
              onClick={() => navigate("/studio")}
              className="gap-2 h-9 sm:h-10 hidden sm:flex"
            >
              <Mic2 className="w-4 h-4" />
              <span className="hidden md:inline">Studio</span>
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="icon"
                className="h-9 w-9 sm:h-10 sm:w-10"
              >
                <User className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <UserCircle className="w-4 h-4 mr-2" />
                My Profile
              </DropdownMenuItem>
              {isArtist && (
                <DropdownMenuItem onClick={() => navigate("/studio")}>
                  <Mic2 className="w-4 h-4 mr-2" />
                  Artist Studio
                </DropdownMenuItem>
              )}
              {isCEO && (
                <DropdownMenuItem onClick={() => navigate("/ceo")} className="text-primary">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  CEO Dashboard
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
