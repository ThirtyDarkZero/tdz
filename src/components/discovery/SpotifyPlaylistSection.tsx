import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, Music, Sparkles, ChevronRight, ListMusic } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SpotifyPlaylist {
  id: string;
  name: string;
  description?: string;
  image?: string;
  tracks: number;
  source: string;
}

interface SpotifyPlaylistSectionProps {
  onPlaylistClick?: (playlist: SpotifyPlaylist) => void;
  onViewAll?: () => void;
}

export function SpotifyPlaylistSection({ onPlaylistClick, onViewAll }: SpotifyPlaylistSectionProps) {
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpotifyPlaylists();
  }, []);

  const fetchSpotifyPlaylists = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('spotify-trending', {
        body: { action: 'featured' }
      });

      if (error) throw error;

      const featured =
        data?.data?.featuredPlaylists ??
        // fallback for older response shapes
        (data as any)?.featuredPlaylists ??
        [];

      if (!Array.isArray(featured) || featured.length === 0) {
        throw new Error('No featured playlists returned');
      }

      setPlaylists(featured);
    } catch (error) {
      console.error('Failed to fetch Spotify playlists:', error);
      // Use fallback data
      setPlaylists([
        { id: '1', name: "Today's Top Hits", description: 'The hottest tracks right now', image: 'https://i.scdn.co/image/ab67706f00000002724554ed6bed6f051d9b0bfc', tracks: 50, source: 'spotify' },
        { id: '2', name: 'RapCaviar', description: 'New hip hop and R&B', image: 'https://i.scdn.co/image/ab67706f00000002b10f3d1cf5b0a2da7ab47bc4', tracks: 50, source: 'spotify' },
        { id: '3', name: 'Hot Country', description: 'Country hits', image: 'https://i.scdn.co/image/ab67706f000000023e0130fcd5d106f1402b4707', tracks: 50, source: 'spotify' },
        { id: '4', name: 'Viva Latino', description: 'Latin music vibes', image: 'https://i.scdn.co/image/ab67706f000000025af3ba9a50672e98c5c8ea9c', tracks: 50, source: 'spotify' },
        { id: '5', name: 'Rock Classics', description: 'Rock legends', image: 'https://i.scdn.co/image/ab67706f00000002fe6d8d1019d5b302213e3730', tracks: 100, source: 'spotify' },
        { id: '6', name: 'Chill Hits', description: 'Relaxing vibes', image: 'https://i.scdn.co/image/ab67706f00000002b60db5d1bcdd9c4fd1ebcffe', tracks: 75, source: 'spotify' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-8">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-24" />
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
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Featured Playlists</h2>
            <p className="text-sm text-muted-foreground">Curated collections from global charts</p>
          </div>
        </div>
        <Button variant="ghost" onClick={onViewAll} className="gap-2">
          View All <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-4">
          {playlists.map((playlist, index) => (
            <Card
              key={playlist.id}
              className="w-48 flex-shrink-0 overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card/50 backdrop-blur-sm border-border/50"
              onClick={() => onPlaylistClick?.(playlist)}
            >
              <div className="relative aspect-square overflow-hidden">
                {playlist.image ? (
                  <img
                    src={playlist.image}
                    alt={playlist.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                    <ListMusic className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Button
                  size="icon"
                  className="absolute bottom-3 right-3 rounded-full h-12 w-12 bg-primary shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0"
                >
                  <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                </Button>
                <Badge className="absolute top-3 left-3 bg-green-500/90 text-white border-0 text-xs">
                  #{index + 1}
                </Badge>
              </div>
              <div className="p-4">
                <h3 className="font-semibold truncate text-sm">{playlist.name}</h3>
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {playlist.description || `${playlist.tracks} tracks`}
                </p>
              </div>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
}
