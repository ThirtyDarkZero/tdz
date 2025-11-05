import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableTrackItem } from "./SortableTrackItem";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Album {
  id: string;
  title: string;
  artist_name: string;
  genre?: string;
  description?: string;
  is_published?: boolean;
  release_date?: string;
  scheduled_release_date?: string;
  cover_art_path?: string;
}

interface Track {
  id: string;
  title: string;
  track_number?: number;
  duration: number;
  file_path: string;
}

interface EditAlbumDialogProps {
  album: Album | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditAlbumDialog = ({ album, open, onOpenChange, onSuccess }: EditAlbumDialogProps) => {
  const [title, setTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [releaseDate, setReleaseDate] = useState<Date | undefined>();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [availableTracks, setAvailableTracks] = useState<Track[]>([]);
  const [selectedAvailableTracks, setSelectedAvailableTracks] = useState<string[]>([]);
  const [showAddTracks, setShowAddTracks] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (album) {
      setTitle(album.title || "");
      setArtistName(album.artist_name || "");
      setGenre(album.genre || "");
      setDescription(album.description || "");
      setIsPublished(album.is_published || false);
      if (album.scheduled_release_date) {
        setReleaseDate(new Date(album.scheduled_release_date));
      } else if (album.release_date) {
        setReleaseDate(new Date(album.release_date));
      } else {
        setReleaseDate(undefined);
      }
      loadAlbumTracks();
      loadAvailableTracks();
      setShowAddTracks(false);
      setSelectedAvailableTracks([]);
    }
  }, [album]);

  const loadAlbumTracks = async () => {
    if (!album) return;

    try {
      const { data, error } = await supabase
        .from('tracks')
        .select('id, title, track_number, duration, file_path')
        .eq('album_id', album.id)
        .order('track_number', { ascending: true });

      if (error) throw error;
      setTracks(data || []);
    } catch (error: any) {
      console.error('Error loading album tracks:', error);
      toast({
        title: "Failed to load tracks",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const loadAvailableTracks = async () => {
    if (!album) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get tracks that don't belong to any album or belong to a different album
      const { data, error } = await supabase
        .from('tracks')
        .select('id, title, track_number, duration, file_path')
        .eq('user_id', user.id)
        .or(`album_id.is.null,album_id.neq.${album.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvailableTracks(data || []);
    } catch (error: any) {
      console.error('Error loading available tracks:', error);
      toast({
        title: "Failed to load available tracks",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setTracks((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleAvailableTrack = (trackId: string) => {
    setSelectedAvailableTracks(prev =>
      prev.includes(trackId) ? prev.filter(id => id !== trackId) : [...prev, trackId]
    );
  };

  const handleAddSelectedTracks = async () => {
    if (selectedAvailableTracks.length === 0 || !album) return;

    try {
      // Add selected tracks to album with appropriate track numbers
      const startingTrackNumber = tracks.length + 1;
      
      for (let i = 0; i < selectedAvailableTracks.length; i++) {
        const { error } = await supabase
          .from('tracks')
          .update({
            album_id: album.id,
            track_number: startingTrackNumber + i
          })
          .eq('id', selectedAvailableTracks[i]);

        if (error) throw error;
      }

      toast({
        title: "Tracks added",
        description: `${selectedAvailableTracks.length} track(s) added to album`
      });

      setSelectedAvailableTracks([]);
      setShowAddTracks(false);
      await loadAlbumTracks();
      await loadAvailableTracks();
    } catch (error: any) {
      console.error('Error adding tracks:', error);
      toast({
        title: "Failed to add tracks",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    if (!album) return;

    setSaving(true);
    try {
      // Update album metadata
      const { error: albumError } = await supabase
        .from('albums')
        .update({
          title,
          artist_name: artistName,
          genre,
          description,
          is_published: isPublished,
          scheduled_release_date: releaseDate ? format(releaseDate, "yyyy-MM-dd") : null,
        })
        .eq('id', album.id);

      if (albumError) throw albumError;

      // Update track numbers for reordered tracks
      for (let i = 0; i < tracks.length; i++) {
        const { error: trackError } = await supabase
          .from('tracks')
          .update({ track_number: i + 1 })
          .eq('id', tracks[i].id);

        if (trackError) throw trackError;
      }

      toast({
        title: "Album updated successfully",
        description: "All changes have been saved"
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating album:', error);
      toast({
        title: "Failed to update album",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Album</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Album Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter album title"
            />
          </div>

          <div>
            <Label htmlFor="artist">Artist Name</Label>
            <Input
              id="artist"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="Enter artist name"
            />
          </div>

          <div>
            <Label htmlFor="genre">Genre</Label>
            <Input
              id="genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="e.g., Hip Hop, Pop, Rock"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter album description"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="published"
              checked={isPublished}
              onCheckedChange={setIsPublished}
            />
            <Label htmlFor="published">Published</Label>
          </div>

          <div>
            <Label>Release Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {releaseDate ? format(releaseDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={releaseDate}
                  onSelect={setReleaseDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Tracks (Drag to reorder)</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddTracks(!showAddTracks)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Tracks
              </Button>
            </div>

            {showAddTracks && availableTracks.length > 0 && (
              <Card className="p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium">Available Tracks</Label>
                  {selectedAvailableTracks.length > 0 && (
                    <Button size="sm" onClick={handleAddSelectedTracks}>
                      Add {selectedAvailableTracks.length} Track(s)
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {availableTracks.map((track) => (
                      <div
                        key={track.id}
                        className="flex items-center space-x-3 p-2 rounded hover:bg-accent/50 transition-colors"
                      >
                        <Checkbox
                          checked={selectedAvailableTracks.includes(track.id)}
                          onCheckedChange={() => toggleAvailableTrack(track.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm">{track.title}</p>
                          <p className="text-xs text-muted-foreground">{formatDuration(track.duration)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            )}

            {showAddTracks && availableTracks.length === 0 && (
              <Card className="p-4 mb-4 text-center">
                <p className="text-sm text-muted-foreground">No available tracks to add</p>
              </Card>
            )}

            <div className="space-y-2">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={tracks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  {tracks.map((track, index) => (
                    <SortableTrackItem
                      key={track.id}
                      track={track as any}
                      index={index}
                      editingTrackId={null}
                      onEdit={() => {}}
                      onTitleChange={() => {}}
                      onRemove={() => {}}
                      onBlur={() => {}}
                      disabled={false}
                      formatDuration={formatDuration}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
