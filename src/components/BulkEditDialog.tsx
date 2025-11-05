import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit } from "lucide-react";

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (metadata: BulkMetadata) => void;
  trackCount: number;
  currentArtistName?: string;
  currentGenre?: string;
}

export interface BulkMetadata {
  artistName?: string;
  genre?: string;
}

export const BulkEditDialog = ({
  open,
  onOpenChange,
  onApply,
  trackCount,
  currentArtistName = "",
  currentGenre = ""
}: BulkEditDialogProps) => {
  const [artistName, setArtistName] = useState(currentArtistName);
  const [genre, setGenre] = useState(currentGenre);
  const [updateArtist, setUpdateArtist] = useState(false);
  const [updateGenre, setUpdateGenre] = useState(false);

  const handleApply = () => {
    const metadata: BulkMetadata = {};
    
    if (updateArtist && artistName.trim()) {
      metadata.artistName = artistName.trim();
    }
    
    if (updateGenre && genre) {
      metadata.genre = genre;
    }

    if (Object.keys(metadata).length > 0) {
      onApply(metadata);
      onOpenChange(false);
    }
  };

  const hasChanges = (updateArtist && artistName.trim()) || (updateGenre && genre);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Bulk Edit Metadata
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Apply metadata changes to all {trackCount} track{trackCount !== 1 ? 's' : ''}
          </p>

          <div className="space-y-4 border-t pt-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center h-10">
                <input
                  type="checkbox"
                  id="update-artist"
                  checked={updateArtist}
                  onChange={(e) => setUpdateArtist(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label 
                  htmlFor="bulk-artist" 
                  className={!updateArtist ? "text-muted-foreground" : ""}
                >
                  Artist Name
                </Label>
                <Input
                  id="bulk-artist"
                  value={artistName}
                  onChange={(e) => {
                    setArtistName(e.target.value);
                    if (e.target.value && !updateArtist) {
                      setUpdateArtist(true);
                    }
                  }}
                  placeholder="Artist name for all tracks"
                  disabled={!updateArtist}
                />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex items-center h-10">
                <input
                  type="checkbox"
                  id="update-genre"
                  checked={updateGenre}
                  onChange={(e) => setUpdateGenre(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label 
                  htmlFor="bulk-genre"
                  className={!updateGenre ? "text-muted-foreground" : ""}
                >
                  Genre
                </Label>
                <Select 
                  value={genre} 
                  onValueChange={(value) => {
                    setGenre(value);
                    if (value && !updateGenre) {
                      setUpdateGenre(true);
                    }
                  }}
                  disabled={!updateGenre}
                >
                  <SelectTrigger id="bulk-genre">
                    <SelectValue placeholder="Select genre for all tracks" />
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
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="text-muted-foreground">
              {!hasChanges && "Select fields to update"}
              {updateArtist && !updateGenre && `Will update artist name for ${trackCount} track${trackCount !== 1 ? 's' : ''}`}
              {!updateArtist && updateGenre && `Will update genre for ${trackCount} track${trackCount !== 1 ? 's' : ''}`}
              {updateArtist && updateGenre && `Will update artist name and genre for ${trackCount} track${trackCount !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={!hasChanges}>
            Apply to All Tracks
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};