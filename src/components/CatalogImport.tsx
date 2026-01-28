import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, FileSpreadsheet, Music, CheckCircle2, AlertCircle, 
  Loader2, Download, FolderUp, HardDrive, ArrowRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImportedTrack {
  title: string;
  artist_name: string;
  album?: string;
  genre?: string;
  duration?: number;
  isrc?: string;
  file?: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface CatalogImportProps {
  artistId?: string;
  artistName?: string;
  onComplete?: () => void;
}

export const CatalogImport = ({ artistId, artistName, onComplete }: CatalogImportProps) => {
  const [importMethod, setImportMethod] = useState<'csv' | 'folder' | null>(null);
  const [tracks, setTracks] = useState<ImportedTrack[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(0);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Parse CSV file
  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      
      const titleIdx = headers.findIndex(h => h.includes('title') || h.includes('name'));
      const artistIdx = headers.findIndex(h => h.includes('artist'));
      const albumIdx = headers.findIndex(h => h.includes('album'));
      const genreIdx = headers.findIndex(h => h.includes('genre'));
      const isrcIdx = headers.findIndex(h => h.includes('isrc'));
      const durationIdx = headers.findIndex(h => h.includes('duration'));

      const parsedTracks: ImportedTrack[] = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          return {
            title: cols[titleIdx] || 'Unknown Track',
            artist_name: cols[artistIdx] || artistName || 'Unknown Artist',
            album: albumIdx >= 0 ? cols[albumIdx] : undefined,
            genre: genreIdx >= 0 ? cols[genreIdx] : undefined,
            isrc: isrcIdx >= 0 ? cols[isrcIdx] : undefined,
            duration: durationIdx >= 0 ? parseInt(cols[durationIdx]) || 0 : 0,
            status: 'pending' as const
          };
        });

      setTracks(parsedTracks);
      setImportMethod('csv');
      toast.success(`Parsed ${parsedTracks.length} tracks from CSV`);
    } catch (error) {
      toast.error("Failed to parse CSV file");
    }
  };

  // Handle folder upload
  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const audioFiles = Array.from(files).filter(file => 
      file.type.startsWith('audio/') || 
      file.name.match(/\.(mp3|wav|flac|aac|m4a|ogg)$/i)
    );

    const parsedTracks: ImportedTrack[] = audioFiles.map(file => {
      // Try to extract metadata from filename
      const nameParts = file.name.replace(/\.[^/.]+$/, '').split(' - ');
      return {
        title: nameParts.length > 1 ? nameParts[1] : nameParts[0],
        artist_name: nameParts.length > 1 ? nameParts[0] : (artistName || 'Unknown Artist'),
        file,
        status: 'pending' as const
      };
    });

    setTracks(parsedTracks);
    setImportMethod('folder');
    toast.success(`Found ${parsedTracks.length} audio files`);
  };

  // Import all tracks
  const handleImport = async () => {
    if (tracks.length === 0) return;

    setImporting(true);
    setProgress(0);
    setCompleted(0);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to import tracks");
      setImporting(false);
      return;
    }

    const targetArtistId = artistId || user.id;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      
      setTracks(prev => prev.map((t, idx) => 
        idx === i ? { ...t, status: 'uploading' } : t
      ));

      try {
        let filePath = null;

        // Upload audio file if provided
        if (track.file) {
          const fileExt = track.file.name.split('.').pop();
          const fileName = `${targetArtistId}/${Date.now()}-${i}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('track-files')
            .upload(fileName, track.file);

          if (uploadError) throw uploadError;
          filePath = fileName;
        }

        // Create track record
        const { error: insertError } = await supabase
          .from('tracks')
          .insert({
            user_id: targetArtistId,
            title: track.title,
            artist_name: track.artist_name,
            genre: track.genre || 'Other',
            isrc: track.isrc || null,
            duration: track.duration || 0,
            file_path: filePath,
            is_published: false,
            play_count: 0
          });

        if (insertError) throw insertError;

        setTracks(prev => prev.map((t, idx) => 
          idx === i ? { ...t, status: 'success' } : t
        ));
        successCount++;
      } catch (error: any) {
        setTracks(prev => prev.map((t, idx) => 
          idx === i ? { ...t, status: 'error', error: error.message } : t
        ));
        errorCount++;
      }

      setCompleted(i + 1);
      setProgress(Math.round(((i + 1) / tracks.length) * 100));
    }

    setImporting(false);
    
    if (successCount > 0) {
      toast.success(`Imported ${successCount} tracks successfully`);
      onComplete?.();
    }
    if (errorCount > 0) {
      toast.error(`Failed to import ${errorCount} tracks`);
    }
  };

  // Download CSV template
  const downloadTemplate = () => {
    const template = `title,artist,album,genre,isrc,duration
"Track Title","Artist Name","Album Name","Hip-Hop","USRC12345678","180"
"Another Track","Another Artist","Album","Pop","","240"`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'catalog_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const pendingCount = tracks.filter(t => t.status === 'pending').length;
  const successCount = tracks.filter(t => t.status === 'success').length;
  const errorCount = tracks.filter(t => t.status === 'error').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <HardDrive className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold">Catalog Import</h2>
          <p className="text-sm text-muted-foreground">
            Bulk import your existing music catalog
            {artistName && <span className="text-primary"> for {artistName}</span>}
          </p>
        </div>
      </div>

      {tracks.length === 0 ? (
        <Tabs defaultValue="csv" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="csv" className="gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              CSV Import
            </TabsTrigger>
            <TabsTrigger value="folder" className="gap-2">
              <FolderUp className="w-4 h-4" />
              Folder Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="csv">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                  Import from CSV
                </CardTitle>
                <CardDescription>
                  Upload a CSV file with your track metadata. Audio files can be added later.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={downloadTemplate}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Template
                  </Button>
                  <Button 
                    onClick={() => csvInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload CSV
                  </Button>
                  <input
                    ref={csvInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleCSVUpload}
                  />
                </div>

                <div className="p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                  <p className="font-medium mb-2">CSV Format Requirements:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>First row should contain column headers</li>
                    <li>Required: <code className="bg-muted px-1 rounded">title</code></li>
                    <li>Optional: <code className="bg-muted px-1 rounded">artist, album, genre, isrc, duration</code></li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="folder">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderUp className="w-5 h-5 text-primary" />
                  Upload Folder
                </CardTitle>
                <CardDescription>
                  Select a folder containing your audio files. Metadata will be extracted from filenames.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => folderInputRef.current?.click()}
                  className="gap-2"
                >
                  <FolderUp className="w-4 h-4" />
                  Select Folder
                </Button>
                <input
                  ref={folderInputRef}
                  type="file"
                  // @ts-ignore - webkitdirectory is valid but not in TS types
                  webkitdirectory="true"
                  multiple
                  className="hidden"
                  onChange={handleFolderUpload}
                />

                <div className="p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Filename Format (recommended):</p>
                  <p><code className="bg-muted px-2 py-1 rounded">Artist Name - Track Title.mp3</code></p>
                  <p className="mt-2">Supported formats: MP3, WAV, FLAC, AAC, M4A, OGG</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-6">
          {/* Import Progress */}
          {importing && (
            <Card className="glass-card p-4">
              <div className="flex items-center gap-4 mb-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="font-medium">Importing tracks...</span>
                <span className="text-muted-foreground ml-auto">
                  {completed} / {tracks.length}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </Card>
          )}

          {/* Summary */}
          <div className="flex items-center gap-4 flex-wrap">
            <Badge variant="outline" className="text-sm px-3 py-1">
              <Music className="w-3 h-3 mr-1" />
              {tracks.length} tracks
            </Badge>
            {successCount > 0 && (
              <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {successCount} imported
              </Badge>
            )}
            {errorCount > 0 && (
              <Badge variant="destructive">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errorCount} failed
              </Badge>
            )}
            <div className="flex-1" />
            {!importing && pendingCount > 0 && (
              <Button onClick={handleImport} className="gap-2">
                <ArrowRight className="w-4 h-4" />
                Import {pendingCount} Tracks
              </Button>
            )}
            {!importing && (
              <Button 
                variant="outline" 
                onClick={() => { setTracks([]); setImportMethod(null); }}
              >
                Start Over
              </Button>
            )}
          </div>

          {/* Track List */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Tracks to Import</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="divide-y divide-border">
                  {tracks.map((track, idx) => (
                    <div 
                      key={idx}
                      className={`flex items-center gap-4 p-4 ${
                        track.status === 'success' ? 'bg-green-500/5' :
                        track.status === 'error' ? 'bg-red-500/5' :
                        track.status === 'uploading' ? 'bg-primary/5' : ''
                      }`}
                    >
                      <span className="w-8 text-center text-muted-foreground text-sm">
                        {idx + 1}
                      </span>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{track.title}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {track.artist_name}
                          {track.album && ` • ${track.album}`}
                        </p>
                      </div>

                      {track.genre && (
                        <Badge variant="outline" className="hidden sm:flex">
                          {track.genre}
                        </Badge>
                      )}

                      {track.status === 'pending' && (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                      {track.status === 'uploading' && (
                        <Badge className="bg-primary/20 text-primary">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Uploading
                        </Badge>
                      )}
                      {track.status === 'success' && (
                        <Badge className="bg-green-500/20 text-green-500">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Done
                        </Badge>
                      )}
                      {track.status === 'error' && (
                        <Badge variant="destructive" title={track.error}>
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Error
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};