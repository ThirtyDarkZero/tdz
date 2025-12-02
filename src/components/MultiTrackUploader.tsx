import { useState, useRef } from "react";
import { Upload, Music, Disc, Album as AlbumIcon, GripVertical, Edit, Sparkles, AlertTriangle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useUploadLimits } from "@/hooks/useUploadLimits";
import { useNavigate } from "react-router-dom";
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
import { BulkEditDialog, BulkMetadata } from './BulkEditDialog';

// Helper function to detect audio quality from file
const detectAudioQuality = (file: File): 'standard' | 'hd' | 'dolby_atmos' | 'hi_res' => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  // Dolby Atmos formats
  if (['ec3', 'eac3', 'ac4'].includes(extension || '')) {
    return 'dolby_atmos';
  }
  
  // High-resolution formats (typically 24-bit or higher)
  if (['dsd', 'dsf', 'dff', 'aiff', 'aif'].includes(extension || '')) {
    return 'hi_res';
  }
  
  // HD lossless formats (FLAC, WAV, ALAC)
  if (['flac', 'wav', 'alac'].includes(extension || '')) {
    return 'hd';
  }
  
  // Standard compressed formats
  return 'standard';
};

interface TrackFile {
  id: string;
  file: File;
  title: string;
  duration: number;
}

type ReleaseType = 'single' | 'ep' | 'album';

export const MultiTrackUploader = ({ onSuccess }: { onSuccess?: () => void }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [releaseType, setReleaseType] = useState<ReleaseType>('single');
  const [tracks, setTracks] = useState<TrackFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [releaseTitle, setReleaseTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const { toast } = useToast();
  
  const {
    loading: limitsLoading,
    maxTracks,
    maxAlbums,
    currentTracks,
    currentAlbums,
    canUploadTrack,
    canCreateAlbum,
    tracksRemaining,
    albumsRemaining,
    plan,
    refetch: refetchLimits
  } = useUploadLimits();

  const isUnlimited = maxTracks === -1;

  const handleFileSelect = async (files: FileList) => {
    // Check upload limits first
    if (!canUploadTrack) {
      toast({ 
        title: "Upload limit reached", 
        description: `You've reached your ${maxTracks} track limit. Upgrade to upload more.`,
        variant: "destructive" 
      });
      return;
    }

    const maxSize = 500 * 1024 * 1024; // Increased for Dolby Atmos & HD Audio
    const newTracks: TrackFile[] = [];
    const allowedCount = isUnlimited ? files.length : Math.min(files.length, tracksRemaining - tracks.length);

    if (!isUnlimited && files.length > allowedCount) {
      toast({
        title: "Some files skipped",
        description: `Only ${allowedCount} of ${files.length} files added due to plan limits.`,
        variant: "destructive"
      });
    }

    for (let i = 0; i < Math.min(files.length, allowedCount); i++) {
      const file = files[i];
      
      if (file.size > maxSize) {
        toast({ 
          title: "File too large", 
          description: `${file.name} exceeds 500MB (Dolby Atmos & HD Audio supported)`,
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

  const handleBulkEdit = (metadata: BulkMetadata) => {
    // Apply bulk metadata to form fields
    if (metadata.artistName !== undefined) {
      setArtistName(metadata.artistName);
    }
    if (metadata.genre !== undefined) {
      setGenre(metadata.genre);
    }

    toast({
      title: "Metadata applied",
      description: `Updated ${tracks.length} track${tracks.length !== 1 ? 's' : ''}`
    });
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

    // Check album limits for non-singles
    if (releaseType !== 'single' && !canCreateAlbum) {
      toast({ 
        title: "Album limit reached", 
        description: `You've reached your ${maxAlbums} album limit. Upgrade to create more.`,
        variant: "destructive" 
      });
      return;
    }

    // Check track limits
    if (!isUnlimited && currentTracks + tracks.length > maxTracks) {
      toast({ 
        title: "Track limit exceeded", 
        description: `This upload would exceed your ${maxTracks} track limit. Remove some tracks or upgrade.`,
        variant: "destructive" 
      });
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

        // Detect audio quality
        const audioQuality = detectAudioQuality(track.file);

        // Create track record
        const { error: dbError } = await supabase.from('tracks').insert({
          user_id: user.id,
          title: track.title.slice(0, 200),
          artist_name: artistName.slice(0, 100),
          duration: track.duration,
          file_path: filePath,
          genre: genre || null,
          is_published: false,
          audio_quality: audioQuality,
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
      {/* Release Type Selection - FIRST */}
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            What are you releasing?
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Choose your release type to get started</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Card 
            className={`p-6 cursor-pointer transition-all duration-300 hover:scale-105 ${releaseType === 'single' ? 'border-primary bg-gradient-to-br from-primary/20 to-primary/5 shadow-glow' : 'hover:border-primary/50 hover:bg-primary/5'}`}
            onClick={() => setReleaseType('single')}
          >
            <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${releaseType === 'single' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              <Music className="h-6 w-6" />
            </div>
            <p className="text-center font-bold text-lg">Single</p>
            <p className="text-xs text-center text-muted-foreground mt-1">1-2 tracks</p>
          </Card>
          <Card 
            className={`p-6 cursor-pointer transition-all duration-300 hover:scale-105 ${releaseType === 'ep' ? 'border-primary bg-gradient-to-br from-primary/20 to-primary/5 shadow-glow' : 'hover:border-primary/50 hover:bg-primary/5'}`}
            onClick={() => setReleaseType('ep')}
          >
            <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${releaseType === 'ep' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              <Disc className="h-6 w-6" />
            </div>
            <p className="text-center font-bold text-lg">EP</p>
            <p className="text-xs text-center text-muted-foreground mt-1">3-6 tracks</p>
          </Card>
          <Card 
            className={`p-6 cursor-pointer transition-all duration-300 hover:scale-105 ${releaseType === 'album' ? 'border-primary bg-gradient-to-br from-primary/20 to-primary/5 shadow-glow' : 'hover:border-primary/50 hover:bg-primary/5'}`}
            onClick={() => setReleaseType('album')}
          >
            <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${releaseType === 'album' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              <AlbumIcon className="h-6 w-6" />
            </div>
            <p className="text-center font-bold text-lg">Album</p>
            <p className="text-xs text-center text-muted-foreground mt-1">7+ tracks</p>
          </Card>
        </div>
      </div>

      {/* Upload Limits Indicator */}
      {!isUnlimited && (
        <Card className={`p-4 ${!canUploadTrack ? 'bg-destructive/10 border-destructive/30' : 'bg-primary/5 border-primary/20'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!canUploadTrack ? (
                <Lock className="h-5 w-5 text-destructive" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-primary" />
              )}
              <div>
                <p className="font-medium text-sm">
                  {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan Limits
                </p>
                <p className="text-xs text-muted-foreground">
                  {currentTracks}/{maxTracks} tracks • {currentAlbums}/{maxAlbums} albums
                </p>
              </div>
            </div>
            {!canUploadTrack && (
              <Button size="sm" onClick={() => navigate("/auth?upgrade=true")} className="bg-gradient-to-r from-primary to-secondary">
                <Sparkles className="h-4 w-4 mr-1" />
                Upgrade
              </Button>
            )}
          </div>
          {tracksRemaining <= 2 && tracksRemaining > 0 && (
            <p className="text-xs text-amber-500 mt-2">
              Only {tracksRemaining} track{tracksRemaining === 1 ? '' : 's'} remaining on your plan
            </p>
          )}
        </Card>
      )}

      {/* File Upload Area */}
      <div 
        className="border-2 border-dashed border-primary/40 rounded-lg p-8 text-center bg-gradient-to-br from-primary/5 via-transparent to-accent/5 cursor-pointer hover:border-primary/60 transition-colors"
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <Music className="h-12 w-12 text-primary" />
          <Sparkles className="h-6 w-6 text-accent animate-pulse" />
        </div>
        <div className="text-lg font-medium mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {releaseType === 'single' ? 'Upload High-Fidelity Track' : `Upload ${releaseType.toUpperCase()} Tracks`}
        </div>
        <div className="text-sm text-muted-foreground mb-2">
          <div className="font-semibold text-primary">✨ Dolby Atmos & HD Audio Ready</div>
          <div className="mt-1">Immersive 3D sound • Up to 24-bit/192kHz</div>
        </div>
        <div className="text-xs text-muted-foreground mb-4">
          All formats: MP3, WAV, FLAC, ALAC, EC-3, AC-4 • Max 500MB per file
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.ec3,.eac3,.ac4,.dsd,.dsf,.dff"
          className="hidden"
          multiple={releaseType !== 'single'}
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          disabled={uploading}
        />
        <Button 
          type="button" 
          variant="default" 
          disabled={uploading} 
          className="bg-gradient-to-r from-primary to-accent shadow-glow"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          <Upload className="h-4 w-4 mr-2" />
          Choose Audio Files
        </Button>
      </div>

      {/* Track List with Drag & Drop */}
      {tracks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Tracks ({tracks.length})</Label>
            <div className="flex items-center gap-2">
              {tracks.length > 1 && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBulkEdit(true)}
                    disabled={uploading}
                    className="h-8 text-xs"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Bulk Edit
                  </Button>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <GripVertical className="h-3 w-3" />
                    Drag to reorder
                  </p>
                </>
              )}
            </div>
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
              <SelectItem value="spoken-word">Spoken Word</SelectItem>
              <SelectItem value="podcast">Podcast</SelectItem>
              <SelectItem value="ambient">Ambient</SelectItem>
              <SelectItem value="metal">Metal</SelectItem>
              <SelectItem value="folk">Folk</SelectItem>
              <SelectItem value="soul">Soul</SelectItem>
              <SelectItem value="reggae">Reggae</SelectItem>
              <SelectItem value="latin">Latin</SelectItem>
              <SelectItem value="world">World</SelectItem>
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

      <BulkEditDialog
        open={showBulkEdit}
        onOpenChange={setShowBulkEdit}
        onApply={handleBulkEdit}
        trackCount={tracks.length}
        currentArtistName={artistName}
        currentGenre={genre}
      />
    </div>
  );
};