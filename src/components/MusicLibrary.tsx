import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Heart, MoreVertical, Edit2, Trash2, CheckSquare, Square, Calendar, Album } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { QuickPublishButton } from "./QuickPublishButton";
import { TrackEditDialog } from "./TrackEditDialog";
import { CreateAlbumDialog } from "./CreateAlbumDialog";
import { EditAlbumDialog } from "./EditAlbumDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

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
  genre?: string;
  description?: string;
  is_published?: boolean;
  release_date?: string;
  scheduled_release_date?: string;
}

interface MusicLibraryProps {
  onPlayTrack: (track: Track, queue: Track[]) => void;
}

export const MusicLibrary = ({ onPlayTrack }: MusicLibraryProps) => {
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [unpublishedTracks, setUnpublishedTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [deletingTrack, setDeletingTrack] = useState<Track | null>(null);
  const [archivingTrack, setArchivingTrack] = useState<Track | null>(null);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [schedulingTrack, setSchedulingTrack] = useState<Track | null>(null);
  const [releaseDate, setReleaseDate] = useState<Date>();
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

  const handleDeleteTrack = async () => {
    if (!deletingTrack) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('track-files')
        .remove([deletingTrack.file_path]);

      if (storageError) console.error('Storage deletion error:', storageError);

      // Delete from database
      const { error: dbError } = await supabase
        .from('tracks')
        .delete()
        .eq('id', deletingTrack.id);

      if (dbError) throw dbError;

      toast({ title: "Track deleted successfully" });
      loadLibrary();
      setDeletingTrack(null);
    } catch (error: any) {
      console.error('Error deleting track:', error);
      toast({
        title: "Failed to delete track",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleTrackSelection = (trackId: string) => {
    setSelectedTracks(prev =>
      prev.includes(trackId) ? prev.filter(id => id !== trackId) : [...prev, trackId]
    );
  };

  const handleArchiveTrack = async () => {
    if (!archivingTrack) return;

    try {
      // Update track to set is_published to false (archive it)
      const { error } = await supabase
        .from('tracks')
        .update({ is_published: false })
        .eq('id', archivingTrack.id);

      if (error) throw error;

      toast({ 
        title: "Track archived",
        description: "Moved to unpublished tracks"
      });
      loadLibrary();
      setArchivingTrack(null);
    } catch (error: any) {
      console.error('Error archiving track:', error);
      toast({
        title: "Failed to archive track",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleScheduleRelease = async () => {
    if (!schedulingTrack || !releaseDate) return;

    try {
      const releaseDateStr = format(releaseDate, "yyyy-MM-dd");
      const today = format(new Date(), "yyyy-MM-dd");
      const shouldPublishNow = releaseDateStr <= today;

      const { error } = await supabase
        .from('tracks')
        .update({
          is_published: shouldPublishNow,
          release_date: releaseDateStr
        })
        .eq('id', schedulingTrack.id);

      if (error) throw error;

      toast({ 
        title: shouldPublishNow ? "Released!" : "Release scheduled!",
        description: shouldPublishNow 
          ? `${schedulingTrack.title} is now live`
          : `${schedulingTrack.title} will go live on ${format(releaseDate, "PPP")}`
      });
      
      loadLibrary();
      setSchedulingTrack(null);
      setReleaseDate(undefined);
    } catch (error: any) {
      console.error('Error scheduling release:', error);
      toast({
        title: "Failed to schedule release",
        description: error.message,
        variant: "destructive"
      });
    }
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

  const TrackList = ({ tracks: trackList, showPublish, showSelection }: { tracks: Track[], showPublish?: boolean, showSelection?: boolean }) => (
    <div className="space-y-2">
      {trackList.map((track, index) => (
        <div
          key={track.id}
          className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-accent/50 transition-colors group"
        >
          {showSelection && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleTrackSelection(track.id)}
              className="flex-shrink-0"
            >
              {selectedTracks.includes(track.id) ? (
                <CheckSquare className="h-4 w-4 text-primary" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPlayTrack(track, trackList)}
            className="opacity-0 group-hover:opacity-100 hidden sm:flex"
          >
            <Play className="h-4 w-4" />
          </Button>
          <span className="text-muted-foreground w-6 group-hover:hidden text-sm">{index + 1}</span>
          
          <CoverArt track={track} className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover flex-shrink-0" />
          
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate text-sm sm:text-base">{track.title}</p>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{track.artist_name}</p>
          </div>
          
          <span className="text-xs sm:text-sm text-muted-foreground hidden lg:inline">{track.genre}</span>
          <span className="text-xs sm:text-sm text-muted-foreground hidden md:inline">{formatDuration(track.duration)}</span>
          {!showPublish && <span className="text-xs sm:text-sm text-muted-foreground hidden xl:inline">{track.play_count.toLocaleString()} plays</span>}
          
          {showPublish && (
            <QuickPublishButton 
              trackId={track.id}
              isPublished={false}
              onPublishChange={loadLibrary}
            />
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditingTrack(track)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Track
              </DropdownMenuItem>
              {showPublish ? (
                <DropdownMenuItem onClick={() => setSchedulingTrack(track)}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Release
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => setArchivingTrack(track)}>
                  <Album className="h-4 w-4 mr-2" />
                  Archive Track
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => setDeletingTrack(track)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Track
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return <div className="text-center py-12">Loading your library...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Your Library</h1>
      </div>

      <Tabs defaultValue="unpublished" className="space-y-4 md:space-y-6">
        <div className="overflow-x-auto -mx-4 px-4">
          <TabsList className="inline-flex min-w-max">
            <TabsTrigger value="unpublished" className="text-xs sm:text-sm">
              Unpublished ({unpublishedTracks.length})
            </TabsTrigger>
            <TabsTrigger value="tracks" className="text-xs sm:text-sm">Published</TabsTrigger>
            <TabsTrigger value="albums" className="text-xs sm:text-sm">Albums</TabsTrigger>
            <TabsTrigger value="liked" className="text-xs sm:text-sm">Liked</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="unpublished">
          {unpublishedTracks.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-2">No unpublished tracks</p>
              <p className="text-sm text-muted-foreground">Upload tracks to get started</p>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Publish your tracks to make them visible in Discovery and on your Artist Profile
                </p>
                {selectedTracks.length > 0 && (
                  <Button onClick={() => setShowCreateAlbum(true)}>
                    <Album className="h-4 w-4 mr-2" />
                    Create Album ({selectedTracks.length})
                  </Button>
                )}
              </div>
              <TrackList tracks={unpublishedTracks} showPublish showSelection />
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {albums.map((album) => (
              <Card 
                key={album.id} 
                className="group relative p-3 md:p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/album/${album.id}`)}
              >
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/80 backdrop-blur-sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        setEditingAlbum(album);
                      }}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit Album
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <img
                  src={getCoverUrl(album.cover_art_path)}
                  alt={album.title}
                  className="w-full aspect-square rounded-lg object-cover mb-2 md:mb-3"
                />
                <p className="font-medium truncate text-sm md:text-base">{album.title}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{album.artist_name}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-muted-foreground">{album.total_tracks} tracks</p>
                  {album.is_published && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Published</span>
                  )}
                </div>
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

      <TrackEditDialog
        track={editingTrack}
        open={!!editingTrack}
        onOpenChange={(open) => !open && setEditingTrack(null)}
        onSuccess={loadLibrary}
      />

      <EditAlbumDialog
        album={editingAlbum}
        open={!!editingAlbum}
        onOpenChange={(open) => !open && setEditingAlbum(null)}
        onSuccess={loadLibrary}
      />

      <CreateAlbumDialog
        selectedTracks={selectedTracks}
        open={showCreateAlbum}
        onOpenChange={setShowCreateAlbum}
        onSuccess={() => {
          loadLibrary();
          setSelectedTracks([]);
        }}
      />

      <AlertDialog open={!!deletingTrack} onOpenChange={(open) => !open && setDeletingTrack(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Track</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingTrack?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTrack} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!archivingTrack} onOpenChange={(open) => !open && setArchivingTrack(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Track</AlertDialogTitle>
            <AlertDialogDescription>
              Archive "{archivingTrack?.title}"? It will be moved to your unpublished tracks and removed from public view.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveTrack}>
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!schedulingTrack} onOpenChange={(open) => !open && setSchedulingTrack(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Schedule Release</AlertDialogTitle>
            <AlertDialogDescription>
              Choose a release date for "{schedulingTrack?.title}"
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <Calendar className="mr-2 h-4 w-4" />
                  {releaseDate ? format(releaseDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={releaseDate}
                  onSelect={setReleaseDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleScheduleRelease} disabled={!releaseDate}>
              Schedule Release
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};