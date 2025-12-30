import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Search, User, X, Loader2, Youtube, Crown, Mic2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import tdzLogo from "@/assets/tdz-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { usePlayer } from "@/contexts/PlayerContext";
import { supabase } from "@/integrations/supabase/client";
import { hardSignOut } from "@/lib/auth";
import { toast } from "sonner";
import { YouTubeVideo } from "@/hooks/useYouTubePlayer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SearchResult {
  id: string;
  title: string;
  artist_name: string;
  type: 'track' | 'album' | 'artist' | 'youtube';
  thumbnail?: string;
  youtubeData?: YouTubeVideo;
}

interface MinimalHeaderProps {
  onMenuClick: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function MinimalHeader({ onMenuClick, searchQuery, onSearchChange }: MinimalHeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { playTrack } = usePlayer();
  const [showSearch, setShowSearch] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Search when query changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setShowResults(true);
      
      try {
        const { data: tracks } = await supabase
          .from('tracks')
          .select('id, title, artist_name, album_cover_path, album_cover_bucket')
          .eq('is_published', true)
          .or(`title.ilike.%${searchQuery}%,artist_name.ilike.%${searchQuery}%`)
          .limit(5);

        const { data: artists } = await supabase
          .from('artist_profiles')
          .select('user_id, artist_name, profile_image_path')
          .ilike('artist_name', `%${searchQuery}%`)
          .limit(3);

        const { data: ytData } = await supabase.functions.invoke('youtube-search', {
          body: { query: searchQuery, type: 'search', maxResults: 5 }
        });

        const results: SearchResult[] = [];

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

  // Click outside
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

  const handleSignOut = async () => {
    await hardSignOut({ redirectTo: "/" });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/5">
      <div className="flex items-center justify-between h-16 px-4 max-w-7xl mx-auto">
        {/* Left: Menu */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="text-white/70 hover:text-white hover:bg-white/5"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Center: Logo */}
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img src={tdzLogo} alt="TDZ" className="h-8 w-auto" />
          <span className="font-bold text-lg text-white hidden sm:block">TDZ</span>
        </div>

        {/* Right: Search + User */}
        <div className="flex items-center gap-2">
          {/* Search Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSearch(!showSearch)}
            className="text-white/70 hover:text-white hover:bg-white/5"
          >
            {showSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </Button>

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/70 hover:text-white hover:bg-white/5"
                >
                  <User className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-[#1a1a1a] border-white/10">
                <DropdownMenuItem onClick={() => navigate("/profile")} className="text-white/80">
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/studio")} className="text-white/80">
                  Studio
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-400">
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/auth")}
              className="text-white/70 hover:text-white hover:bg-white/5"
            >
              Login
            </Button>
          )}
        </div>
      </div>

      {/* Expandable Search Bar */}
      {showSearch && (
        <div ref={searchRef} className="px-4 pb-4 animate-fade-in">
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
              placeholder="Search songs, artists, YouTube..."
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 h-10"
              autoFocus
            />

            {/* Results Dropdown */}
            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50">
                <ScrollArea className="max-h-80">
                  {isSearching ? (
                    <div className="p-6 flex items-center justify-center gap-2 text-white/50">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Searching...</span>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-6 text-center text-white/50">
                      No results for "{searchQuery}"
                    </div>
                  ) : (
                    <div className="py-2">
                      {searchResults.map((result) => (
                        <div
                          key={result.id}
                          onClick={() => handleResultClick(result)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors"
                        >
                          <div className="w-10 h-10 rounded bg-white/5 overflow-hidden flex-shrink-0">
                            {result.thumbnail ? (
                              <img src={result.thumbnail} alt={result.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Mic2 className="w-4 h-4 text-white/40" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-white truncate">{result.title}</p>
                            <p className="text-xs text-white/50 truncate">{result.artist_name}</p>
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
                            {result.type === 'youtube' ? 'YT' : result.type === 'artist' ? 'Artist' : 'TDZ'}
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
    </header>
  );
}
