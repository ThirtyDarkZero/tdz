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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { CalendarIcon, Upload, Globe, CheckCircle2, AlertCircle, Loader2, Disc3, Zap, Music, Album } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const ReleaseManager = () => {
  const [releaseType, setReleaseType] = useState<"track" | "project">("track");
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [releaseDate, setReleaseDate] = useState<Date>();
  const [releaseTitle, setReleaseTitle] = useState("");
  const [releaseDescription, setReleaseDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  useEffect(() => {
    loadTracks();
    loadAlbums();
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
      .is("album_id", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading tracks:", error);
    } else {
      setTracks(data || []);
    }
  };

  const loadAlbums = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("albums")
      .select(`
        *,
        tracks (
          id,
          title,
          artist_name,
          is_published
        )
      `)
      .eq("user_id", user.id)
      .eq("is_published", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading albums:", error);
    } else {
      setAlbums(data || []);
    }
  };

  const handlePublishTrack = async () => {
    if (!selectedTrack || !releaseDate) {
      toast.error("Please select a track and release date");
      return;
    }

    setIsSubmitting(true);

    try {
      const releaseDateStr = format(releaseDate, "yyyy-MM-dd");
      const today = format(new Date(), "yyyy-MM-dd");
      const shouldPublishNow = releaseDateStr <= today;

      const { error: updateError } = await supabase
        .from("tracks")
        .update({
          is_published: shouldPublishNow,
          release_date: releaseDateStr,
        })
        .eq("id", selectedTrack.id);

      if (updateError) throw updateError;

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
            release_date: releaseDateStr,
            scheduled_release_date: releaseDateStr,
            is_published: shouldPublishNow,
          });

        if (albumError) console.error("Album creation error:", albumError);
      }

      toast.success(shouldPublishNow ? "Released on TDZ!" : "Release scheduled!", {
        description: shouldPublishNow 
          ? `${selectedTrack.title} is now live on TDZ Streaming`
          : `${selectedTrack.title} will go live on ${format(releaseDate, "PPP")}`,
      });

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

  const handlePublishAlbum = async () => {
    if (!selectedAlbum || !releaseDate) {
      toast.error("Please select an album/EP and release date");
      return;
    }

    setIsSubmitting(true);

    try {
      const releaseDateStr = format(releaseDate, "yyyy-MM-dd");
      const today = format(new Date(), "yyyy-MM-dd");
      const shouldPublishNow = releaseDateStr <= today;

      // Update album
      const { error: albumError } = await supabase
        .from("albums")
        .update({
          is_published: shouldPublishNow,
          release_date: releaseDateStr,
          scheduled_release_date: releaseDateStr,
        })
        .eq("id", selectedAlbum.id);

      if (albumError) throw albumError;

      // Update all tracks in the album
      const { error: tracksError } = await supabase
        .from("tracks")
        .update({
          is_published: shouldPublishNow,
          release_date: releaseDateStr,
        })
        .eq("album_id", selectedAlbum.id);

      if (tracksError) throw tracksError;

      const trackCount = selectedAlbum.tracks?.length || 0;
      toast.success(shouldPublishNow ? "Project Released on TDZ!" : "Project Release Scheduled!", {
        description: shouldPublishNow 
          ? `${selectedAlbum.title} (${trackCount} tracks) is now live on TDZ Streaming`
          : `${selectedAlbum.title} will go live on ${format(releaseDate, "PPP")}`,
      });

      setSelectedAlbum(null);
      setReleaseDate(undefined);
      loadAlbums();
      loadTracks();
    } catch (error: any) {
      console.error("Error publishing album:", error);
      toast.error("Failed to schedule release", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const timezones = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Australia/Sydney",
  ];

  return (
    <div className="space-y-6">
      <Card className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Disc3 className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-2xl font-display font-bold">Release Manager</h2>
            <p className="text-sm text-muted-foreground">
              Publish your music directly to TDZ Streaming
            </p>
          </div>
        </div>

        {/* TDZ Platform Badge */}
        <Card className="p-4 mb-6 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-primary/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold">TDZ Streaming Platform</h3>
              <p className="text-sm text-muted-foreground">
                Your music goes live instantly to all TDZ listeners worldwide
              </p>
            </div>
            <Badge className="bg-primary/20 text-primary border-primary/30">
              100% Royalties
            </Badge>
          </div>
        </Card>

        {/* Release Type Tabs */}
        <Tabs value={releaseType} onValueChange={(v) => setReleaseType(v as "track" | "project")} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="track" className="gap-2">
              <Music className="w-4 h-4" />
              Single Track
            </TabsTrigger>
            <TabsTrigger value="project" className="gap-2">
              <Album className="w-4 h-4" />
              Album / EP
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Selection */}
          <div className="space-y-4">
            {releaseType === "track" ? (
              <div>
                <Label>Select Track to Release</Label>
                <div className="mt-2 space-y-2 max-h-[300px] overflow-y-auto">
                  {tracks.length === 0 ? (
                    <Card className="p-6 text-center border-dashed">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        No unreleased singles. Upload a track first!
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
                            <Music className="w-5 h-5 text-primary" />
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

                {selectedTrack && (
                  <div className="mt-4">
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
                          <SelectItem value="ai-generated">AI-Generated</SelectItem>
                          <SelectItem value="ai-assisted">AI-Assisted</SelectItem>
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
            ) : (
              <div>
                <Label>Select Album / EP to Release</Label>
                <div className="mt-2 space-y-2 max-h-[400px] overflow-y-auto">
                  {albums.length === 0 ? (
                    <Card className="p-6 text-center border-dashed">
                      <Album className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        No unreleased albums or EPs. Create a project first!
                      </p>
                    </Card>
                  ) : (
                    albums.map((album) => (
                      <Card
                        key={album.id}
                        className={`p-4 cursor-pointer transition-all ${
                          selectedAlbum?.id === album.id
                            ? "border-primary bg-primary/10"
                            : "hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedAlbum(album)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center overflow-hidden">
                            {album.cover_art_path ? (
                              <img 
                                src={supabase.storage.from("album-covers").getPublicUrl(album.cover_art_path).data.publicUrl}
                                alt={album.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Album className="w-6 h-6 text-primary" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{album.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {album.artist_name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {album.tracks?.length || 0} tracks
                              </Badge>
                              {album.genre && (
                                <Badge variant="outline" className="text-xs">
                                  {album.genre}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {selectedAlbum?.id === album.id && (
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        
                        {selectedAlbum?.id === album.id && album.tracks && album.tracks.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <p className="text-xs text-muted-foreground mb-2">Tracks in this project:</p>
                            <div className="space-y-1">
                              {album.tracks.map((track: any, idx: number) => (
                                <div key={track.id} className="flex items-center gap-2 text-sm">
                                  <span className="text-muted-foreground w-5">{idx + 1}.</span>
                                  <span>{track.title}</span>
                                  {track.is_published && (
                                    <Badge variant="outline" className="text-xs">Published</Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Release Settings */}
          <div className="space-y-4">
            <div>
              <Label>Release Date & Time</Label>
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
            </div>

            <div>
              <Label>Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Release will go live at midnight in selected timezone
              </p>
            </div>

            <Card className="p-4 bg-accent/10 border-accent/20">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">TDZ Distribution</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• You keep 100% of your royalties</li>
                    <li>• Instant publishing to TDZ platform</li>
                    <li>• Real-time streaming analytics</li>
                    <li>• Direct fan engagement</li>
                    <li>• AI & human artists welcome</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Button
              onClick={releaseType === "track" ? handlePublishTrack : handlePublishAlbum}
              disabled={
                (releaseType === "track" ? !selectedTrack : !selectedAlbum) || 
                !releaseDate || 
                isSubmitting
              }
              className="w-full bg-gradient-to-r from-primary via-secondary to-accent h-12"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4 mr-2" />
                  Publish {releaseType === "track" ? "Track" : "Project"} to TDZ
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};