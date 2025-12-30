import { useState, useRef, useCallback } from "react";
import { Upload, Music, Disc, Album as AlbumIcon, GripVertical, Edit, Sparkles, AlertTriangle, Lock, Shield, ChevronDown, ChevronUp } from "lucide-react";
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
import { TrackMetadataForm, TrackMetadata } from './TrackMetadataForm';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [metadataOpen, setMetadataOpen] = useState(true);
  const [metadata, setMetadata] = useState<TrackMetadata | null>(null);
  const [metadataComplete, setMetadataComplete] = useState(false);
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

  const handleMetadataChange = useCallback((newMetadata: TrackMetadata, isComplete: boolean) => {
    setMetadata(newMetadata);
    setMetadataComplete(isComplete);
    // Sync basic fields
    if (newMetadata.artistName && newMetadata.artistName !== artistName) {
      setArtistName(newMetadata.artistName);
    }
    if (newMetadata.genre && newMetadata.genre !== genre) {
      setGenre(newMetadata.genre);
    }
    if (newMetadata.releaseType !== releaseType) {
      setReleaseType(newMetadata.releaseType);
    }
  }, [artistName, genre, releaseType]);

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

    // CRITICAL: Require complete metadata before upload
    if (!metadataComplete || !metadata) {
      toast({ 
        title: "Metadata required", 
        description: "Please complete all required distribution metadata before uploading.",
        variant: "destructive" 
      });
      setMetadataOpen(true);
      return;
    }

    if (!metadata.artistName.trim()) {
      toast({ title: "Artist name required", variant: "destructive" });
      return;
    }

    if (releaseType !== 'single' && !releaseTitle.trim()) {
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

    let uploadedFilePaths: string[] = [];
    let createdAlbumId: string | null = null;
    let createdTrackIds: string[] = [];

    try {
      // Step 1: Verify authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("Authentication required. Please sign in again.");
      }

      let albumId: string | null = null;

      // Step 2: Create album for EP or Album (with retry)
      if (releaseType !== 'single') {
        let retries = 3;
        while (retries > 0) {
          const { data: albumData, error: albumError } = await supabase
            .from('albums')
            .insert({
              user_id: user.id,
              title: releaseTitle.trim().slice(0, 200),
              artist_name: artistName.trim().slice(0, 100),
              genre: genre?.trim() || null,
              description: description?.trim() || null,
              is_published: false,
              total_tracks: tracks.length
            })
            .select()
            .single();

          if (!albumError && albumData) {
            albumId = albumData.id;
            createdAlbumId = albumData.id;
            break;
          }

          retries--;
          if (retries === 0) {
            throw new Error(`Failed to create album: ${albumError?.message || 'Unknown error'}`);
          }
          await new Promise(r => setTimeout(r, 1000)); // Wait 1s before retry
        }
      }

      // Step 3: Upload tracks with robust error handling
      const totalTracks = tracks.length;
      const successfulTracks: number[] = [];

      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        const baseProgress = (i / totalTracks) * 100;
        
        setProgress(baseProgress + 5);

        try {
          // Sanitize and create unique filename
          const sanitizedFileName = track.file.name
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .slice(0, 100);
          const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          const filePath = `${user.id}/${uniqueId}-${sanitizedFileName}`;
          
          // Upload file with retry logic
          let uploadSuccess = false;
          let uploadRetries = 3;
          
          while (uploadRetries > 0 && !uploadSuccess) {
            const { error: uploadError } = await supabase.storage
              .from('track-files')
              .upload(filePath, track.file, {
                cacheControl: '3600',
                upsert: false
              });

            if (!uploadError) {
              uploadSuccess = true;
              uploadedFilePaths.push(filePath);
            } else {
              uploadRetries--;
              if (uploadRetries === 0) {
                console.error(`Upload failed for ${track.title}:`, uploadError);
                throw new Error(`Failed to upload ${track.title}: ${uploadError.message}`);
              }
              await new Promise(r => setTimeout(r, 1000));
            }
          }

          setProgress(baseProgress + 30);

          // Analyze metadata (non-blocking - continue even if this fails)
          let aiData: any = null;
          try {
            const { data, error: aiError } = await supabase.functions.invoke('analyze-track-metadata', {
              body: { filePath, fileName: track.file.name }
            });
            if (!aiError && data) {
              aiData = data;
            }
          } catch (aiErr) {
            console.warn('AI metadata analysis skipped:', aiErr);
          }

          setProgress(baseProgress + 50);

          // Detect audio quality
          const audioQuality = detectAudioQuality(track.file);

          // Create track record with retry
          let dbRetries = 3;
          let trackCreated = false;
          
          while (dbRetries > 0 && !trackCreated) {
            // Use type assertion for new columns until types are regenerated
            const trackInsertData = {
              user_id: user.id,
              title: track.title.trim().slice(0, 200),
              artist_name: metadata!.artistName.trim().slice(0, 100),
              duration: track.duration || 0,
              file_path: filePath,
              genre: metadata!.genre || null,
              is_published: false,
              audio_quality: audioQuality,
              album_id: albumId,
              track_number: releaseType !== 'single' ? i + 1 : null,
              ai_tags: aiData?.tags || null,
              bpm: aiData?.bpm || null,
              key: aiData?.key || null,
              mood: aiData?.mood || null,
              // Distribution metadata (new columns)
              isrc: metadata!.isrc || null,
              upc: metadata!.upc || null,
              label: metadata!.label || null,
              copyright_owner: metadata!.copyrightOwner || null,
              copyright_year: metadata!.copyrightYear || null,
              p_line: metadata!.pLine || null,
              c_line: metadata!.cLine || null,
              explicit: metadata!.explicit || false,
              language: metadata!.language || 'English',
              release_type: metadata!.releaseType || 'single',
              release_version: metadata!.releaseVersion || 'Original',
              original_release_date: metadata!.originalReleaseDate?.toISOString().split('T')[0] || null,
              preorder_date: metadata!.preorderDate?.toISOString().split('T')[0] || null,
              credits: metadata!.credits || null,
              publishing_info: metadata!.publishingInfo || null,
              metadata_complete: true
            } as any;
            
            const { data: trackData, error: dbError } = await supabase
              .from('tracks')
              .insert(trackInsertData)
              .select('id')
              .single();

            if (!dbError && trackData) {
              trackCreated = true;
              createdTrackIds.push(trackData.id);
              successfulTracks.push(i);
            } else {
              dbRetries--;
              if (dbRetries === 0) {
                console.error(`DB insert failed for ${track.title}:`, dbError);
                throw new Error(`Failed to save ${track.title}: ${dbError?.message || 'Database error'}`);
              }
              await new Promise(r => setTimeout(r, 1000));
            }
          }

          setProgress(baseProgress + (100 / totalTracks));
        } catch (trackError: any) {
          console.error(`Error processing track ${i + 1}:`, trackError);
          throw trackError;
        }
      }

      // Update album track count if needed
      if (albumId && successfulTracks.length !== tracks.length) {
        await supabase
          .from('albums')
          .update({ total_tracks: successfulTracks.length })
          .eq('id', albumId);
      }

      setProgress(100);

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
      
      // Refetch limits
      refetchLimits();
      
      onSuccess?.();
    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Cleanup on failure: remove uploaded files and created records
      if (uploadedFilePaths.length > 0 || createdTrackIds.length > 0 || createdAlbumId) {
        console.log('Cleaning up partial upload...');
        
        // Delete uploaded files
        for (const filePath of uploadedFilePaths) {
          try {
            await supabase.storage.from('track-files').remove([filePath]);
          } catch (cleanupErr) {
            console.error('Cleanup file error:', cleanupErr);
          }
        }
        
        // Delete created tracks
        for (const trackId of createdTrackIds) {
          try {
            await supabase.from('tracks').delete().eq('id', trackId);
          } catch (cleanupErr) {
            console.error('Cleanup track error:', cleanupErr);
          }
        }
        
        // Delete created album
        if (createdAlbumId) {
          try {
            await supabase.from('albums').delete().eq('id', createdAlbumId);
          } catch (cleanupErr) {
            console.error('Cleanup album error:', cleanupErr);
          }
        }
      }

      toast({
        title: "Upload failed",
        description: error.message || "An unexpected error occurred. Please try again.",
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

      {/* Distribution Metadata Form - REQUIRED */}
      {tracks.length > 0 && (
        <Collapsible open={metadataOpen} onOpenChange={setMetadataOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Distribution Metadata</span>
                {!metadataComplete && (
                  <Badge variant="destructive" className="text-xs">Required</Badge>
                )}
                {metadataComplete && (
                  <Badge variant="default" className="text-xs bg-green-600">Complete</Badge>
                )}
              </div>
              {metadataOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <TrackMetadataForm
              initialData={{
                title: tracks[0]?.title || '',
                artistName,
                genre,
                releaseType
              }}
              onMetadataChange={handleMetadataChange}
              showValidation={true}
            />
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Release Title for EP/Album */}
      {releaseType !== 'single' && tracks.length > 0 && (
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
        disabled={uploading || tracks.length === 0 || !metadataComplete} 
        className="w-full"
      >
        {uploading ? "Uploading..." : !metadataComplete && tracks.length > 0 ? "Complete Metadata to Upload" : `Upload ${releaseType === 'single' ? 'Track' : tracks.length + ' Tracks'}`}
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