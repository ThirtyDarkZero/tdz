import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateAlbumDialogProps {
  selectedTracks: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateAlbumDialog = ({ selectedTracks, open, onOpenChange, onSuccess }: CreateAlbumDialogProps) => {
  const [title, setTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [releaseDate, setReleaseDate] = useState<Date>();
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!title || !artistName) {
      toast({ title: "Title and artist name required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get the first track's cover art
      const { data: firstTrack } = await supabase
        .from('tracks')
        .select('album_cover_path')
        .in('id', selectedTracks)
        .limit(1)
        .maybeSingle();

      // Create album
      const { data: albumData, error: albumError } = await supabase
        .from('albums')
        .insert({
          user_id: user.id,
          title,
          artist_name: artistName,
          genre: genre || null,
          description: description || null,
          total_tracks: selectedTracks.length,
          is_published: false,
          release_date: releaseDate ? format(releaseDate, 'yyyy-MM-dd') : null,
          scheduled_release_date: releaseDate ? format(releaseDate, 'yyyy-MM-dd') : null,
          cover_art_path: firstTrack?.album_cover_path || null
        })
        .select()
        .single();

      if (albumError) throw albumError;

      // Update tracks with album_id and track_number
      for (let i = 0; i < selectedTracks.length; i++) {
        const { error: updateError } = await supabase
          .from('tracks')
          .update({ 
            album_id: albumData.id,
            track_number: i + 1
          })
          .eq('id', selectedTracks[i]);

        if (updateError) throw updateError;
      }

      toast({ 
        title: "Album created successfully",
        description: `${selectedTracks.length} tracks added to album`
      });
      
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setTitle("");
      setArtistName("");
      setGenre("");
      setDescription("");
      setReleaseDate(undefined);
    } catch (error: any) {
      console.error('Error creating album:', error);
      toast({
        title: "Failed to create album",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Album from Selected Tracks</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="album-title">Album Title *</Label>
            <Input
              id="album-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Your album name"
            />
          </div>
          <div>
            <Label htmlFor="album-artist">Artist Name *</Label>
            <Input
              id="album-artist"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="Your artist name"
            />
          </div>
          <div>
            <Label htmlFor="album-genre">Genre</Label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger>
                <SelectValue placeholder="Select genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pop">Pop</SelectItem>
                <SelectItem value="rock">Rock</SelectItem>
                <SelectItem value="hip-hop">Hip Hop</SelectItem>
                <SelectItem value="electronic">Electronic</SelectItem>
                <SelectItem value="jazz">Jazz</SelectItem>
                <SelectItem value="classical">Classical</SelectItem>
                <SelectItem value="country">Country</SelectItem>
                <SelectItem value="r&b">R&B</SelectItem>
                <SelectItem value="indie">Indie</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="album-description">Description</Label>
            <Textarea
              id="album-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell fans about this album..."
              rows={3}
            />
          </div>
          <div>
            <Label>Release Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal mt-2"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {releaseDate ? format(releaseDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 pointer-events-auto z-50" align="start" sideOffset={4}>
                <Calendar
                  mode="single"
                  selected={releaseDate}
                  onSelect={setReleaseDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={saving}>
            {saving ? "Creating..." : "Create Album"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};