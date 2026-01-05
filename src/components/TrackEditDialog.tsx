import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, Music, Users, FileText, Info, Save, Loader2 } from "lucide-react";

interface Contributor {
  id: string;
  name: string;
  role: string;
  split: number;
}

// Flexible track interface that accepts any ai_tags structure
interface Track {
  id: string;
  title: string;
  artist_name: string;
  genre?: string;
  lyrics?: string;
  ai_tags?: Record<string, unknown>;
  download_price?: number | null;
}

interface TrackEditDialogProps {
  track: Track | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Helper to safely extract metadata from ai_tags
const getMetadata = (aiTags?: Record<string, unknown>) => {
  if (!aiTags || typeof aiTags !== 'object') return {};
  const metadata = aiTags.metadata;
  if (!metadata || typeof metadata !== 'object') return {};
  return metadata as Record<string, unknown>;
};

export const TrackEditDialog = ({ track, open, onOpenChange, onSuccess }: TrackEditDialogProps) => {
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Basic Info
  const [title, setTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [genre, setGenre] = useState("");
  const [explicitContent, setExplicitContent] = useState("no");
  const [language, setLanguage] = useState("en");
  const [description, setDescription] = useState("");

  // Lyrics
  const [lyrics, setLyrics] = useState("");

  // Credits & Publishing
  const [isrc, setIsrc] = useState("");
  const [upc, setUpc] = useState("");
  const [copyrightYear, setCopyrightYear] = useState(new Date().getFullYear().toString());
  const [copyrightHolder, setCopyrightHolder] = useState("");
  const [pLine, setPLine] = useState("");
  const [cLine, setCLine] = useState("");

  // Contributors
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [newContributor, setNewContributor] = useState({ name: "", role: "", split: 0 });

  // Pricing
  const [downloadPrice, setDownloadPrice] = useState<string>("");

  // Update form fields when track changes
  useEffect(() => {
    if (track) {
      setTitle(track.title);
      setArtistName(track.artist_name);
      setGenre(track.genre || "");
      setLyrics(track.lyrics || "");
      setDownloadPrice(track.download_price ? track.download_price.toString() : "");

      const metadata = getMetadata(track.ai_tags);
      setIsrc(String(metadata.isrc || ""));
      setUpc(String(metadata.upc || ""));
      setCopyrightYear(String(metadata.copyrightYear || new Date().getFullYear()));
      setCopyrightHolder(String(metadata.copyrightHolder || ""));
      setPLine(String(metadata.pLine || ""));
      setCLine(String(metadata.cLine || ""));
      setExplicitContent(String(metadata.explicitContent || "no"));
      setLanguage(String(metadata.language || "en"));
      setDescription(String(metadata.description || ""));
      setContributors(Array.isArray(metadata.contributors) ? metadata.contributors as Contributor[] : []);
    }
  }, [track]);

  const addContributor = () => {
    if (!newContributor.name || !newContributor.role) {
      toast({ title: "Please complete contributor name and role", variant: "destructive" });
      return;
    }

    const totalSplit = contributors.reduce((sum, c) => sum + c.split, 0) + newContributor.split;
    if (totalSplit > 100) {
      toast({ title: "Total splits cannot exceed 100%", variant: "destructive" });
      return;
    }

    setContributors([...contributors, {
      id: crypto.randomUUID(),
      name: newContributor.name,
      role: newContributor.role,
      split: newContributor.split
    }]);
    setNewContributor({ name: "", role: "", split: 0 });
  };

  const removeContributor = (id: string) => {
    setContributors(contributors.filter(c => c.id !== id));
  };

  const handleSave = async () => {
    if (!track) return;

    setSaving(true);
    try {
      const existingTags = (track.ai_tags && typeof track.ai_tags === 'object') ? track.ai_tags : {};
      const existingMetadata = getMetadata(track.ai_tags);

      const updatedAiTags = {
        ...existingTags,
        metadata: {
          ...existingMetadata,
          isrc,
          upc,
          copyrightYear,
          copyrightHolder,
          pLine,
          cLine,
          explicitContent,
          language,
          description,
          contributors: contributors.map(c => ({ id: c.id, name: c.name, role: c.role, split: c.split }))
        }
      };

      const priceValue = downloadPrice ? parseFloat(downloadPrice) : null;
      
      const { error } = await supabase
        .from('tracks')
        .update({
          title: title.slice(0, 200),
          artist_name: artistName.slice(0, 100),
          genre: genre || null,
          lyrics: lyrics || null,
          ai_tags: updatedAiTags,
          download_price: priceValue && priceValue > 0 ? priceValue : null
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

  const totalSplit = contributors.reduce((sum, c) => sum + c.split, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            Edit Track Metadata
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Basic
            </TabsTrigger>
            <TabsTrigger value="lyrics" className="gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Lyrics
            </TabsTrigger>
            <TabsTrigger value="credits" className="gap-1.5">
              <Music className="w-3.5 h-3.5" />
              Credits
            </TabsTrigger>
            <TabsTrigger value="contributors" className="gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Splits
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] mt-4 pr-4">
            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4 mt-0">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-title">Track Title *</Label>
                  <Input
                    id="edit-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Song name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-artist">Artist Name *</Label>
                  <Input
                    id="edit-artist"
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    placeholder="Your artist name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                      <SelectItem value="ai-generated">AI-Generated</SelectItem>
                      <SelectItem value="ai-assisted">AI-Assisted</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-language">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="pt">Portuguese</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                      <SelectItem value="ko">Korean</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                      <SelectItem value="instrumental">Instrumental</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-explicit">Explicit Content</Label>
                <Select value={explicitContent} onValueChange={setExplicitContent}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No explicit content</SelectItem>
                    <SelectItem value="yes">Contains explicit content</SelectItem>
                    <SelectItem value="clean">Clean version</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell listeners about this track..."
                  rows={3}
                />
              </div>

              <Separator />

              <div>
                <Label htmlFor="edit-download-price">Download Price (USD)</Label>
                <Input
                  id="edit-download-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={downloadPrice}
                  onChange={(e) => setDownloadPrice(e.target.value)}
                  placeholder="0.00 = Free download"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty or set to 0 for free downloads. Set a price to require purchase.
                </p>
              </div>
            </TabsContent>

            {/* Lyrics Tab */}
            <TabsContent value="lyrics" className="space-y-4 mt-0">
              <div>
                <Label htmlFor="edit-lyrics" className="flex items-center justify-between">
                  <span>Lyrics</span>
                  <span className="text-xs text-muted-foreground">
                    {lyrics.length} characters
                  </span>
                </Label>
                <Textarea
                  id="edit-lyrics"
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  placeholder="Enter your lyrics here...

[Verse 1]
...

[Chorus]
...

[Verse 2]
..."
                  rows={16}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Add lyrics with section markers like [Verse], [Chorus], [Bridge] for better formatting
                </p>
              </div>
            </TabsContent>

            {/* Credits Tab */}
            <TabsContent value="credits" className="space-y-4 mt-0">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-isrc">ISRC Code</Label>
                  <Input
                    id="edit-isrc"
                    value={isrc}
                    onChange={(e) => setIsrc(e.target.value)}
                    placeholder="e.g., USRC17607839"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    International Standard Recording Code
                  </p>
                </div>
                <div>
                  <Label htmlFor="edit-upc">UPC/EAN</Label>
                  <Input
                    id="edit-upc"
                    value={upc}
                    onChange={(e) => setUpc(e.target.value)}
                    placeholder="e.g., 012345678905"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Universal Product Code
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-copyright-year">Copyright Year</Label>
                  <Input
                    id="edit-copyright-year"
                    value={copyrightYear}
                    onChange={(e) => setCopyrightYear(e.target.value)}
                    placeholder="2024"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-copyright-holder">Copyright Holder</Label>
                  <Input
                    id="edit-copyright-holder"
                    value={copyrightHolder}
                    onChange={(e) => setCopyrightHolder(e.target.value)}
                    placeholder="Your name or label"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-pline">℗ Line (Sound Recording)</Label>
                  <Input
                    id="edit-pline"
                    value={pLine}
                    onChange={(e) => setPLine(e.target.value)}
                    placeholder="℗ 2024 Label Name"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Who owns the sound recording
                  </p>
                </div>
                <div>
                  <Label htmlFor="edit-cline">© Line (Composition)</Label>
                  <Input
                    id="edit-cline"
                    value={cLine}
                    onChange={(e) => setCLine(e.target.value)}
                    placeholder="© 2024 Publisher Name"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Who owns the composition
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Contributors Tab */}
            <TabsContent value="contributors" className="space-y-4 mt-0">
              <Card className="p-4 border-dashed">
                <h4 className="font-medium mb-3">Add Contributor</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={newContributor.name}
                      onChange={(e) => setNewContributor({ ...newContributor, name: e.target.value })}
                      placeholder="Contributor name"
                    />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Select
                      value={newContributor.role}
                      onValueChange={(v) => setNewContributor({ ...newContributor, role: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="writer">Songwriter</SelectItem>
                        <SelectItem value="composer">Composer</SelectItem>
                        <SelectItem value="producer">Producer</SelectItem>
                        <SelectItem value="featured">Featured Artist</SelectItem>
                        <SelectItem value="mixer">Mixing Engineer</SelectItem>
                        <SelectItem value="master">Mastering Engineer</SelectItem>
                        <SelectItem value="performer">Performer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Split %</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={newContributor.split}
                        onChange={(e) => setNewContributor({ ...newContributor, split: Number(e.target.value) })}
                        placeholder="0"
                      />
                      <Button size="icon" onClick={addContributor}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {contributors.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Contributors</h4>
                    <Badge variant={totalSplit === 100 ? "default" : "secondary"}>
                      {totalSplit}% allocated
                    </Badge>
                  </div>
                  {contributors.map((contributor) => (
                    <Card key={contributor.id} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{contributor.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{contributor.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{contributor.split}%</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeContributor(contributor.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                  {totalSplit !== 100 && totalSplit > 0 && (
                    <p className="text-xs text-amber-500">
                      Publishing splits should total 100% for proper royalty distribution
                    </p>
                  )}
                </div>
              ) : (
                <Card className="p-6 text-center border-dashed">
                  <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No contributors added yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add songwriters, producers, and collaborators above
                  </p>
                </Card>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
