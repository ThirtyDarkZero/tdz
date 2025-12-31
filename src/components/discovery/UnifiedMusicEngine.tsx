import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Search, Play, Disc, User, Music, Loader2, Sparkles, 
  Youtube, Database, Globe, Plus, ChevronRight,
  TrendingUp, Heart, BarChart3, Zap
} from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import { GlobalArtistProfile } from "./GlobalArtistProfile";
import { GlobalAlbumDetail } from "./GlobalAlbumDetail";
import { AddToPlaylistDialog } from "./AddToPlaylistDialog";

interface AcousticData {
  bpm?: number;
  key?: string;
  mood?: string[];
  danceability?: number;
  energy?: number;
  acousticness?: number;
}

interface ChartPosition {
  chart: string;
  rank: number;
  peakPosition?: number;
  weeksOnChart?: number;
  isNew?: boolean;
  lastPosition?: number;
}

interface UnifiedResult {
  id: string;
  type: 'artist' | 'album' | 'track';
  title: string;
  artist: string;
  year?: string;
  thumbnail?: string;
  source: 'musicbrainz' | 'discogs' | 'youtube' | 'billboard' | 'theaudiodb' | 'allmusic';
  sourceId: string;
  youtubeId?: string;
  genres?: string[];
  isOfficial?: boolean;
  popularity?: number;
  aiSummary?: string;
  relatedGenres?: string[];
  moodTags?: string[];
  metadata?: Record<string, unknown>;
  acousticData?: AcousticData;
  chartPosition?: ChartPosition;
  theAudioDBImage?: string;
  allMusicImage?: string;
}

interface UnifiedMusicEngineProps {
  onPlayYouTube: (videoId: string, title: string, artist: string, thumbnail: string) => void;
  initialTrending?: boolean;
}

export function UnifiedMusicEngine({ onPlayYouTube, initialTrending = false }: UnifiedMusicEngineProps) {
  const { addToQueue } = usePlayer();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UnifiedResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<'all' | 'artist' | 'album' | 'track'>('all');
  const [aiEnrich, setAiEnrich] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeAcoustic, setIncludeAcoustic] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<{ 
    id: string; 
    title: string; 
    artist: string; 
    year?: string; 
    coverArt?: string; 
    genres?: string[]; 
    source: 'discogs' | 'musicbrainz' | 'youtube' | 'billboard'; 
  } | null>(null);
  const [playlistTrack, setPlaylistTrack] = useState<{
    id: string;
    title: string;
    artist_name: string;
    youtubeId?: string;
    thumbnail?: string;
  } | null>(null);
  const [sources, setSources] = useState({ musicbrainz: false, discogs: false, youtube: false, billboard: false, theaudiodb: false, spotify: false });

  // Load trending on mount if initialTrending is true
  useEffect(() => {
    if (initialTrending) {
      loadTrending();
    }
  }, [initialTrending]);

  const loadTrending = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('unified-music-search', {
        body: { trendingOnly: true }
      });
      if (error) throw error;
      setResults(data.results || []);
      setSources({ ...sources, spotify: true });
    } catch (error) {
      console.error('Trending load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setResults([]);
    
    try {
      const { data, error } = await supabase.functions.invoke('unified-music-search', {
        body: { 
          query: query.trim(), 
          type: searchType,
          limit: 30,
          aiEnrich,
          includeCharts,
          includeAcoustic,
        }
      });

      if (error) throw error;

      setResults(data.results || []);
      setSources(data.sources || {});
      
      if (data.results?.length === 0) {
        toast.info('No results found');
      } else {
        const sourcesCount = Object.values(data.sources).filter(Boolean).length;
        toast.success(`Found ${data.results.length} results from ${sourcesCount} sources`);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [query, searchType, aiEnrich, includeCharts, includeAcoustic]);

  const handlePlay = async (result: UnifiedResult) => {
    if (result.youtubeId) {
      // Play directly if we have YouTube ID
      onPlayYouTube(result.youtubeId, result.title, result.artist, result.thumbnail || '');
    } else if (result.type === 'track') {
      // Search YouTube for the track
      toast.loading('Finding playable version...');
      try {
        const { data } = await supabase.functions.invoke('youtube-search', {
          body: { 
            query: `${result.artist} ${result.title} official audio`,
            maxResults: 1,
            officialOnly: true
          }
        });
        
        if (data?.results?.[0]) {
          const video = data.results[0];
          onPlayYouTube(video.id, result.title, result.artist, video.thumbnail);
          toast.dismiss();
        } else {
          toast.dismiss();
          toast.error('No playable version found');
        }
      } catch (error) {
        toast.dismiss();
        toast.error('Failed to find playable version');
      }
    } else if (result.type === 'album') {
      // Open album detail - only for compatible sources
      const validSources = ['discogs', 'musicbrainz', 'youtube', 'billboard'] as const;
      const source = validSources.includes(result.source as typeof validSources[number]) 
        ? result.source as 'discogs' | 'musicbrainz' | 'youtube' | 'billboard'
        : 'musicbrainz';
      
      setSelectedAlbum({
        id: result.sourceId,
        title: result.title,
        artist: result.artist,
        year: result.year,
        coverArt: result.thumbnail,
        genres: result.genres,
        source,
      });
    } else if (result.type === 'artist') {
      setSelectedArtist(result.artist);
    }
  };

  const handleAddToPlaylist = (result: UnifiedResult) => {
    setPlaylistTrack({
      id: result.id,
      title: result.title,
      artist_name: result.artist,
      youtubeId: result.youtubeId,
      thumbnail: result.thumbnail,
    });
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'youtube': return <Youtube className="w-3 h-3" />;
      case 'discogs': return <Database className="w-3 h-3" />;
      case 'musicbrainz': return <Globe className="w-3 h-3" />;
      case 'billboard': return <TrendingUp className="w-3 h-3" />;
      case 'theaudiodb': return <Music className="w-3 h-3" />;
      case 'allmusic': return <Disc className="w-3 h-3" />;
      default: return <Music className="w-3 h-3" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'artist': return <User className="w-4 h-4" />;
      case 'album': return <Disc className="w-4 h-4" />;
      case 'track': return <Music className="w-4 h-4" />;
      default: return <Music className="w-4 h-4" />;
    }
  };

  // Get best available image for a result (prefer TheAudioDB, AllMusic, then default)
  const getBestThumbnail = (result: UnifiedResult): string | undefined => {
    return result.theAudioDBImage || result.allMusicImage || result.thumbnail;
  };

  // Show artist profile
  if (selectedArtist) {
    return (
      <GlobalArtistProfile
        artistName={selectedArtist}
        source="musicbrainz"
        onClose={() => setSelectedArtist(null)}
        onAddToPlaylist={setPlaylistTrack}
      />
    );
  }

  // Show album detail
  if (selectedAlbum) {
    return (
      <GlobalAlbumDetail
        album={selectedAlbum}
        onClose={() => setSelectedAlbum(null)}
        onAddToPlaylist={setPlaylistTrack}
        onOpenArtist={setSelectedArtist}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-cyan-400" />
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI Music Engine
            </span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Unified search across YouTube Music, Discogs, MusicBrainz & TheAudioDB
          </p>
        </div>
        
        {/* Source status */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge 
            variant="outline" 
            className={`text-xs ${sources.youtube ? 'border-red-500/50 text-red-400' : 'border-white/10 text-white/30'}`}
          >
            <Youtube className="w-3 h-3 mr-1" />
            YouTube
          </Badge>
          <Badge 
            variant="outline" 
            className={`text-xs ${sources.discogs ? 'border-orange-500/50 text-orange-400' : 'border-white/10 text-white/30'}`}
          >
            <Database className="w-3 h-3 mr-1" />
            Discogs
          </Badge>
          <Badge 
            variant="outline" 
            className={`text-xs ${sources.musicbrainz ? 'border-purple-500/50 text-purple-400' : 'border-white/10 text-white/30'}`}
          >
            <Globe className="w-3 h-3 mr-1" />
            MusicBrainz
          </Badge>
          <Badge 
            variant="outline" 
            className={`text-xs ${sources.billboard ? 'border-yellow-500/50 text-yellow-400' : 'border-muted text-muted-foreground'}`}
          >
            <TrendingUp className="w-3 h-3 mr-1" />
            Billboard
          </Badge>
          <Badge 
            variant="outline" 
            className={`text-xs ${sources.theaudiodb ? 'border-green-500/50 text-green-400' : 'border-muted text-muted-foreground'}`}
          >
            <Music className="w-3 h-3 mr-1" />
            AudioDB
          </Badge>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search any artist, album, or song..."
            className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 text-lg"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setAiEnrich(!aiEnrich)}
            className={`border-white/20 ${aiEnrich ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' : 'text-white/60'}`}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI
          </Button>
          
          <Button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold px-6"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Search
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Type Filter */}
      <Tabs value={searchType} onValueChange={(v) => setSearchType(v as typeof searchType)}>
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="all" className="data-[state=active]:bg-white/10">All</TabsTrigger>
          <TabsTrigger value="artist" className="data-[state=active]:bg-white/10">
            <User className="w-4 h-4 mr-1" /> Artists
          </TabsTrigger>
          <TabsTrigger value="album" className="data-[state=active]:bg-white/10">
            <Disc className="w-4 h-4 mr-1" /> Albums
          </TabsTrigger>
          <TabsTrigger value="track" className="data-[state=active]:bg-white/10">
            <Music className="w-4 h-4 mr-1" /> Songs
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Results */}
      <ScrollArea className="h-[calc(100vh-380px)]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Searching across all sources...</p>
            {aiEnrich && (
              <p className="text-sm text-purple-400 mt-2">
                <Sparkles className="w-4 h-4 inline mr-1" />
                Enriching with AI...
              </p>
            )}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Globe className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Search the global music library</p>
            <p className="text-sm mt-2">Access millions of tracks from YouTube Music, Discogs, MusicBrainz & TheAudioDB</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pb-32">
            {results
              .filter(r => searchType === 'all' || r.type === searchType)
              .map((result) => {
              const thumbnail = getBestThumbnail(result);
              
              return (
                <div
                  key={result.id}
                  className="group cursor-pointer"
                  onClick={() => handlePlay(result)}
                >
                  {/* Discogs-style card with large artwork */}
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-muted/30 mb-2">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={result.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '';
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted">
                        {result.type === 'artist' ? (
                          <User className="w-12 h-12 text-muted-foreground/50" />
                        ) : result.type === 'album' ? (
                          <Disc className="w-12 h-12 text-muted-foreground/50" />
                        ) : (
                          <Music className="w-12 h-12 text-muted-foreground/50" />
                        )}
                      </div>
                    )}
                    
                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                        <Play className="w-5 h-5 text-primary-foreground ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                    
                    {/* Source badge */}
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-black/60 backdrop-blur-sm text-white text-[10px] border-0 gap-1">
                        {getSourceIcon(result.source)}
                      </Badge>
                    </div>
                    
                    {/* Chart position badge */}
                    {result.chartPosition && (
                      <Badge className="absolute top-2 right-2 bg-yellow-500 text-black text-[10px] font-bold">
                        #{result.chartPosition.rank}
                      </Badge>
                    )}
                    
                    {/* Official/Playable badge */}
                    {(result.isOfficial || result.youtubeId) && (
                      <Badge className="absolute bottom-2 right-2 bg-green-500/90 text-white text-[10px] border-0">
                        {result.youtubeId ? '▶ Play' : '✓ Official'}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Info below artwork - Discogs style */}
                  <div className="space-y-0.5 px-1">
                    <p className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                      {result.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {result.artist}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <Badge variant="outline" className="text-[9px] border-border/50 text-muted-foreground h-4 px-1.5">
                        {result.type}
                      </Badge>
                      {result.year && (
                        <Badge variant="outline" className="text-[9px] border-border/50 text-muted-foreground h-4 px-1.5">
                          {result.year}
                        </Badge>
                      )}
                      {result.genres?.[0] && (
                        <Badge variant="outline" className="text-[9px] border-primary/30 text-primary/80 h-4 px-1.5">
                          {result.genres[0]}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Add to Playlist Dialog */}
      <AddToPlaylistDialog
        track={playlistTrack}
        open={!!playlistTrack}
        onOpenChange={(open) => !open && setPlaylistTrack(null)}
      />
    </div>
  );
}
