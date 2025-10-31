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
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [artworkPreview, setArtworkPreview] = useState<string>("");
  
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
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image must be less than 10MB");
        return;
      }
      setArtworkFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setArtworkPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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

  const handleUpload = async () => {
    if (!audioFile) {
      toast.error("Please select an audio file");
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

      // Upload artwork first
      setProgress(20);
      const artworkPath = `${user.id}/artwork/${Date.now()}-${artworkFile.name}`;
      const { error: artworkError } = await supabase.storage
        .from('album-covers')
        .upload(artworkPath, artworkFile, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (artworkError) throw artworkError;
      
      const { data: { publicUrl: artworkUrl } } = supabase.storage
        .from('album-covers')
        .getPublicUrl(artworkPath);

      // Get audio duration
      setProgress(30);
      const audio = new Audio();
      const duration = await new Promise<number>((resolve) => {
        audio.onloadedmetadata = () => resolve(Math.floor(audio.duration));
        audio.src = URL.createObjectURL(audioFile);
      });

      // Upload audio file
      setProgress(40);
      const sanitizedFileName = audioFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${user.id}/${Date.now()}-${sanitizedFileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('track-files')
        .upload(filePath, audioFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;
      setProgress(70);

      // AI analysis
      const { data: aiData } = await supabase.functions.invoke('analyze-track-metadata', {
        body: { filePath, fileName: audioFile.name }
      });

      setProgress(85);
      
      // Create track record with full metadata
      const { error: dbError } = await supabase.from('tracks').insert({
        user_id: user.id,
        title: title.slice(0, 200),
        artist_name: artistName.slice(0, 100),
        duration,
        file_path: filePath,
        genre,
        is_published: false,
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
            artworkUrl
          }
        },
        bpm: aiData?.bpm || null,
        key: aiData?.key || null,
        mood: aiData?.mood || null
      });

      if (dbError) throw dbError;

      setProgress(100);
      toast.success("Music uploaded successfully!", {
        description: "Your track is ready for distribution"
      });
      
      // Reset form
      setAudioFile(null);
      setArtworkFile(null);
      setArtworkPreview("");
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
          {/* Audio File Upload */}
          <Card className="p-6">
            <Label className="text-base font-semibold mb-4 block">Audio File *</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Music className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <Label htmlFor="audio-file" className="cursor-pointer">
                <div className="text-sm font-medium mb-1">
                  {audioFile ? audioFile.name : "Choose Audio File"}
                </div>
                <div className="text-xs text-muted-foreground mb-3">
                  MP3, WAV, FLAC · Max 200MB
                </div>
                <Input
                  id="audio-file"
                  type="file"
                  accept="audio/mpeg,audio/mp3,audio/wav,audio/flac,audio/m4a"
                  onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                  className="hidden"
                  disabled={uploading}
                />
                <Button type="button" variant="outline" disabled={uploading}>
                  <Upload className="h-4 w-4 mr-2" />
                  Select File
                </Button>
              </Label>
            </div>
          </Card>

          {/* Artwork Upload */}
          <Card className="p-6">
            <Label className="text-base font-semibold mb-4 block">Artwork *</Label>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <ImageIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <Label htmlFor="artwork-file" className="cursor-pointer">
                  <div className="text-sm font-medium mb-1">Upload Cover Art</div>
                  <div className="text-xs text-muted-foreground mb-3">
                    JPG, PNG · Min 3000x3000px · Max 10MB
                  </div>
                  <Input
                    id="artwork-file"
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleArtworkChange}
                    className="hidden"
                    disabled={uploading}
                  />
                  <Button type="button" variant="outline" disabled={uploading}>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Image
                  </Button>
                </Label>
              </div>
              {artworkPreview && (
                <div className="relative rounded-lg overflow-hidden bg-muted">
                  <img src={artworkPreview} alt="Artwork preview" className="w-full h-full object-cover" />
                  <Badge className="absolute top-2 right-2">Preview</Badge>
                </div>
              )}
            </div>
          </Card>

          {/* Basic Metadata */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Track Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Song name"
                disabled={uploading}
              />
            </div>
            <div>
              <Label htmlFor="artist">Artist Name *</Label>
              <Input
                id="artist"
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
        disabled={uploading || !audioFile || !artworkFile || !title || !artistName}
        className="w-full h-12 bg-gradient-to-r from-primary via-secondary to-accent"
      >
        {uploading ? (
          <>Uploading...</>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Upload Music
          </>
        )}
      </Button>
    </div>
  );
};
