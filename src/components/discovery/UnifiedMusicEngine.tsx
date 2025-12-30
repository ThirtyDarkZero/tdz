import { useState, useCallback } from "react";
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
  source: 'musicbrainz' | 'discogs' | 'youtube' | 'billboard';
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
}

interface UnifiedMusicEngineProps {
  onPlayYouTube: (videoId: string, title: string, artist: string, thumbnail: string) => void;
}

export function UnifiedMusicEngine({ onPlayYouTube }: UnifiedMusicEngineProps) {
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
  const [sources, setSources] = useState({ musicbrainz: false, discogs: false, youtube: false, billboard: false });

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
          <p className="text-sm text-white/60 mt-1">
            Unified search across YouTube Music, Discogs & MusicBrainz
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
            className={`text-xs ${sources.billboard ? 'border-yellow-500/50 text-yellow-400' : 'border-white/10 text-white/30'}`}
          >
            <TrendingUp className="w-3 h-3 mr-1" />
            Billboard
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
            <Loader2 className="w-10 h-10 animate-spin text-cyan-500 mb-4" />
            <p className="text-white/60">Searching across all sources...</p>
            {aiEnrich && (
              <p className="text-sm text-purple-400 mt-2">
                <Sparkles className="w-4 h-4 inline mr-1" />
                Enriching with AI...
              </p>
            )}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20 text-white/40">
            <Globe className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Search the global music library</p>
            <p className="text-sm mt-2">Access millions of tracks from YouTube Music, Discogs & MusicBrainz</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-32">
            {results.map((result) => (
              <div
                key={result.id}
                className="group bg-white/5 rounded-xl overflow-hidden border border-white/5 hover:border-cyan-500/30 transition-all hover:bg-white/[0.07] cursor-pointer"
                onClick={() => handlePlay(result)}
              >
                <div className="flex gap-4 p-4">
                  {/* Thumbnail */}
                  <div className="relative flex-shrink-0">
                    <div className={`w-20 h-20 ${result.type === 'artist' ? 'rounded-full' : 'rounded-lg'} overflow-hidden bg-white/10`}>
                      {result.thumbnail ? (
                        <img
                          src={result.thumbnail}
                          alt={result.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {getTypeIcon(result.type)}
                        </div>
                      )}
                    </div>
                    
                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                      <Play className="w-8 h-8 text-white" fill="white" />
                    </div>
                    
                    {/* Official badge */}
                    {result.isOfficial && (
                      <Badge className="absolute -top-1 -right-1 bg-green-500 text-[10px] px-1 py-0">
                        ✓
                      </Badge>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-white font-semibold truncate">{result.title}</p>
                        <p className="text-sm text-white/60 truncate">{result.artist}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] flex-shrink-0 border-white/20">
                        {getSourceIcon(result.source)}
                      </Badge>
                    </div>
                    
                    {/* Metadata */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px] border-white/10 text-white/50">
                        {result.type}
                      </Badge>
                      {result.year && (
                        <Badge variant="outline" className="text-[10px] border-white/10 text-white/50">
                          {result.year}
                        </Badge>
                      )}
                      {result.youtubeId && (
                        <Badge className="text-[10px] bg-red-600/20 text-red-400">
                          <Youtube className="w-2.5 h-2.5 mr-0.5" />
                          Playable
                        </Badge>
                      )}
                    </div>

                    {/* AI Summary */}
                    {result.aiSummary && (
                      <p className="text-xs text-purple-300/80 mt-2 line-clamp-2">
                        <Sparkles className="w-3 h-3 inline mr-1" />
                        {result.aiSummary}
                      </p>
                    )}

                    {/* Mood/Genre tags */}
                    {(result.moodTags?.length || result.genres?.length) && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {(result.moodTags || result.genres || []).slice(0, 3).map((tag) => (
                          <Badge 
                            key={tag} 
                            variant="outline" 
                            className="text-[9px] border-cyan-500/30 text-cyan-400/80 px-1.5 py-0"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border-t border-white/5">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-white/60 hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToPlaylist(result);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-white/60 hover:text-white"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-cyan-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlay(result);
                    }}
                  >
                    {result.type === 'artist' ? 'View' : 'Play'}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
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
