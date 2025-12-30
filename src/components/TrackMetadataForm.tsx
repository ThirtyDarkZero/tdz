import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Music, Users, FileText, Info, Shield, CalendarIcon, 
  Plus, X, AlertCircle, CheckCircle2, Upload
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface Contributor {
  id: string;
  name: string;
  role: 'writer' | 'producer' | 'performer' | 'featured' | 'mixer' | 'master' | 'composer';
  split: number;
}

export interface PublishingInfo {
  pro: 'bmi' | 'ascap' | 'sesac' | 'other' | null;
  youtube_monetization: boolean;
  sound_exchange: boolean;
}

export interface TrackCredits {
  writers: Contributor[];
  producers: Contributor[];
  performers: Contributor[];
  featured_artists: Contributor[];
}

export interface TrackMetadata {
  // Required fields
  title: string;
  artistName: string;
  label: string;
  copyrightOwner: string;
  copyrightYear: number;
  releaseType: 'single' | 'ep' | 'album';
  upc: string;
  genre: string;
  
  // Auto-generated but editable
  isrc: string;
  
  // Optional fields
  language: string;
  releaseVersion: string;
  originalReleaseDate: Date | null;
  preorderDate: Date | null;
  explicit: boolean;
  pLine: string;
  cLine: string;
  appleMotionArt1x1: string;
  appleMotionArt3x4: string;
  
  // Structured data
  credits: TrackCredits;
  publishingInfo: PublishingInfo;
}

interface TrackMetadataFormProps {
  initialData?: Partial<TrackMetadata>;
  onMetadataChange: (metadata: TrackMetadata, isComplete: boolean) => void;
  showValidation?: boolean;
}

const REQUIRED_FIELDS = [
  'title', 'artistName', 'label', 'copyrightOwner', 
  'copyrightYear', 'releaseType', 'genre'
] as const;

const generateISRC = () => {
  const countryCode = 'US';
  const registrantCode = 'TDZ';
  const year = new Date().getFullYear().toString().slice(-2);
  const designation = Math.floor(Math.random() * 99999 + 1).toString().padStart(5, '0');
  return `${countryCode}${registrantCode}${year}${designation}`;
};

const generateUPC = () => {
  const prefix = '8';
  const randomDigits = Math.floor(Math.random() * 99999999999 + 1).toString().padStart(11, '0');
  let fullUpc = prefix + randomDigits;
  
  let sumOdd = 0, sumEven = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(fullUpc[i]);
    if ((i + 1) % 2 === 1) sumOdd += digit;
    else sumEven += digit;
  }
  const checkDigit = (10 - ((sumOdd * 3 + sumEven) % 10)) % 10;
  return fullUpc + checkDigit;
};

const defaultMetadata: TrackMetadata = {
  title: '',
  artistName: '',
  label: '',
  copyrightOwner: '',
  copyrightYear: new Date().getFullYear(),
  releaseType: 'single',
  upc: '',
  genre: '',
  isrc: '',
  language: 'English',
  releaseVersion: 'Original',
  originalReleaseDate: null,
  preorderDate: null,
  explicit: false,
  pLine: '',
  cLine: '',
  appleMotionArt1x1: '',
  appleMotionArt3x4: '',
  credits: {
    writers: [],
    producers: [],
    performers: [],
    featured_artists: []
  },
  publishingInfo: {
    pro: null,
    youtube_monetization: false,
    sound_exchange: false
  }
};

export const TrackMetadataForm = ({ 
  initialData, 
  onMetadataChange,
  showValidation = false 
}: TrackMetadataFormProps) => {
  const [metadata, setMetadata] = useState<TrackMetadata>(() => ({
    ...defaultMetadata,
    isrc: generateISRC(),
    upc: generateUPC(),
    ...initialData
  }));
  
  const [newContributor, setNewContributor] = useState({
    name: '',
    role: '' as Contributor['role'],
    split: 0
  });

  // Validation
  const getValidationErrors = () => {
    const errors: string[] = [];
    
    if (!metadata.title.trim()) errors.push('Track title is required');
    if (!metadata.artistName.trim()) errors.push('Artist name is required');
    if (!metadata.label.trim()) errors.push('Label is required');
    if (!metadata.copyrightOwner.trim()) errors.push('Copyright owner is required');
    if (!metadata.copyrightYear) errors.push('Copyright year is required');
    if (!metadata.genre) errors.push('Genre is required');
    
    // Check for at least one contributor
    const totalContributors = 
      metadata.credits.writers.length + 
      metadata.credits.producers.length + 
      metadata.credits.performers.length;
    
    if (totalContributors === 0) {
      errors.push('At least one credit (writer, producer, or performer) is required');
    }
    
    // Check publishing info
    if (!metadata.publishingInfo.pro) {
      errors.push('Performance Rights Organization (PRO) is required');
    }
    
    return errors;
  };

  const isComplete = getValidationErrors().length === 0;

  useEffect(() => {
    onMetadataChange(metadata, isComplete);
  }, [metadata, isComplete, onMetadataChange]);

  const updateMetadata = (updates: Partial<TrackMetadata>) => {
    setMetadata(prev => ({ ...prev, ...updates }));
  };

  const addContributor = (type: keyof TrackCredits) => {
    if (!newContributor.name.trim() || !newContributor.role) return;
    
    const contributor: Contributor = {
      id: crypto.randomUUID(),
      name: newContributor.name.trim(),
      role: newContributor.role,
      split: newContributor.split
    };
    
    setMetadata(prev => ({
      ...prev,
      credits: {
        ...prev.credits,
        [type]: [...prev.credits[type], contributor]
      }
    }));
    
    setNewContributor({ name: '', role: '' as Contributor['role'], split: 0 });
  };

  const removeContributor = (type: keyof TrackCredits, id: string) => {
    setMetadata(prev => ({
      ...prev,
      credits: {
        ...prev.credits,
        [type]: prev.credits[type].filter(c => c.id !== id)
      }
    }));
  };

  const validationErrors = getValidationErrors();
  const totalSplit = [
    ...metadata.credits.writers,
    ...metadata.credits.producers,
    ...metadata.credits.performers,
    ...metadata.credits.featured_artists
  ].reduce((sum, c) => sum + c.split, 0);

  return (
    <Card className="p-4 bg-card/50 border-border/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Distribution Metadata
        </h3>
        {showValidation && (
          <Badge variant={isComplete ? "default" : "destructive"} className="gap-1">
            {isComplete ? (
              <>
                <CheckCircle2 className="w-3 h-3" />
                Complete
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3" />
                {validationErrors.length} Missing
              </>
            )}
          </Badge>
        )}
      </div>

      {showValidation && validationErrors.length > 0 && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm font-medium text-destructive mb-2">Required before upload:</p>
          <ul className="text-xs text-destructive/80 space-y-1">
            {validationErrors.map((error, i) => (
              <li key={i} className="flex items-center gap-1">
                <X className="w-3 h-3" /> {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-4">
          <TabsTrigger value="basic" className="text-xs">
            <Info className="w-3 h-3 mr-1" />
            Basic
          </TabsTrigger>
          <TabsTrigger value="rights" className="text-xs">
            <Shield className="w-3 h-3 mr-1" />
            Rights
          </TabsTrigger>
          <TabsTrigger value="credits" className="text-xs">
            <Users className="w-3 h-3 mr-1" />
            Credits
          </TabsTrigger>
          <TabsTrigger value="publishing" className="text-xs">
            <Music className="w-3 h-3 mr-1" />
            Publishing
          </TabsTrigger>
          <TabsTrigger value="assets" className="text-xs">
            <FileText className="w-3 h-3 mr-1" />
            Assets
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[400px] pr-4">
          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4 mt-0">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Track Title *</Label>
                <Input
                  value={metadata.title}
                  onChange={(e) => updateMetadata({ title: e.target.value })}
                  placeholder="Enter track title"
                  className={cn(
                    showValidation && !metadata.title.trim() && "border-destructive"
                  )}
                />
              </div>
              <div>
                <Label className="text-xs">Artist(s) *</Label>
                <Input
                  value={metadata.artistName}
                  onChange={(e) => updateMetadata({ artistName: e.target.value })}
                  placeholder="Primary artist name"
                  className={cn(
                    showValidation && !metadata.artistName.trim() && "border-destructive"
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Label *</Label>
                <Input
                  value={metadata.label}
                  onChange={(e) => updateMetadata({ label: e.target.value })}
                  placeholder="Record label or self-released"
                  className={cn(
                    showValidation && !metadata.label.trim() && "border-destructive"
                  )}
                />
              </div>
              <div>
                <Label className="text-xs">Genre(s) *</Label>
                <Select 
                  value={metadata.genre} 
                  onValueChange={(v) => updateMetadata({ genre: v })}
                >
                  <SelectTrigger className={cn(
                    showValidation && !metadata.genre && "border-destructive"
                  )}>
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pop">Pop</SelectItem>
                    <SelectItem value="rock">Rock</SelectItem>
                    <SelectItem value="hip-hop">Hip Hop</SelectItem>
                    <SelectItem value="r&b">R&B</SelectItem>
                    <SelectItem value="electronic">Electronic</SelectItem>
                    <SelectItem value="country">Country</SelectItem>
                    <SelectItem value="jazz">Jazz</SelectItem>
                    <SelectItem value="classical">Classical</SelectItem>
                    <SelectItem value="indie">Indie</SelectItem>
                    <SelectItem value="latin">Latin</SelectItem>
                    <SelectItem value="metal">Metal</SelectItem>
                    <SelectItem value="folk">Folk</SelectItem>
                    <SelectItem value="reggae">Reggae</SelectItem>
                    <SelectItem value="blues">Blues</SelectItem>
                    <SelectItem value="soul">Soul</SelectItem>
                    <SelectItem value="dance">Dance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Release Type *</Label>
                <Select 
                  value={metadata.releaseType} 
                  onValueChange={(v: 'single' | 'ep' | 'album') => updateMetadata({ releaseType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="ep">EP</SelectItem>
                    <SelectItem value="album">Album</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Language</Label>
                <Select 
                  value={metadata.language} 
                  onValueChange={(v) => updateMetadata({ language: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Spanish">Spanish</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                    <SelectItem value="German">German</SelectItem>
                    <SelectItem value="Portuguese">Portuguese</SelectItem>
                    <SelectItem value="Japanese">Japanese</SelectItem>
                    <SelectItem value="Korean">Korean</SelectItem>
                    <SelectItem value="Chinese">Chinese</SelectItem>
                    <SelectItem value="Instrumental">Instrumental</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Release Version</Label>
                <Select 
                  value={metadata.releaseVersion} 
                  onValueChange={(v) => updateMetadata({ releaseVersion: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Original">Original</SelectItem>
                    <SelectItem value="Remix">Remix</SelectItem>
                    <SelectItem value="Acoustic">Acoustic</SelectItem>
                    <SelectItem value="Live">Live</SelectItem>
                    <SelectItem value="Radio Edit">Radio Edit</SelectItem>
                    <SelectItem value="Extended">Extended</SelectItem>
                    <SelectItem value="Deluxe">Deluxe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="text-xs font-medium">Explicit Content</Label>
                <p className="text-xs text-muted-foreground">Does this track contain explicit lyrics?</p>
              </div>
              <Switch
                checked={metadata.explicit}
                onCheckedChange={(v) => updateMetadata({ explicit: v })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Original Release Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {metadata.originalReleaseDate ? format(metadata.originalReleaseDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={metadata.originalReleaseDate || undefined}
                      onSelect={(date) => updateMetadata({ originalReleaseDate: date || null })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-xs">Preorder Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {metadata.preorderDate ? format(metadata.preorderDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={metadata.preorderDate || undefined}
                      onSelect={(date) => updateMetadata({ preorderDate: date || null })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </TabsContent>

          {/* Rights Tab */}
          <TabsContent value="rights" className="space-y-4 mt-0">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">ISRC Code</Label>
                <Input
                  value={metadata.isrc}
                  onChange={(e) => updateMetadata({ isrc: e.target.value })}
                  placeholder="Auto-generated if empty"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-generated for new releases
                </p>
              </div>
              <div>
                <Label className="text-xs">UPC *</Label>
                <Input
                  value={metadata.upc}
                  onChange={(e) => updateMetadata({ upc: e.target.value })}
                  placeholder="Auto-generated if empty"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Universal Product Code
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Copyright Owner *</Label>
                <Input
                  value={metadata.copyrightOwner}
                  onChange={(e) => updateMetadata({ copyrightOwner: e.target.value })}
                  placeholder="Your name or entity"
                  className={cn(
                    showValidation && !metadata.copyrightOwner.trim() && "border-destructive"
                  )}
                />
              </div>
              <div>
                <Label className="text-xs">Copyright Year *</Label>
                <Input
                  type="number"
                  value={metadata.copyrightYear}
                  onChange={(e) => updateMetadata({ copyrightYear: parseInt(e.target.value) || new Date().getFullYear() })}
                  placeholder="2024"
                  min={1900}
                  max={2100}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">℗ Line (Sound Recording)</Label>
                <Input
                  value={metadata.pLine}
                  onChange={(e) => updateMetadata({ pLine: e.target.value })}
                  placeholder="℗ 2024 Label Name"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Who owns the master recording
                </p>
              </div>
              <div>
                <Label className="text-xs">© Line (Composition)</Label>
                <Input
                  value={metadata.cLine}
                  onChange={(e) => updateMetadata({ cLine: e.target.value })}
                  placeholder="© 2024 Publisher Name"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Who owns the composition
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Credits Tab */}
          <TabsContent value="credits" className="space-y-4 mt-0">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-3">
                Add at least one contributor (writer, producer, or performer) *
              </p>
              
              <div className="grid grid-cols-4 gap-2">
                <Input
                  placeholder="Name"
                  value={newContributor.name}
                  onChange={(e) => setNewContributor(prev => ({ ...prev, name: e.target.value }))}
                  className="text-sm"
                />
                <Select
                  value={newContributor.role}
                  onValueChange={(v: Contributor['role']) => setNewContributor(prev => ({ ...prev, role: v }))}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="writer">Writer</SelectItem>
                    <SelectItem value="composer">Composer</SelectItem>
                    <SelectItem value="producer">Producer</SelectItem>
                    <SelectItem value="performer">Performer</SelectItem>
                    <SelectItem value="featured">Featured Artist</SelectItem>
                    <SelectItem value="mixer">Mixing Engineer</SelectItem>
                    <SelectItem value="master">Mastering Engineer</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Split %"
                  value={newContributor.split || ''}
                  onChange={(e) => setNewContributor(prev => ({ ...prev, split: parseInt(e.target.value) || 0 }))}
                  className="text-sm"
                  min={0}
                  max={100}
                />
                <Button 
                  size="sm" 
                  onClick={() => {
                    const typeMap: Record<Contributor['role'], keyof TrackCredits> = {
                      writer: 'writers',
                      composer: 'writers',
                      producer: 'producers',
                      performer: 'performers',
                      featured: 'featured_artists',
                      mixer: 'producers',
                      master: 'producers'
                    };
                    addContributor(typeMap[newContributor.role] || 'writers');
                  }}
                  disabled={!newContributor.name.trim() || !newContributor.role}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Display all contributors */}
            {Object.entries(metadata.credits).map(([type, contributors]) => (
              contributors.length > 0 && (
                <div key={type} className="space-y-2">
                  <Label className="text-xs capitalize">{type.replace('_', ' ')}</Label>
                  <div className="space-y-1">
                    {contributors.map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{c.name}</span>
                          <Badge variant="secondary" className="text-xs">{c.role}</Badge>
                          {c.split > 0 && (
                            <Badge variant="outline" className="text-xs">{c.split}%</Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeContributor(type as keyof TrackCredits, c.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}

            {totalSplit > 0 && (
              <div className="flex items-center justify-between p-2 bg-primary/10 rounded">
                <span className="text-sm">Total Split</span>
                <Badge variant={totalSplit === 100 ? "default" : "secondary"}>
                  {totalSplit}%
                </Badge>
              </div>
            )}
          </TabsContent>

          {/* Publishing Tab */}
          <TabsContent value="publishing" className="space-y-4 mt-0">
            <div>
              <Label className="text-xs">Performance Rights Organization (PRO) *</Label>
              <Select
                value={metadata.publishingInfo.pro || ''}
                onValueChange={(v: 'bmi' | 'ascap' | 'sesac' | 'other') => 
                  updateMetadata({ 
                    publishingInfo: { ...metadata.publishingInfo, pro: v } 
                  })
                }
              >
                <SelectTrigger className={cn(
                  showValidation && !metadata.publishingInfo.pro && "border-destructive"
                )}>
                  <SelectValue placeholder="Select your PRO" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bmi">BMI</SelectItem>
                  <SelectItem value="ascap">ASCAP</SelectItem>
                  <SelectItem value="sesac">SESAC</SelectItem>
                  <SelectItem value="other">Other / None</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Required for royalty collection
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="text-xs font-medium">YouTube Content ID</Label>
                  <p className="text-xs text-muted-foreground">Enable YouTube monetization</p>
                </div>
                <Switch
                  checked={metadata.publishingInfo.youtube_monetization}
                  onCheckedChange={(v) => 
                    updateMetadata({ 
                      publishingInfo: { ...metadata.publishingInfo, youtube_monetization: v } 
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="text-xs font-medium">SoundExchange</Label>
                  <p className="text-xs text-muted-foreground">Register for digital performance royalties</p>
                </div>
                <Switch
                  checked={metadata.publishingInfo.sound_exchange}
                  onCheckedChange={(v) => 
                    updateMetadata({ 
                      publishingInfo: { ...metadata.publishingInfo, sound_exchange: v } 
                    })
                  }
                />
              </div>
            </div>
          </TabsContent>

          {/* Assets Tab */}
          <TabsContent value="assets" className="space-y-4 mt-0">
            <div>
              <Label className="text-xs">Apple Motion Art (1:1)</Label>
              <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">
                  Upload square motion artwork (optional)
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  MP4 or MOV, max 30 seconds
                </p>
              </div>
            </div>

            <div>
              <Label className="text-xs">Apple Motion Art (3:4)</Label>
              <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">
                  Upload portrait motion artwork (optional)
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  MP4 or MOV, max 30 seconds
                </p>
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </Card>
  );
};
