import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Play, TrendingUp, Music2, Loader2, BarChart3, ChevronRight, ListMusic, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePlayer } from '@/contexts/PlayerContext';
import { toast } from 'sonner';
import { AddToPlaylistDialog } from './AddToPlaylistDialog';

interface EditorialPlaylist {
  id: string;
  name: string;
  description: string;
  image: string;
  trackCount: number;
  category: 'charts' | 'genre';
  source: 'billboard' | 'bpm-supreme';
}

interface ChartTrack {
  position: number;
  title: string;
  artist: string;
  weeksOnChart?: number;
  bpm?: number;
}

export function EditorialPlaylistsSection() {
  const [playlists, setPlaylists] = useState<EditorialPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlaylist, setSelectedPlaylist] = useState<EditorialPlaylist | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<ChartTrack[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [addToPlaylistTrack, setAddToPlaylistTrack] = useState<any>(null);
  const { playTrack, addToQueue } = usePlayer();

  useEffect(() => {
    fetchEditorialPlaylists();
  }, []);

  const fetchEditorialPlaylists = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('editorial-charts', {
        body: { action: 'editorial-playlists' }
      });

      if (error) throw error;
      setPlaylists(data?.playlists || []);
    } catch (error) {
      console.error('Failed to fetch editorial playlists:', error);
      // Fallback data
      setPlaylists([
        { id: 'billboard-hot-100', name: 'Billboard Hot 100', description: 'The weeks most popular songs', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Billboard_Hot_100_logo.svg/512px-Billboard_Hot_100_logo.svg.png', trackCount: 100, category: 'charts', source: 'billboard' },
        { id: 'billboard-global-200', name: 'Billboard Global 200', description: 'Most popular songs worldwide', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Billboard_logo.svg/512px-Billboard_logo.svg.png', trackCount: 200, category: 'charts', source: 'billboard' },
        { id: 'bpm-hip-hop', name: 'Hip Hop Top 50', description: 'Trending Hip Hop & Rap', image: 'https://i.scdn.co/image/ab67706f00000002b10f3d1cf5b0a2da7ab47bc4', trackCount: 50, category: 'genre', source: 'bpm-supreme' },
        { id: 'bpm-pop', name: 'Pop Top 50', description: 'Chart-topping Pop hits', image: 'https://i.scdn.co/image/ab67706f00000002724554ed6bed6f051d9b0bfc', trackCount: 50, category: 'genre', source: 'bpm-supreme' },
        { id: 'bpm-dance', name: 'Dance Top 50', description: 'Hot Dance & Electronic', image: 'https://i.scdn.co/image/ab67706f00000002396f1b30b1afda0f1f78c2d2', trackCount: 50, category: 'genre', source: 'bpm-supreme' },
        { id: 'bpm-rnb', name: 'R&B Top 50', description: 'Smooth R&B vibes', image: 'https://i.scdn.co/image/ab67706f00000002e6a04c81b2097f7d0c8ec24f', trackCount: 50, category: 'genre', source: 'bpm-supreme' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openPlaylistDetail = async (playlist: EditorialPlaylist) => {
    setSelectedPlaylist(playlist);
    setLoadingTracks(true);
    
    try {
      let tracks: ChartTrack[] = [];
      
      if (playlist.source === 'billboard') {
        const chartId = playlist.id.replace('billboard-', '');
        const { data, error } = await supabase.functions.invoke('editorial-charts', {
          body: { action: 'billboard', chart: chartId }
        });
        if (!error && data?.tracks) {
          tracks = data.tracks;
        }
      } else {
        const genreId = playlist.id.replace('bpm-', '');
        const { data, error } = await supabase.functions.invoke('editorial-charts', {
          body: { action: 'genre-top50', genre: genreId }
        });
        if (!error && data?.tracks) {
          tracks = data.tracks;
        }
      }
      
      setPlaylistTracks(tracks);
    } catch (error) {
      console.error('Failed to fetch playlist tracks:', error);
      toast.error('Failed to load playlist tracks');
    } finally {
      setLoadingTracks(false);
    }
  };

  const playTrackFromPlaylist = async (track: ChartTrack, allTracks: ChartTrack[]) => {
    setPlayingTrackId(`${track.position}-${track.title}`);
    
    try {
      const { data } = await supabase.functions.invoke('youtube-search', {
        body: {
          query: `${track.title} ${track.artist} official audio`,
          maxResults: 1,
          officialOnly: true,
        },
      });

      const results = data?.results || [];
      if (results.length === 0) {
        toast.error('Could not find playable version');
        return;
      }

      const playable = {
        id: `yt-${results[0].id}`,
        title: track.title,
        artist_name: track.artist,
        duration: 0,
        file_path: '',
        play_count: 0,
        source: 'youtube' as const,
        youtubeId: results[0].id,
        thumbnail: results[0].thumbnail,
      };

      // Queue remaining tracks
      const trackIndex = allTracks.findIndex(t => t.title === track.title && t.artist === track.artist);
      const remainingTracks = allTracks.slice(trackIndex + 1);
      
      for (const t of remainingTracks.slice(0, 10)) {
        const { data: searchData } = await supabase.functions.invoke('youtube-search', {
          body: { query: `${t.title} ${t.artist} official audio`, maxResults: 1 }
        });
        if (searchData?.results?.[0]) {
          addToQueue({
            id: `yt-${searchData.results[0].id}`,
            title: t.title,
            artist_name: t.artist,
            duration: 0,
            file_path: '',
            play_count: 0,
            source: 'youtube' as const,
            youtubeId: searchData.results[0].id,
            thumbnail: searchData.results[0].thumbnail,
          });
        }
      }

      playTrack(playable);
      toast.success(`Now playing: ${track.title}`);
    } catch (error) {
      console.error('Error playing track:', error);
      toast.error('Failed to play track');
    } finally {
      setPlayingTrackId(null);
    }
  };

  const playEntirePlaylist = async () => {
    if (playlistTracks.length === 0) return;
    await playTrackFromPlaylist(playlistTracks[0], playlistTracks);
  };

  const handleAddToPlaylist = (track: ChartTrack) => {
    setAddToPlaylistTrack({
      id: `external-${track.title}-${track.artist}`,
      title: track.title,
      artist_name: track.artist,
      source: 'external',
    });
  };

  if (loading) {
    return (
      <section className="py-8">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="w-48 h-64 rounded-xl flex-shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Charts & Top 50</h2>
              <p className="text-sm text-muted-foreground">Billboard charts & BPM Supreme genre rankings</p>
            </div>
          </div>
          <Button variant="ghost" className="gap-2">
            View All <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-4">
            {playlists.map((playlist, index) => (
              <Card
                key={playlist.id}
                className="w-48 flex-shrink-0 overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card/50 backdrop-blur-sm border-border/50"
                onClick={() => openPlaylistDetail(playlist)}
              >
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={playlist.image}
                    alt={playlist.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://i.scdn.co/image/ab67706f00000002724554ed6bed6f051d9b0bfc';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Button
                    size="icon"
                    className="absolute bottom-3 right-3 rounded-full h-12 w-12 bg-orange-500 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 hover:bg-orange-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPlaylistDetail(playlist);
                    }}
                  >
                    <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                  </Button>
                  <Badge 
                    className={`absolute top-3 left-3 border-0 text-xs ${
                      playlist.source === 'billboard' 
                        ? 'bg-red-500/90 text-white' 
                        : 'bg-orange-500/90 text-white'
                    }`}
                  >
                    {playlist.source === 'billboard' ? 'Billboard' : 'BPM'}
                  </Badge>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold truncate text-sm">{playlist.name}</h3>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {playlist.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </section>

      {/* Playlist Detail Dialog */}
      <Dialog open={!!selectedPlaylist} onOpenChange={() => setSelectedPlaylist(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-start gap-4">
              {selectedPlaylist?.image && (
                <img
                  src={selectedPlaylist.image}
                  alt={selectedPlaylist.name}
                  className="w-24 h-24 rounded-lg object-cover shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://i.scdn.co/image/ab67706f00000002724554ed6bed6f051d9b0bfc';
                  }}
                />
              )}
              <div className="flex-1">
                <Badge className={`mb-2 ${
                  selectedPlaylist?.source === 'billboard' 
                    ? 'bg-red-500/20 text-red-400' 
                    : 'bg-orange-500/20 text-orange-400'
                }`}>
                  {selectedPlaylist?.source === 'billboard' ? 'Billboard Charts' : 'BPM Supreme'}
                </Badge>
                <DialogTitle className="text-xl">{selectedPlaylist?.name}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">{selectedPlaylist?.description}</p>
                <Button 
                  className="mt-3 gap-2 bg-orange-500 hover:bg-orange-600"
                  onClick={playEntirePlaylist}
                  disabled={loadingTracks || playlistTracks.length === 0}
                >
                  <Play className="w-4 h-4" fill="currentColor" />
                  Play All
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <ScrollArea className="flex-1 mt-4">
            {loadingTracks ? (
              <div className="space-y-2">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-1 pr-4">
                {playlistTracks.map((track) => (
                  <div
                    key={`${track.position}-${track.title}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 group cursor-pointer transition-colors"
                    onClick={() => playTrackFromPlaylist(track, playlistTracks)}
                  >
                    <span className="w-8 text-center text-sm font-medium text-muted-foreground">
                      {track.position}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{track.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                    </div>
                    {track.weeksOnChart && (
                      <Badge variant="outline" className="text-xs hidden sm:flex">
                        {track.weeksOnChart}w
                      </Badge>
                    )}
                    {track.bpm && (
                      <Badge variant="secondary" className="text-xs hidden sm:flex">
                        {track.bpm} BPM
                      </Badge>
                    )}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToPlaylist(track);
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        disabled={playingTrackId === `${track.position}-${track.title}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          playTrackFromPlaylist(track, playlistTracks);
                        }}
                      >
                        {playingTrackId === `${track.position}-${track.title}` ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" fill="currentColor" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Add to Playlist Dialog */}
      {addToPlaylistTrack && (
        <AddToPlaylistDialog
          track={addToPlaylistTrack}
          open={!!addToPlaylistTrack}
          onOpenChange={() => setAddToPlaylistTrack(null)}
        />
      )}
    </>
  );
}
