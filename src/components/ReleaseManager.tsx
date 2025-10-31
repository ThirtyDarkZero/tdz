import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { CalendarIcon, Upload, Globe, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const platforms = [
  { id: "spotify", name: "Spotify", icon: "🎵" },
  { id: "apple", name: "Apple Music", icon: "🍎" },
  { id: "youtube", name: "YouTube Music", icon: "▶️" },
  { id: "amazon", name: "Amazon Music", icon: "📦" },
  { id: "tidal", name: "Tidal", icon: "🌊" },
  { id: "deezer", name: "Deezer", icon: "🎧" },
];

export function ReleaseManager() {
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [releaseDate, setReleaseDate] = useState<Date>();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(platforms.map(p => p.id));
  const [releaseTitle, setReleaseTitle] = useState("");
  const [releaseDescription, setReleaseDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadTracks();
  }, []);

  const loadTracks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("tracks")
      .select(`
        *,
        albums (
          title,
          cover_art_path
        )
      `)
      .eq("user_id", user.id)
      .eq("is_published", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading tracks:", error);
    } else {
      setTracks(data || []);
    }
  };

  const handlePublish = async () => {
    if (!selectedTrack || !releaseDate || selectedPlatforms.length === 0) {
      toast.error("Please complete all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Update track to published
      const { error: updateError } = await supabase
        .from("tracks")
        .update({
          is_published: true,
          // Store release info in metadata
        })
        .eq("id", selectedTrack.id);

      if (updateError) throw updateError;

      // Create album if needed
      const { data: { user } } = await supabase.auth.getUser();
      if (user && releaseTitle) {
        const { error: albumError } = await supabase
          .from("albums")
          .insert({
            user_id: user.id,
            title: releaseTitle,
            artist_name: selectedTrack.artist_name,
            description: releaseDescription,
            genre: genre,
            release_date: format(releaseDate, "yyyy-MM-dd"),
            is_published: true,
          });

        if (albumError) console.error("Album creation error:", albumError);
      }

      toast.success("Release scheduled successfully!", {
        description: `${selectedTrack.title} will go live on ${format(releaseDate, "PPP")}`,
      });

      // Reset form
      setSelectedTrack(null);
      setReleaseDate(undefined);
      setReleaseTitle("");
      setReleaseDescription("");
      setGenre("");
      loadTracks();
    } catch (error: any) {
      console.error("Error publishing track:", error);
      toast.error("Failed to schedule release", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-2xl font-display font-bold">Release Manager</h2>
            <p className="text-sm text-muted-foreground">
              Distribute your music to 150+ platforms worldwide
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Track Selection */}
          <div className="space-y-4">
            <div>
              <Label>Select Track to Release</Label>
              <div className="mt-2 space-y-2">
                {tracks.length === 0 ? (
                  <Card className="p-6 text-center border-dashed">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No unreleased tracks. Upload a track first!
                    </p>
                  </Card>
                ) : (
                  tracks.map((track) => (
                    <Card
                      key={track.id}
                      className={`p-4 cursor-pointer transition-all ${
                        selectedTrack?.id === track.id
                          ? "border-primary bg-primary/10"
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedTrack(track)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          🎵
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{track.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {track.artist_name}
                          </p>
                        </div>
                        {selectedTrack?.id === track.id && (
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {selectedTrack && (
              <div>
                <Label>Release Information</Label>
                <div className="mt-2 space-y-3">
                  <Input
                    placeholder="Release Title (Optional)"
                    value={releaseTitle}
                    onChange={(e) => setReleaseTitle(e.target.value)}
                  />
                  <Select value={genre} onValueChange={setGenre}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Genre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pop">Pop</SelectItem>
                      <SelectItem value="hiphop">Hip-Hop</SelectItem>
                      <SelectItem value="rock">Rock</SelectItem>
                      <SelectItem value="electronic">Electronic</SelectItem>
                      <SelectItem value="rnb">R&B</SelectItem>
                      <SelectItem value="country">Country</SelectItem>
                      <SelectItem value="jazz">Jazz</SelectItem>
                      <SelectItem value="classical">Classical</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Release Description"
                    value={releaseDescription}
                    onChange={(e) => setReleaseDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Distribution Settings */}
          <div className="space-y-4">
            <div>
              <Label>Release Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal mt-2"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {releaseDate ? format(releaseDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={releaseDate}
                    onSelect={setReleaseDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground mt-1">
                Releases typically go live within 24-48 hours
              </p>
            </div>

            <div>
              <Label>Distribution Platforms</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {platforms.map((platform) => (
                  <Card
                    key={platform.id}
                    className={`p-3 cursor-pointer transition-all ${
                      selectedPlatforms.includes(platform.id)
                        ? "border-primary bg-primary/10"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => togglePlatform(platform.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedPlatforms.includes(platform.id)}
                        onCheckedChange={() => togglePlatform(platform.id)}
                      />
                      <span className="text-lg">{platform.icon}</span>
                      <span className="text-sm font-medium">{platform.name}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <Card className="p-4 bg-accent/10 border-accent/20">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Distribution Terms</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• You keep 100% of your royalties</li>
                    <li>• No hidden fees or recurring charges</li>
                    <li>• Instant access to analytics</li>
                    <li>• Withdraw earnings anytime</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Button
              onClick={handlePublish}
              disabled={!selectedTrack || !releaseDate || isSubmitting || selectedPlatforms.length === 0}
              className="w-full bg-gradient-to-r from-primary via-secondary to-accent h-12"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scheduling Release...
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4 mr-2" />
                  Schedule Global Release
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
