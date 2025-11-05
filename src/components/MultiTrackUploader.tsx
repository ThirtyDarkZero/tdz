import { useState } from "react";
import { Upload, Music, Disc, Album as AlbumIcon, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableTrackItem } from './SortableTrackItem';

interface TrackFile {
  id: string;
  file: File;
  title: string;
  duration: number;
}

type ReleaseType = 'single' | 'ep' | 'album';

export const MultiTrackUploader = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [releaseType, setReleaseType] = useState<ReleaseType>('single');
  const [tracks, setTracks] = useState<TrackFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [releaseTitle, setReleaseTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileSelect = async (files: FileList) => {
    const maxSize = 200 * 1024 * 1024;
    const newTracks: TrackFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.size > maxSize) {
        toast({ 
          title: "File too large", 
          description: `${file.name} exceeds 200MB`,
          variant: "destructive" 
        });
        continue;
      }

      // Get duration
      const audio = new Audio();
      const duration = await new Promise<number>((resolve) => {
        audio.onloadedmetadata = () => resolve(Math.floor(audio.duration));
        audio.onerror = () => resolve(0);
        audio.src = URL.createObjectURL(file);
      });

      newTracks.push({
        id: `${Date.now()}-${i}`,
        file,
        title: file.name.replace(/\.[^/.]+$/, ""),
        duration
      });
    }

    setTracks([...tracks, ...newTracks]);
  };

  const updateTrackTitle = (id: string, title: string) => {
    setTracks(tracks.map(t => t.id === id ? { ...t, title } : t));
  };

  const removeTrack = (id: string) => {
    setTracks(tracks.filter(t => t.id !== id));
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTracks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleUpload = async () => {
    if (tracks.length === 0) {
      toast({ title: "No tracks selected", variant: "destructive" });
      return;
    }

    if (!artistName) {
      toast({ title: "Artist name required", variant: "destructive" });
      return;
    }

    if (releaseType !== 'single' && !releaseTitle) {
      toast({ title: "Release title required for albums and EPs", variant: "destructive" });
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let albumId: string | null = null;

      // Create album for EP or Album
      if (releaseType !== 'single') {
        const { data: albumData, error: albumError } = await supabase
          .from('albums')
          .insert({
            user_id: user.id,
            title: releaseTitle,
            artist_name: artistName,
            genre: genre || null,
            description: description || null,
            is_published: false,
            total_tracks: tracks.length
          })
          .select()
          .single();

        if (albumError) throw albumError;
        albumId = albumData.id;
      }

      // Upload tracks
      const totalTracks = tracks.length;
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        const baseProgress = (i / totalTracks) * 100;
        
        setProgress(baseProgress + 10);

        // Upload file
        const sanitizedFileName = track.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `${user.id}/${Date.now()}-${sanitizedFileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('track-files')
          .upload(filePath, track.file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;
        setProgress(baseProgress + 40);

        // Analyze metadata
        const { data: aiData } = await supabase.functions.invoke('analyze-track-metadata', {
          body: { filePath, fileName: track.file.name }
        });

        setProgress(baseProgress + 60);

        // Create track record
        const { error: dbError } = await supabase.from('tracks').insert({
          user_id: user.id,
          title: track.title.slice(0, 200),
          artist_name: artistName.slice(0, 100),
          duration: track.duration,
          file_path: filePath,
          genre: genre || null,
          is_published: false,
          album_id: albumId,
          track_number: releaseType !== 'single' ? i + 1 : null,
          ai_tags: aiData?.tags || null,
          bpm: aiData?.bpm || null,
          key: aiData?.key || null,
          mood: aiData?.mood || null
        });

        if (dbError) throw dbError;
        setProgress(baseProgress + 100);
      }

      toast({ 
        title: "Upload successful!",
        description: `${tracks.length} track(s) uploaded to your library`
      });
      
      // Reset form
      setTracks([]);
      setReleaseTitle("");
      setArtistName("");
      setGenre("");
      setDescription("");
      setReleaseType('single');
      onSuccess?.();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Release Type Selection */}
      <div>
        <Label>Release Type</Label>
        <div className="grid grid-cols-3 gap-3 mt-2">
          <Card 
            className={`p-4 cursor-pointer transition-all ${releaseType === 'single' ? 'border-primary bg-primary/10' : 'hover:border-primary/50'}`}
            onClick={() => setReleaseType('single')}
          >
            <Music className="h-6 w-6 mx-auto mb-2" />
            <p className="text-center font-medium">Single</p>
            <p className="text-xs text-center text-muted-foreground">1-2 tracks</p>
          </Card>
          <Card 
            className={`p-4 cursor-pointer transition-all ${releaseType === 'ep' ? 'border-primary bg-primary/10' : 'hover:border-primary/50'}`}
            onClick={() => setReleaseType('ep')}
          >
            <Disc className="h-6 w-6 mx-auto mb-2" />
            <p className="text-center font-medium">EP</p>
            <p className="text-xs text-center text-muted-foreground">3-6 tracks</p>
          </Card>
          <Card 
            className={`p-4 cursor-pointer transition-all ${releaseType === 'album' ? 'border-primary bg-primary/10' : 'hover:border-primary/50'}`}
            onClick={() => setReleaseType('album')}
          >
            <AlbumIcon className="h-6 w-6 mx-auto mb-2" />
            <p className="text-center font-medium">Album</p>
            <p className="text-xs text-center text-muted-foreground">7+ tracks</p>
          </Card>
        </div>
      </div>

      {/* File Upload Area */}
      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
        <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <Label htmlFor="files" className="cursor-pointer">
          <div className="text-lg font-medium mb-2">
            {releaseType === 'single' ? 'Upload Track' : `Upload ${releaseType.toUpperCase()} Tracks`}
          </div>
          <div className="text-sm text-muted-foreground mb-4">
            MP3, WAV, FLAC, M4A, AAC, OGG · Max 200MB per file
          </div>
          <Input
            id="files"
            type="file"
            accept="audio/mpeg,audio/mp3,audio/wav,audio/flac,audio/m4a,audio/aac,audio/ogg"
            className="hidden"
            multiple={releaseType !== 'single'}
            onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
            disabled={uploading}
          />
          <Button type="button" variant="outline" disabled={uploading}>
            <Upload className="h-4 w-4 mr-2" />
            Choose Files
          </Button>
        </Label>
      </div>

      {/* Track List with Drag & Drop */}
      {tracks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Tracks ({tracks.length})</Label>
            {tracks.length > 1 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <GripVertical className="h-3 w-3" />
                Drag to reorder
              </p>
            )}
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={tracks.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {tracks.map((track, index) => (
                <SortableTrackItem
                  key={track.id}
                  track={track}
                  index={index}
                  editingTrackId={editingTrackId}
                  onEdit={setEditingTrackId}
                  onTitleChange={updateTrackTitle}
                  onRemove={removeTrack}
                  onBlur={() => setEditingTrackId(null)}
                  disabled={uploading}
                  formatDuration={formatDuration}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Release Info */}
      <div className="grid gap-4">
        {releaseType !== 'single' && (
          <div>
            <Label htmlFor="releaseTitle">
              {releaseType === 'ep' ? 'EP' : 'Album'} Title *
            </Label>
            <Input 
              id="releaseTitle" 
              value={releaseTitle}
              onChange={(e) => setReleaseTitle(e.target.value)}
              placeholder={`Your ${releaseType} name`}
              disabled={uploading}
            />
          </div>
        )}

        <div>
          <Label htmlFor="artistName">Artist Name *</Label>
          <Input 
            id="artistName" 
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            placeholder="Your artist name"
            disabled={uploading}
          />
        </div>

        <div>
          <Label htmlFor="genre">Genre</Label>
          <Select value={genre} onValueChange={setGenre} disabled={uploading}>
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

        {releaseType !== 'single' && (
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell fans about this release..."
              rows={3}
              disabled={uploading}
            />
          </div>
        )}
      </div>

      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-center text-muted-foreground">
            Uploading... {Math.round(progress)}%
          </p>
        </div>
      )}

      <Button 
        onClick={handleUpload} 
        disabled={uploading || tracks.length === 0} 
        className="w-full"
      >
        {uploading ? "Uploading..." : `Upload ${releaseType === 'single' ? 'Track' : tracks.length + ' Tracks'}`}
      </Button>
    </div>
  );
};