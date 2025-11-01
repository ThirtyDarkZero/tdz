import { useState, useEffect } from "react";
import { Play, Plus, Heart, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { QuickPublishButton } from "./QuickPublishButton";

interface Track {
  id: string;
  title: string;
  artist_name: string;
  duration: number;
  file_path: string;
  play_count: number;
  is_published?: boolean;
  album_cover_path?: string;
  album_cover_bucket?: string;
  genre?: string;
  ai_tags?: {
    metadata?: {
      isMotionCover?: boolean;
      artworkUrl?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  album?: {
    title: string;
    cover_art_path?: string;
  };
}

interface Album {
  id: string;
  title: string;
  artist_name: string;
  cover_art_path?: string;
  total_tracks: number;
  play_count: number;
}

interface MusicLibraryProps {
  onPlayTrack: (track: Track, queue: Track[]) => void;
}

export const MusicLibrary = ({ onPlayTrack }: MusicLibraryProps) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [unpublishedTracks, setUnpublishedTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load user's published tracks
      const { data: tracksData } = await supabase
        .from('tracks')
        .select(`
          *,
          album:albums(title, cover_art_path)
        `)
        .eq('user_id', user.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      // Load user's unpublished tracks
      const { data: unpublishedData } = await supabase
        .from('tracks')
        .select(`
          *,
          album:albums(title, cover_art_path)
        `)
        .eq('user_id', user.id)
        .eq('is_published', false)
        .order('created_at', { ascending: false });

      // Load albums
      const { data: albumsData } = await supabase
        .from('albums')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Load liked tracks
      const { data: likedData } = await supabase
        .from('user_library')
        .select(`
          track:tracks(
            *,
            album:albums(title, cover_art_path)
          )
        `)
        .eq('user_id', user.id)
        .eq('library_type', 'liked_track');

      setTracks(tracksData as Track[] || []);
      setUnpublishedTracks(unpublishedData as Track[] || []);
      setAlbums(albumsData || []);
      setLikedTracks(likedData?.map(item => item.track as Track).filter(Boolean) || []);
    } catch (error: any) {
      console.error('Error loading library:', error);
      toast({
        title: "Failed to load library",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCoverUrl = (path?: string, bucket: string = 'album-covers') => {
    if (!path) return '/placeholder.svg';
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  };

  const CoverArt = ({ track, className }: { track: Track, className?: string }) => {
    const isMotion = track.ai_tags?.metadata?.isMotionCover;
    const coverPath = track.album_cover_path || track.album?.cover_art_path || track.ai_tags?.metadata?.artworkUrl;
    const bucket = track.album_cover_bucket || (isMotion ? 'motion-covers' : 'album-covers');
    const coverUrl = getCoverUrl(coverPath, bucket);

    if (isMotion && coverPath) {
      return (
        <video
          src={coverUrl}
          className={className}
          autoPlay
          loop
          muted
          playsInline
        />
      );
    }

    return (
      <img
        src={coverUrl}
        alt={track.title}
        className={className}
      />
    );
  };

  const TrackList = ({ tracks: trackList, showPublish }: { tracks: Track[], showPublish?: boolean }) => (
    <div className="space-y-2">
      {trackList.map((track, index) => (
        <div
          key={track.id}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors group"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPlayTrack(track, trackList)}
            className="opacity-0 group-hover:opacity-100"
          >
            <Play className="h-4 w-4" />
          </Button>
          <span className="text-muted-foreground w-6 group-hover:hidden">{index + 1}</span>
          
          <CoverArt track={track} className="w-12 h-12 rounded object-cover" />
          
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{track.title}</p>
            <p className="text-sm text-muted-foreground truncate">{track.artist_name}</p>
          </div>
          
          <span className="text-sm text-muted-foreground">{track.genre}</span>
          <span className="text-sm text-muted-foreground">{formatDuration(track.duration)}</span>
          {!showPublish && <span className="text-sm text-muted-foreground">{track.play_count.toLocaleString()} plays</span>}
          
          {showPublish && (
            <QuickPublishButton 
              trackId={track.id}
              isPublished={false}
              onPublishChange={loadLibrary}
            />
          )}
          
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return <div className="text-center py-12">Loading your library...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Your Library</h1>
      </div>

      <Tabs defaultValue="unpublished" className="space-y-6">
        <TabsList>
          <TabsTrigger value="unpublished">Unpublished ({unpublishedTracks.length})</TabsTrigger>
          <TabsTrigger value="tracks">Published Tracks</TabsTrigger>
          <TabsTrigger value="albums">Albums</TabsTrigger>
          <TabsTrigger value="liked">Liked Songs</TabsTrigger>
        </TabsList>

        <TabsContent value="unpublished">
          {unpublishedTracks.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-2">No unpublished tracks</p>
              <p className="text-sm text-muted-foreground">Upload tracks to get started</p>
            </Card>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Publish your tracks to make them visible in Discovery and on your Artist Profile
              </p>
              <TrackList tracks={unpublishedTracks} showPublish />
            </>
          )}
        </TabsContent>

        <TabsContent value="tracks">
          {tracks.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No published tracks yet</p>
            </Card>
          ) : (
            <TrackList tracks={tracks} />
          )}
        </TabsContent>

        <TabsContent value="albums">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {albums.map((album) => (
              <Card key={album.id} className="p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                <img
                  src={getCoverUrl(album.cover_art_path)}
                  alt={album.title}
                  className="w-full aspect-square rounded-lg object-cover mb-3"
                />
                <p className="font-medium truncate">{album.title}</p>
                <p className="text-sm text-muted-foreground truncate">{album.artist_name}</p>
                <p className="text-xs text-muted-foreground mt-1">{album.total_tracks} tracks</p>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="liked">
          {likedTracks.length === 0 ? (
            <Card className="p-12 text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No liked songs yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Start liking songs to build your collection
              </p>
            </Card>
          ) : (
            <TrackList tracks={likedTracks} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};