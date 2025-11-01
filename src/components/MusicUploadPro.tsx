import { useState } from "react";
import { Upload, Music, Image as ImageIcon, Plus, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

type Contributor = {
  id: string;
  name: string;
  role: string;
  publishingSplit: number;
};

export const MusicUploadPro = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [artworkPreview, setArtworkPreview] = useState<string>("");
  const [isMotionCover, setIsMotionCover] = useState(false);
  
  // Basic metadata
  const [title, setTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [genre, setGenre] = useState("");
  const [explicitContent, setExplicitContent] = useState("no");
  const [language, setLanguage] = useState("en");
  const [description, setDescription] = useState("");
  
  // Publishing metadata
  const [isrc, setIsrc] = useState("");
  const [upc, setUpc] = useState("");
  const [copyrightYear, setCopyrightYear] = useState(new Date().getFullYear().toString());
  const [copyrightHolder, setCopyrightHolder] = useState("");
  const [publishingRights, setPublishingRights] = useState("");
  const [pLine, setPLine] = useState("");
  const [cLine, setCLine] = useState("");
  
  // Contributors
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [newContributor, setNewContributor] = useState({ name: "", role: "", split: 0 });

  const handleArtworkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      
      if (!isVideo && !isImage) {
        toast.error("Please select an image or video file");
        return;
      }
      
      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      const sizeLabel = isVideo ? "50MB" : "10MB";
      
      if (file.size > maxSize) {
        toast.error(`File must be less than ${sizeLabel}`);
        return;
      }
      
      setArtworkFile(file);
      setIsMotionCover(isVideo);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setArtworkPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      if (isVideo) {
        toast.success("Motion art cover selected! 🎬");
      }
    }
  };

  const addContributor = () => {
    if (!newContributor.name || !newContributor.role || newContributor.split <= 0) {
      toast.error("Please complete all contributor fields");
      return;
    }
    
    const totalSplit = contributors.reduce((sum, c) => sum + c.publishingSplit, 0) + newContributor.split;
    if (totalSplit > 100) {
      toast.error("Total publishing splits cannot exceed 100%");
      return;
    }
    
    setContributors([...contributors, {
      id: crypto.randomUUID(),
      name: newContributor.name,
      role: newContributor.role,
      publishingSplit: newContributor.split
    }]);
    setNewContributor({ name: "", role: "", split: 0 });
  };

  const removeContributor = (id: string) => {
    setContributors(contributors.filter(c => c.id !== id));
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const audioFileList = Array.from(files).filter(file => {
        const isAudio = file.type.startsWith('audio/');
        if (!isAudio) {
          toast.error(`${file.name} is not an audio file`);
          return false;
        }
        return true;
      });
      
      if (audioFileList.length > 20) {
        toast.error("Maximum 20 tracks can be uploaded at once");
        setAudioFiles(audioFileList.slice(0, 20));
      } else {
        setAudioFiles(audioFileList);
        toast.success(`${audioFileList.length} track(s) selected`);
      }
    }
  };

  const handleUpload = async () => {
    if (audioFiles.length === 0) {
      toast.error("Please select at least one audio file");
      return;
    }
    
    if (!artworkFile) {
      toast.error("Please upload artwork for your release");
      return;
    }

    if (!title || !artistName) {
      toast.error("Please complete basic information");
      return;
    }

    const totalSplit = contributors.reduce((sum, c) => sum + c.publishingSplit, 0);
    if (totalSplit > 0 && totalSplit !== 100) {
      toast.error(`Publishing splits must total 100% (currently ${totalSplit}%)`);
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let artworkUrl = "";
      let bucket = "album-covers";

      // Upload artwork if provided (static or motion)
      if (artworkFile) {
        setProgress(15);
        bucket = isMotionCover ? 'motion-covers' : 'album-covers';
        const artworkPath = `${user.id}/artwork/${Date.now()}-${artworkFile.name}`;
        
        const { error: artworkError } = await supabase.storage
          .from(bucket)
          .upload(artworkPath, artworkFile, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (artworkError) throw artworkError;
        
        artworkUrl = artworkPath; // Store path, not full URL
      }

      // Ensure artist profile exists
      const { data: existingProfile } = await supabase
        .from('artist_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!existingProfile) {
        await supabase.from('artist_profiles').insert({
          user_id: user.id,
          artist_name: artistName || 'Unknown Artist',
          bio: description || null
        });
      }

      // Process each audio file
      const totalFiles = audioFiles.length;
      const uploadedTracks = [];

      for (let i = 0; i < audioFiles.length; i++) {
        const audioFile = audioFiles[i];
        const fileProgress = 20 + (60 * (i / totalFiles));
        setProgress(fileProgress);

        // Get audio duration
        const audio = new Audio();
        const duration = await new Promise<number>((resolve) => {
          audio.onloadedmetadata = () => resolve(Math.floor(audio.duration));
          audio.src = URL.createObjectURL(audioFile);
        });

        // Upload audio file
        const sanitizedFileName = audioFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `${user.id}/${Date.now()}-${sanitizedFileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('track-files')
          .upload(filePath, audioFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // AI analysis (if needed)
        let aiData = null;
        try {
          const { data } = await supabase.functions.invoke('analyze-track-metadata', {
            body: { filePath, fileName: audioFile.name }
          });
          aiData = data;
        } catch (err) {
          console.warn('AI analysis failed for', audioFile.name, err);
        }
        
        // Extract title from filename (remove extension)
        const trackTitle = title || audioFile.name.replace(/\.[^/.]+$/, "");
        const trackArtist = artistName || "Unknown Artist";

        // Create track record
        const { data: trackData, error: dbError } = await supabase.from('tracks').insert({
          user_id: user.id,
          title: trackTitle.slice(0, 200),
          artist_name: trackArtist.slice(0, 100),
          duration,
          file_path: filePath,
          genre,
          is_published: false,
          album_cover_path: artworkUrl || null,
          album_cover_bucket: bucket,
          ai_tags: {
            ...aiData?.tags,
            metadata: {
              isrc,
              upc,
              copyrightYear,
              copyrightHolder,
              publishingRights,
              pLine,
              cLine,
              explicitContent,
              language,
              description,
              contributors,
              isMotionCover
            }
          },
          bpm: aiData?.bpm || null,
          key: aiData?.key || null,
          mood: aiData?.mood || null
        }).select();

        if (dbError) throw dbError;
        uploadedTracks.push(trackData?.[0]);
      }

      setProgress(100);
      toast.success(`${uploadedTracks.length} track(s) uploaded successfully!`, {
        description: isMotionCover 
          ? "Your tracks with motion art are ready for distribution 🎬" 
          : "Your tracks are ready for distribution"
      });
      
      // Reset form
      setAudioFiles([]);
      setArtworkFile(null);
      setArtworkPreview("");
      setIsMotionCover(false);
      setTitle("");
      setArtistName("");
      setContributors([]);
      onSuccess?.();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error("Upload failed", { description: error.message });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="publishing">Publishing</TabsTrigger>
          <TabsTrigger value="contributors">Contributors</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          {/* Audio Files Upload */}
          <Card className="p-6">
            <Label className="text-base font-semibold mb-4 block">
              Audio Files * {audioFiles.length > 0 && <Badge className="ml-2">{audioFiles.length} selected</Badge>}
            </Label>
            <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center hover:border-primary/60 transition-colors">
              <Music className="h-12 w-12 mx-auto mb-4 text-primary" />
              <div className="text-sm font-medium mb-2">
                {audioFiles.length > 0 
                  ? `${audioFiles.length} file(s) selected` 
                  : "Choose Audio Files (up to 20)"}
              </div>
              <div className="text-xs text-muted-foreground mb-4">
                MP3, WAV, FLAC, M4A · Max 200MB per file · Up to 20 files
              </div>
              {audioFiles.length > 0 && (
                <div className="mb-4 max-h-32 overflow-y-auto text-left bg-muted/50 rounded p-3">
                  {audioFiles.map((file, index) => (
                    <div key={index} className="text-xs text-muted-foreground truncate">
                      {index + 1}. {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  ))}
                </div>
              )}
              <input
                id="audio-files"
                type="file"
                accept="audio/mpeg,audio/mp3,audio/wav,audio/flac,audio/m4a"
                onChange={handleAudioChange}
                className="hidden"
                disabled={uploading}
                multiple
              />
              <label htmlFor="audio-files">
                <Button type="button" variant="default" disabled={uploading} className="bg-gradient-to-r from-primary to-secondary shadow-glow cursor-pointer" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Select Audio Files
                  </span>
                </Button>
              </label>
            </div>
          </Card>

          {/* Artwork Upload */}
          <Card className="p-6">
            <Label className="text-base font-semibold mb-4 block">
              Artwork (Optional) {isMotionCover && <Badge className="ml-2 bg-primary">Motion Art 🎬</Badge>}
            </Label>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border-2 border-dashed border-primary/30 rounded-lg p-6 text-center hover:border-primary/60 transition-colors">
                <ImageIcon className="h-10 w-10 mx-auto mb-3 text-primary" />
                <div className="text-sm font-medium mb-1">Upload Cover Art</div>
                <div className="text-xs text-muted-foreground mb-4">
                  <div>Static: JPG, PNG · Min 3000x3000px · Max 10MB</div>
                  <div className="text-primary font-semibold mt-1">Motion: MP4, WebM, MOV · Max 50MB 🎬</div>
                </div>
                <input
                  id="artwork-file"
                  type="file"
                  accept="image/jpeg,image/png,video/mp4,video/webm,video/quicktime,image/gif"
                  onChange={handleArtworkChange}
                  className="hidden"
                  disabled={uploading}
                />
                <label htmlFor="artwork-file">
                  <Button type="button" variant="outline" disabled={uploading} className="cursor-pointer" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Choose {isMotionCover ? "Video" : "Image"}
                    </span>
                  </Button>
                </label>
              </div>
              {artworkPreview && (
                <div className="relative rounded-lg overflow-hidden bg-muted shadow-glow">
                  {isMotionCover ? (
                    <video 
                      src={artworkPreview} 
                      className="w-full h-full object-cover" 
                      autoPlay 
                      loop 
                      muted
                      playsInline
                    />
                  ) : (
                    <img src={artworkPreview} alt="Artwork preview" className="w-full h-full object-cover" />
                  )}
                  <Badge className="absolute top-2 right-2 shadow-glow">
                    {isMotionCover ? "Motion Preview 🎬" : "Preview"}
                  </Badge>
                </div>
              )}
            </div>
          </Card>

          {/* Basic Metadata */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Track Title {audioFiles.length <= 1 ? "*" : "(Optional - uses filename)"}</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={audioFiles.length > 1 ? "Leave blank to use filenames" : "Song name"}
                disabled={uploading}
              />
              {audioFiles.length > 1 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Leave blank to auto-generate titles from file names
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="artist">Artist Name {audioFiles.length <= 1 ? "*" : "(Optional)"}</Label>
              <Input
                id="artist"
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                placeholder={audioFiles.length > 1 ? "Leave blank for 'Unknown Artist'" : "Your artist name"}
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
                  <SelectItem value="r&b">R&B</SelectItem>
                  <SelectItem value="country">Country</SelectItem>
                  <SelectItem value="jazz">Jazz</SelectItem>
                  <SelectItem value="classical">Classical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="explicit">Explicit Content</Label>
              <Select value={explicitContent} onValueChange={setExplicitContent} disabled={uploading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="cleaned">Cleaned Version</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about your track..."
              rows={3}
              disabled={uploading}
            />
          </div>
        </TabsContent>

        <TabsContent value="publishing" className="space-y-4">
          <Card className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="isrc">ISRC Code</Label>
                <Input
                  id="isrc"
                  value={isrc}
                  onChange={(e) => setIsrc(e.target.value)}
                  placeholder="US-XXX-XX-XXXXX"
                  disabled={uploading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave blank to auto-generate
                </p>
              </div>
              <div>
                <Label htmlFor="upc">UPC/EAN Code</Label>
                <Input
                  id="upc"
                  value={upc}
                  onChange={(e) => setUpc(e.target.value)}
                  placeholder="123456789012"
                  disabled={uploading}
                />
              </div>
              <div>
                <Label htmlFor="copyright-year">Copyright Year</Label>
                <Input
                  id="copyright-year"
                  value={copyrightYear}
                  onChange={(e) => setCopyrightYear(e.target.value)}
                  placeholder="2025"
                  disabled={uploading}
                />
              </div>
              <div>
                <Label htmlFor="copyright-holder">Copyright Holder</Label>
                <Input
                  id="copyright-holder"
                  value={copyrightHolder}
                  onChange={(e) => setCopyrightHolder(e.target.value)}
                  placeholder="Your Name or Label"
                  disabled={uploading}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <Label htmlFor="p-line">℗ Line (Production Copyright)</Label>
                <Input
                  id="p-line"
                  value={pLine}
                  onChange={(e) => setPLine(e.target.value)}
                  placeholder="℗ 2025 Artist Name"
                  disabled={uploading}
                />
              </div>
              <div>
                <Label htmlFor="c-line">© Line (Composition Copyright)</Label>
                <Input
                  id="c-line"
                  value={cLine}
                  onChange={(e) => setCLine(e.target.value)}
                  placeholder="© 2025 Songwriter Name"
                  disabled={uploading}
                />
              </div>
              <div>
                <Label htmlFor="publishing-rights">Publishing Rights Holder</Label>
                <Input
                  id="publishing-rights"
                  value={publishingRights}
                  onChange={(e) => setPublishingRights(e.target.value)}
                  placeholder="Publishing Company or Self-Published"
                  disabled={uploading}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="contributors" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Add Contributors & Publishing Splits</h3>
            
            <div className="grid md:grid-cols-4 gap-3 mb-4">
              <div className="md:col-span-2">
                <Label>Name</Label>
                <Input
                  value={newContributor.name}
                  onChange={(e) => setNewContributor({ ...newContributor, name: e.target.value })}
                  placeholder="Contributor name"
                  disabled={uploading}
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select 
                  value={newContributor.role} 
                  onValueChange={(value) => setNewContributor({ ...newContributor, role: value })}
                  disabled={uploading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="songwriter">Songwriter</SelectItem>
                    <SelectItem value="producer">Producer</SelectItem>
                    <SelectItem value="composer">Composer</SelectItem>
                    <SelectItem value="featured">Featured Artist</SelectItem>
                    <SelectItem value="engineer">Engineer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Split %</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={newContributor.split}
                    onChange={(e) => setNewContributor({ ...newContributor, split: Number(e.target.value) })}
                    placeholder="0"
                    disabled={uploading}
                  />
                  <Button onClick={addContributor} size="icon" disabled={uploading}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {contributors.map((contributor) => (
                <div key={contributor.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{contributor.name}</span>
                      <Badge variant="secondary">{contributor.role}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold">{contributor.publishingSplit}%</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeContributor(contributor.id)}
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {contributors.length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total Publishing Split:</span>
                  <span className="text-xl font-bold">
                    {contributors.reduce((sum, c) => sum + c.publishingSplit, 0)}%
                  </span>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

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
        disabled={uploading || audioFiles.length === 0}
        className="w-full h-12 bg-gradient-to-r from-primary via-secondary to-accent shadow-glow hover-lift"
      >
        {uploading ? (
          <>Uploading {audioFiles.length} track(s)...</>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Upload {audioFiles.length > 0 ? `${audioFiles.length} Track(s)` : "Music"}
          </>
        )}
      </Button>
    </div>
  );
};
