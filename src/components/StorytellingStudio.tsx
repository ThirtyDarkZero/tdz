import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  BookOpen, Sparkles, Calendar, Image, Video, 
  FileText, TrendingUp, Target, Lightbulb, Plus,
  Check, Upload, Palette, Type, Save, Trash2, X, Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

interface ContentItem {
  id: string;
  content_type: string;
  title: string;
  file_path?: string | null;
  thumbnail_path?: string | null;
  description?: string | null;
  tags?: any;
  created_at: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  content_type: string;
  scheduled_date: string;
  scheduled_time?: string;
  platform?: string;
  status: string;
  description?: string;
}

export const StorytellingStudio = () => {
  const [narrative, setNarrative] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedArc, setSelectedArc] = useState<string | null>(null);
  const [originStory, setOriginStory] = useState("");
  const [definingMoment, setDefiningMoment] = useState("");
  const [currentChapter, setCurrentChapter] = useState("");
  const [futureVision, setFutureVision] = useState("");
  const [visualStyle, setVisualStyle] = useState("");
  const [artistMission, setArtistMission] = useState("");
  const [emotionalCore, setEmotionalCore] = useState("");
  const [uniqueValueProp, setUniqueValueProp] = useState("");
  const [brandVoice, setBrandVoice] = useState("");
  const [keyPhrases, setKeyPhrases] = useState<string[]>([]);
  const [targetAudience, setTargetAudience] = useState("");
  const [newPhrase, setNewPhrase] = useState("");
  const [contentLibrary, setContentLibrary] = useState<ContentItem[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventType, setNewEventType] = useState("post");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventPlatform, setNewEventPlatform] = useState("instagram");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAddContent, setShowAddContent] = useState(false);
  const [newContentType, setNewContentType] = useState("photo");
  const [newContentTitle, setNewContentTitle] = useState("");
  const [newContentDescription, setNewContentDescription] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>(["primary", "secondary"]);
  const [editColorOpen, setEditColorOpen] = useState(false);
  const [customColor, setCustomColor] = useState("#8B5CF6");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const templates = [
    {
      id: "underdog",
      title: "The Underdog Journey",
      description: "From bedroom producer to breakthrough artist",
      strength: "Relatability, inspiration",
      example: "Started making beats on a laptop, now..."
    },
    {
      id: "collaborator",
      title: "The Collaborator",
      description: "Building through connections and features",
      strength: "Network effect, credibility",
      example: "Working with artists you love opens doors..."
    },
    {
      id: "innovator",
      title: "The Innovator",
      description: "Pushing boundaries in your genre",
      strength: "Differentiation, thought leadership",
      example: "Blending [genre] with [genre] in ways no one has..."
    },
    {
      id: "storyteller",
      title: "The Storyteller",
      description: "Every song tells part of your life",
      strength: "Emotional connection, authenticity",
      example: "Each track is a chapter in my story..."
    }
  ];

  const colorPresets = [
    { name: "primary", color: "hsl(var(--primary))" },
    { name: "purple-pink", color: "linear-gradient(to br, #8B5CF6, #EC4899)" },
    { name: "blue-cyan", color: "linear-gradient(to br, #3B82F6, #06B6D4)" },
    { name: "green-emerald", color: "linear-gradient(to br, #22C55E, #10B981)" },
    { name: "orange-red", color: "linear-gradient(to br, #F97316, #EF4444)" },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load narrative
      const { data: narrativeData } = await supabase
        .from("artist_narrative")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (narrativeData) {
        setNarrative(narrativeData);
        setSelectedArc(narrativeData.narrative_arc);
        setOriginStory(narrativeData.origin_story || "");
        setDefiningMoment(narrativeData.defining_moment || "");
        setCurrentChapter(narrativeData.current_chapter || "");
        setFutureVision(narrativeData.future_vision || "");
        setVisualStyle(narrativeData.visual_style || "");
        setArtistMission(narrativeData.artist_mission || "");
        setEmotionalCore(narrativeData.emotional_core || "");
        setUniqueValueProp(narrativeData.unique_value_prop || "");
        setBrandVoice(narrativeData.brand_voice || "");
        setTargetAudience(narrativeData.target_audience || "");
        setKeyPhrases((narrativeData.key_phrases as string[]) || []);
        if (narrativeData.color_palette) {
          setSelectedColors(narrativeData.color_palette as string[]);
        }
      }

      // Load content library
      const { data: contentData } = await supabase
        .from("content_library")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setContentLibrary(contentData || []);

      // Load calendar events
      const { data: calendarData } = await supabase
        .from("content_calendar")
        .select("*")
        .eq("user_id", user.id)
        .gte("scheduled_date", format(startOfMonth(new Date()), "yyyy-MM-dd"))
        .order("scheduled_date", { ascending: true });

      setCalendarEvents(calendarData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateNarrativeStrength = () => {
    let strength = 0;
    if (selectedArc) strength += 25;
    if (originStory.length > 50) strength += 25;
    if (definingMoment.length > 50) strength += 15;
    if (currentChapter.length > 50) strength += 15;
    if (futureVision.length > 50) strength += 10;
    if (visualStyle) strength += 10;
    return Math.min(100, strength);
  };

  const saveNarrative = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const narrativeData = {
        user_id: user.id,
        narrative_arc: selectedArc,
        origin_story: originStory,
        defining_moment: definingMoment,
        current_chapter: currentChapter,
        future_vision: futureVision,
        visual_style: visualStyle,
        color_palette: selectedColors,
        narrative_strength: calculateNarrativeStrength()
      };

      if (narrative?.id) {
        const { error } = await supabase
          .from("artist_narrative")
          .update(narrativeData)
          .eq("id", narrative.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("artist_narrative")
          .insert(narrativeData);
        if (error) throw error;
      }

      toast.success("Narrative saved successfully!");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (file: File, contentType: string) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const bucket = contentType === 'video' ? 'post-media' : 'artist-gallery';

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      // Save to content library
      const { error: insertError } = await supabase
        .from("content_library")
        .insert({
          user_id: user.id,
          content_type: contentType,
          title: newContentTitle || file.name,
          description: newContentDescription || null,
          file_path: urlData.publicUrl,
          tags: []
        });

      if (insertError) throw insertError;

      toast.success("Content uploaded successfully!");
      setShowAddContent(false);
      setNewContentTitle("");
      setNewContentDescription("");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteContent = async (id: string) => {
    try {
      const { error } = await supabase
        .from("content_library")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Content deleted");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const addCalendarEvent = async () => {
    if (!newEventTitle || !newEventDate) {
      toast.error("Please fill in event title and date");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("content_calendar")
        .insert({
          user_id: user.id,
          title: newEventTitle,
          content_type: newEventType,
          scheduled_date: newEventDate,
          platform: newEventPlatform,
          description: newEventDescription || null,
          status: "scheduled"
        });

      if (error) throw error;
      
      toast.success("Event added to calendar!");
      setNewEventTitle("");
      setNewEventDate("");
      setNewEventDescription("");
      setShowAddEvent(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const updateEventStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("content_calendar")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      toast.success(`Event marked as ${status}`);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const deleteCalendarEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from("content_calendar")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Event deleted");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const autoScheduleContent = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const events = [];
      const today = new Date();

      for (let i = 0; i < 30; i++) {
        const date = addDays(today, i);
        const dateStr = format(date, "yyyy-MM-dd");

        // Daily stories
        events.push({
          user_id: user.id,
          title: `Story Update - Day ${i + 1}`,
          content_type: "story",
          scheduled_date: dateStr,
          platform: "instagram",
          status: "scheduled"
        });

        // Posts every 3 days
        if (i % 3 === 0) {
          events.push({
            user_id: user.id,
            title: `Feed Post ${Math.floor(i / 3) + 1}`,
            content_type: "post",
            scheduled_date: dateStr,
            platform: "instagram",
            status: "scheduled"
          });
        }

        // BTS weekly
        if (i % 7 === 0) {
          events.push({
            user_id: user.id,
            title: `Behind the Scenes ${Math.floor(i / 7) + 1}`,
            content_type: "bts",
            scheduled_date: dateStr,
            platform: "youtube",
            status: "scheduled"
          });
        }
      }

      const { error } = await supabase
        .from("content_calendar")
        .insert(events);

      if (error) throw error;
      
      toast.success(`${events.length} events auto-scheduled for the next 30 days!`);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const addColorTopalette = () => {
    if (!selectedColors.includes(customColor)) {
      setSelectedColors([...selectedColors, customColor]);
    }
    setEditColorOpen(false);
  };

  const removeColor = (color: string) => {
    setSelectedColors(selectedColors.filter(c => c !== color));
  };

  const narrativeStrength = calculateNarrativeStrength();

  if (loading) {
    return (
      <Card className="glass-card p-12 text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading storytelling studio...</p>
      </Card>
    );
  }

  // Generate calendar days
  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-2xl font-display font-bold">Storytelling Studio</h2>
          <p className="text-sm text-muted-foreground">
            Build culture, context, and community — not just monthly listeners
          </p>
        </div>
      </div>

      {/* Narrative Strength Score */}
      <Card className="glass-card border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Your Narrative Strength
            </span>
            <Badge className="bg-primary/20 text-primary text-lg px-3 py-1">
              {narrativeStrength}/100
            </Badge>
          </CardTitle>
          <CardDescription>
            Your fans aren't just listeners — they're participants in your story. Give them something to believe in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Origin Story</span>
              <span className={originStory.length > 50 ? "text-green-500" : "text-muted-foreground"}>
                {originStory.length > 50 ? "Complete" : "Incomplete"}
              </span>
            </div>
            <Progress value={originStory.length > 50 ? 100 : (originStory.length / 50) * 100} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Visual Identity</span>
              <span className={visualStyle ? "text-green-500" : "text-muted-foreground"}>
                {visualStyle ? "Defined" : "Not Set"}
              </span>
            </div>
            <Progress value={visualStyle ? 100 : 0} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Narrative Arc</span>
              <span className={selectedArc ? "text-green-500" : "text-muted-foreground"}>
                {selectedArc ? templates.find(t => t.id === selectedArc)?.title : "Not Selected"}
              </span>
            </div>
            <Progress value={selectedArc ? 100 : 0} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Content Calendar</span>
              <span className={calendarEvents.length > 5 ? "text-green-500" : "text-yellow-500"}>
                {calendarEvents.length} events scheduled
              </span>
            </div>
            <Progress value={Math.min(100, calendarEvents.length * 10)} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="narrative" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="narrative">Narrative</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="visuals">Visuals</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        {/* Narrative Templates */}
        <TabsContent value="narrative" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Choose Your Narrative Arc
              </CardTitle>
              <CardDescription>
                Select a framework that aligns with your authentic story
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {templates.map((template) => (
                <Card 
                  key={template.id} 
                  className={`p-4 transition-all cursor-pointer ${
                    selectedArc === template.id 
                      ? 'border-primary bg-primary/10' 
                      : 'hover:border-primary/60'
                  }`}
                  onClick={() => setSelectedArc(template.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1 flex items-center gap-2">
                        {template.title}
                        {selectedArc === template.id && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {template.description}
                      </p>
                      <div className="flex gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {template.strength}
                        </Badge>
                      </div>
                      <p className="text-xs italic text-muted-foreground">
                        "{template.example}"
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" />
                Your Story Elements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Origin Story (Where you started)</Label>
                <Textarea 
                  placeholder="Where did your journey begin? What sparked your passion for music?"
                  rows={3}
                  className="mt-2"
                  value={originStory}
                  onChange={(e) => setOriginStory(e.target.value)}
                />
              </div>
              <div>
                <Label>Defining Moment (The breakthrough)</Label>
                <Textarea 
                  placeholder="What moment changed everything? A specific challenge you overcame?"
                  rows={3}
                  className="mt-2"
                  value={definingMoment}
                  onChange={(e) => setDefiningMoment(e.target.value)}
                />
              </div>
              <div>
                <Label>Current Chapter (Where you are now)</Label>
                <Textarea 
                  placeholder="What are you working on? What's driving you forward?"
                  rows={3}
                  className="mt-2"
                  value={currentChapter}
                  onChange={(e) => setCurrentChapter(e.target.value)}
                />
              </div>
              <div>
                <Label>Future Vision (Where you're going)</Label>
                <Textarea 
                  placeholder="What's the ultimate goal? What impact do you want to make?"
                  rows={3}
                  className="mt-2"
                  value={futureVision}
                  onChange={(e) => setFutureVision(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={saveNarrative} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Story Arc"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Library */}
        <TabsContent value="content" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Content Library
                </span>
                <Button size="sm" onClick={() => setShowAddContent(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Content
                </Button>
              </CardTitle>
              <CardDescription>
                Behind-the-scenes, process, journey moments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Content Form */}
              {showAddContent && (
                <Card className="p-4 border-primary/30 bg-primary/5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Upload New Content</h4>
                    <Button size="sm" variant="ghost" onClick={() => setShowAddContent(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid gap-3">
                    <div>
                      <Label>Content Type</Label>
                      <select 
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm mt-1"
                        value={newContentType}
                        onChange={(e) => setNewContentType(e.target.value)}
                      >
                        <option value="photo">Photo / Image</option>
                        <option value="video">Video</option>
                        <option value="story">Story Post</option>
                        <option value="bts">Behind the Scenes</option>
                      </select>
                    </div>
                    <div>
                      <Label>Title</Label>
                      <Input 
                        placeholder="Content title..."
                        value={newContentTitle}
                        onChange={(e) => setNewContentTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Description (optional)</Label>
                      <Textarea 
                        placeholder="Brief description..."
                        rows={2}
                        value={newContentDescription}
                        onChange={(e) => setNewContentDescription(e.target.value)}
                      />
                    </div>
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept={newContentType === 'video' ? 'video/*' : 'image/*'}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, newContentType);
                        }}
                      />
                      <Button 
                        className="w-full" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? "Uploading..." : "Select File & Upload"}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              <div className="grid md:grid-cols-3 gap-3">
                <Card className="p-4 hover:border-primary/60 transition-all">
                  <Video className="w-8 h-8 text-primary mb-2" />
                  <p className="font-semibold text-sm mb-1">Studio Sessions</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    {contentLibrary.filter(c => c.content_type === 'video').length} videos
                  </p>
                </Card>

                <Card className="p-4 hover:border-primary/60 transition-all">
                  <Image className="w-8 h-8 text-primary mb-2" />
                  <p className="font-semibold text-sm mb-1">Behind the Scenes</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    {contentLibrary.filter(c => c.content_type === 'photo' || c.content_type === 'bts').length} photos
                  </p>
                </Card>

                <Card className="p-4 hover:border-primary/60 transition-all">
                  <FileText className="w-8 h-8 text-primary mb-2" />
                  <p className="font-semibold text-sm mb-1">Stories</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    {contentLibrary.filter(c => c.content_type === 'story').length} posts
                  </p>
                </Card>
              </div>

              {/* Content Grid */}
              {contentLibrary.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  {contentLibrary.map((item) => (
                    <Card key={item.id} className="group relative overflow-hidden">
                      {item.file_path && (
                        item.content_type === 'video' ? (
                          <video 
                            src={item.file_path} 
                            className="w-full aspect-square object-cover"
                          />
                        ) : (
                          <img 
                            src={item.file_path} 
                            alt={item.title}
                            className="w-full aspect-square object-cover"
                          />
                        )
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="sm" variant="secondary">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => deleteContent(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium truncate">{item.title}</p>
                        <Badge variant="secondary" className="text-[10px] mt-1">
                          {item.content_type}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              <Card className="p-4 bg-primary/10 border-primary/30">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Content Strategy Tips
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Show your process, not just the finished product</li>
                  <li>• Share failures and challenges - makes success meaningful</li>
                  <li>• Create recurring series (Monday studio updates, Friday advice)</li>
                  <li>• Let people see YOU, not just the artist persona</li>
                </ul>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Visual Identity */}
        <TabsContent value="visuals" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                Visual Identity System
              </CardTitle>
              <CardDescription>
                Consistent look and feel across all platforms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <Label className="mb-2 block">Color Palette</Label>
                  <div className="flex gap-2 flex-wrap mb-3">
                    {selectedColors.map((color, i) => (
                      <div 
                        key={i}
                        className="w-12 h-12 rounded-lg cursor-pointer hover:scale-105 transition-transform relative group"
                        style={{ 
                          background: color.startsWith('#') ? color : `hsl(var(--${color}))` 
                        }}
                      >
                        <button
                          className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          onClick={() => removeColor(color)}
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                    <Dialog open={editColorOpen} onOpenChange={setEditColorOpen}>
                      <DialogTrigger asChild>
                        <div className="w-12 h-12 rounded-lg border-2 border-dashed border-muted flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                          <Plus className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Color</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Color Presets</Label>
                            <div className="flex gap-2 mt-2">
                              {colorPresets.map((preset) => (
                                <div
                                  key={preset.name}
                                  className="w-10 h-10 rounded-lg cursor-pointer hover:scale-105 transition-transform"
                                  style={{ background: preset.color }}
                                  onClick={() => {
                                    setSelectedColors([...selectedColors, preset.name]);
                                    setEditColorOpen(false);
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label>Custom Color</Label>
                            <div className="flex gap-2 mt-2">
                              <Input
                                type="color"
                                value={customColor}
                                onChange={(e) => setCustomColor(e.target.value)}
                                className="w-16 h-10 p-1"
                              />
                              <Input
                                value={customColor}
                                onChange={(e) => setCustomColor(e.target.value)}
                                placeholder="#8B5CF6"
                              />
                              <Button onClick={addColorTopalette}>Add</Button>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </Card>

                <Card className="p-4">
                  <Label className="mb-2 block">Typography</Label>
                  <div className="space-y-2 mb-3">
                    <div className="p-2 rounded bg-muted">
                      <p className="font-bold">Heading Font - Display</p>
                    </div>
                    <div className="p-2 rounded bg-muted">
                      <p className="text-sm">Body Font - Sans Serif</p>
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="p-4">
                <Label className="mb-2 block">Visual Style</Label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {["Moody", "Vibrant", "Minimal"].map((style) => (
                    <div 
                      key={style}
                      className={`aspect-square rounded-lg flex items-center justify-center text-xs cursor-pointer transition-all ${
                        visualStyle === style.toLowerCase()
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-gradient-to-br from-primary/20 to-secondary/20 hover:from-primary/30 hover:to-secondary/30'
                      }`}
                      onClick={() => setVisualStyle(style.toLowerCase())}
                    >
                      {style}
                    </div>
                  ))}
                </div>
                <Button size="sm" className="w-full" onClick={saveNarrative} disabled={saving}>
                  <Save className="w-3 h-3 mr-1" />
                  Save Visual Identity
                </Button>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Calendar */}
        <TabsContent value="calendar" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Content Calendar
                </span>
                <Button size="sm" onClick={() => setShowAddEvent(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Event
                </Button>
              </CardTitle>
              <CardDescription>
                Plan your narrative across time - consistency builds momentum
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Event Form */}
              {showAddEvent && (
                <Card className="p-4 border-primary/30 bg-primary/5">
                  <div className="grid gap-3">
                    <div>
                      <Label>Event Title</Label>
                      <Input 
                        placeholder="e.g., New Single Announcement" 
                        value={newEventTitle}
                        onChange={(e) => setNewEventTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Description (optional)</Label>
                      <Textarea 
                        placeholder="Event details..."
                        rows={2}
                        value={newEventDescription}
                        onChange={(e) => setNewEventDescription(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label>Type</Label>
                        <select 
                          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                          value={newEventType}
                          onChange={(e) => setNewEventType(e.target.value)}
                        >
                          <option value="post">Post</option>
                          <option value="story">Story</option>
                          <option value="bts">BTS</option>
                          <option value="release">Release</option>
                          <option value="live">Live</option>
                          <option value="presave">Pre-Save Campaign</option>
                          <option value="exclusive">Exclusive Content</option>
                        </select>
                      </div>
                      <div>
                        <Label>Date</Label>
                        <Input 
                          type="date" 
                          value={newEventDate}
                          onChange={(e) => setNewEventDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Platform</Label>
                        <select 
                          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                          value={newEventPlatform}
                          onChange={(e) => setNewEventPlatform(e.target.value)}
                        >
                          <option value="instagram">Instagram</option>
                          <option value="tiktok">TikTok</option>
                          <option value="youtube">YouTube</option>
                          <option value="twitter">Twitter/X</option>
                          <option value="tdz">TDZ</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={addCalendarEvent} className="flex-1">
                        <Plus className="w-4 h-4 mr-1" />
                        Add to Calendar
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddEvent(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2 text-center text-sm">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="font-semibold text-muted-foreground">
                    {day}
                  </div>
                ))}
                {calendarDays.map((day, i) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const dayEvents = calendarEvents.filter(e => e.scheduled_date === dateStr);
                  
                  return (
                    <Card 
                      key={i} 
                      className={`min-h-[80px] p-2 cursor-pointer hover:border-primary/60 transition-all ${
                        dayEvents.length > 0 ? 'border-primary/30 bg-primary/5' : ''
                      }`}
                    >
                      <div className="text-xs font-medium">{format(day, "d")}</div>
                      {dayEvents.slice(0, 2).map((event) => (
                        <Badge 
                          key={event.id} 
                          className="text-[9px] px-1 py-0 mt-1 w-full truncate cursor-pointer"
                          variant={event.content_type === 'release' ? 'default' : 'secondary'}
                          onClick={() => deleteCalendarEvent(event.id)}
                        >
                          {event.title.substring(0, 8)}
                        </Badge>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[9px] text-muted-foreground">
                          +{dayEvents.length - 2} more
                        </span>
                      )}
                    </Card>
                  );
                })}
              </div>

              {/* Upcoming Events List */}
              {calendarEvents.length > 0 && (
                <Card className="p-4">
                  <h4 className="font-semibold mb-3">Upcoming Events</h4>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {calendarEvents.slice(0, 10).map((event) => (
                      <div 
                        key={event.id} 
                        className="flex items-center justify-between p-2 rounded bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {event.content_type}
                          </Badge>
                          <span className="text-sm">{event.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(event.scheduled_date), "MMM d")}
                          </span>
                          {event.status === 'scheduled' && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => updateEventStatus(event.id, 'completed')}
                            >
                              <Check className="w-3 h-3 text-green-500" />
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => deleteCalendarEvent(event.id)}
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Card className="p-4 bg-primary/10 border-primary/30">
                <h4 className="font-semibold mb-2">Recommended Cadence</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Instagram Stories</span>
                    <Badge variant="secondary">Daily</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Main Feed Post</span>
                    <Badge variant="secondary">3x/week</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>YouTube/TikTok</span>
                    <Badge variant="secondary">2x/week</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Email Newsletter</span>
                    <Badge variant="secondary">Weekly</Badge>
                  </div>
                </div>
              </Card>

              <Button className="w-full" onClick={autoScheduleContent}>
                <Sparkles className="w-4 h-4 mr-2" />
                Auto-Schedule 30 Days of Content
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
