import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Track {
  id: string;
  title: string;
  artist_name: string;
  genre?: string;
}

interface TrackEditDialogProps {
  track: Track | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const TrackEditDialog = ({ track, open, onOpenChange, onSuccess }: TrackEditDialogProps) => {
  const [title, setTitle] = useState(track?.title || "");
  const [artistName, setArtistName] = useState(track?.artist_name || "");
  const [genre, setGenre] = useState(track?.genre || "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!track) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('tracks')
        .update({
          title: title.slice(0, 200),
          artist_name: artistName.slice(0, 100),
          genre: genre || null
        })
        .eq('id', track.id);

      if (error) throw error;

      toast({ title: "Track updated successfully" });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating track:', error);
      toast({
        title: "Failed to update track",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (!track) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Track</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-title">Track Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Song name"
            />
          </div>
          <div>
            <Label htmlFor="edit-artist">Artist Name</Label>
            <Input
              id="edit-artist"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="Your artist name"
            />
          </div>
          <div>
            <Label htmlFor="edit-genre">Genre</Label>
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};