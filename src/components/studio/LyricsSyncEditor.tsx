import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Play, Pause, RotateCcw, Save, Plus, Minus, Mic, Trash2, Loader2, Check } from "lucide-react";

interface LyricLine {
  time: number;
  text: string;
}

interface TrackOption {
  id: string;
  title: string;
  file_path: string;
  duration: number;
}

export const LyricsSyncEditor = () => {
  const [tracks, setTracks] = useState<TrackOption[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string>("");
  const [lines, setLines] = useState<LyricLine[]>([]);
  const [rawLyrics, setRawLyrics] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [syncIndex, setSyncIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"edit" | "sync">("edit");
  const [job, setJob] = useState<{ status: string; error: string | null } | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load user's tracks
  useEffect(() => {
    const loadTracks = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("tracks")
        .select("id, title, file_path, duration")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setTracks(data);
    };
    loadTracks();
  }, []);

  // Load existing sync data when track is selected
  useEffect(() => {
    if (!selectedTrackId) return;
    setLines([]);
    setRawLyrics("");
    setMode("edit");
    setSource(null);
    const loadExisting = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table not in generated types yet
      const { data: j } = await (supabase as any).from("lyrics_jobs").select("status, error").eq("track_id", selectedTrackId).maybeSingle();
      setJob(j ?? null);
      const { data } = await supabase
        .from("track_lyrics_sync")
        .select("lyrics_data")
        .eq("track_id", selectedTrackId)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.lyrics_data) {
        const parsed = data.lyrics_data as any;
        if (parsed?.lines?.length) {
          setSource(parsed.source ?? null);
          setLines(parsed.lines);
          setSyncIndex(parsed.lines.length);
          setRawLyrics(parsed.lines.map((l: LyricLine) => l.text).join("\n"));
          setMode("sync");
        }
      }
    };
    loadExisting();

    // Set audio source
    if (audioRef.current) {
      const track = tracks.find(t => t.id === selectedTrackId);
      if (track) {
        const url = supabase.storage.from("track-files").getPublicUrl(track.file_path).data.publicUrl;
        audioRef.current.src = url;
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
        setIsPlaying(false);
      }
    }
  }, [selectedTrackId, tracks]);

  const handleParseLyrics = () => {
    const parsed = rawLyrics
      .split("\n")
      .map(text => text.trim())
      .filter(text => text.length > 0)
      .map((text, i) => ({ time: lines[i]?.time ?? -1, text }));
    setLines(parsed);
    const firstUntimed = parsed.findIndex(l => l.time < 0);
    setSyncIndex(firstUntimed < 0 ? parsed.length : firstUntimed);
    setMode("sync");
    toast.success(`${parsed.length} lines ready to sync`);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleTapSync = useCallback(() => {
    if (syncIndex >= lines.length) return;
    setLines(prev => {
      const updated = [...prev];
      updated[syncIndex] = { ...updated[syncIndex], time: currentTime };
      return updated;
    });
    setSyncIndex(prev => prev + 1);

    // Auto-scroll
    const el = scrollRef.current?.querySelector(`[data-sync-line="${syncIndex + 1}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [syncIndex, currentTime, lines.length]);

  const adjustTime = (index: number, delta: number) => {
    setLines(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], time: Math.max(0, updated[index].time + delta) };
      return updated;
    });
  };

  const removeLine = (index: number) => {
    setLines(prev => prev.filter((_, i) => i !== index));
    if (syncIndex > index) setSyncIndex(prev => prev - 1);
  };

  const resetSync = () => {
    setLines(prev => prev.map(l => ({ ...l, time: -1 })));
    setSyncIndex(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const redoAutomatically = async () => {
    if (!selectedTrackId) return;
    if (source === "artist" && !window.confirm("Replace your edited lyrics with a fresh automatic transcription?")) return;
    setRetrying(true);
    const { data, error } = await supabase.functions.invoke("auto-lyrics", {
      body: { track_id: selectedTrackId, retry: true, force: source === "artist" },
    });
    setRetrying(false);
    if (error) { toast.error("Couldn't start transcription. Try again in a minute."); return; }
    const status = (data as { status?: string })?.status;
    if (status === "done") {
      toast.success("Lyrics transcribed. Check the words and timing.");
      const id = selectedTrackId;
      setSelectedTrackId("");
      setTimeout(() => setSelectedTrackId(id), 0);
    } else if (status === "instrumental") toast.message("No vocals found in this track.");
    else toast.error("Transcription didn't finish. We'll keep retrying in the background.");
  };

  const handleSave = async (publish: boolean) => {
    if (!selectedTrackId || lines.length === 0) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const lyricsData = {
        lines: lines.filter(l => l.time >= 0),
        version: 1,
        source: "artist",
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("track_lyrics_sync").upsert(
        {
          track_id: selectedTrackId,
          user_id: user.id,
          lyrics_data: lyricsData as any,
          is_published: publish,
          version: 1,
        },
        { onConflict: "track_id,version" }
      );

      if (error) throw error;
      setSource("artist");
      toast.success(publish ? "Lyrics published!" : "Lyrics saved as draft");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (s: number) => {
    if (s < 0) return "--:--";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 10);
    return `${m}:${sec.toString().padStart(2, "0")}.${ms}`;
  };

  return (
    <div className="space-y-6">
      <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onEnded={() => setIsPlaying(false)} />

      {/* Track Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mic className="h-5 w-5 text-primary" />
            Lyrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedTrackId} onValueChange={setSelectedTrackId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a track to sync lyrics..." />
            </SelectTrigger>
            <SelectContent>
              {tracks.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedTrackId && (
            <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
              <span>
                {source === "auto" ? "Transcribed and timed automatically. Fix any words or timings, then publish."
                  : source === "artist" ? "Your edited lyrics."
                  : job?.status === "pending" || job?.status === "processing" ? "Transcribing this track… this usually takes a minute or two."
                  : job?.status === "instrumental" ? "No vocals found, so there are no lyrics to time."
                  : job?.status === "failed" || job?.status === "gave_up" ? `Automatic transcription didn't work${job.error ? `: ${job.error}` : ""}.`
                  : "No lyrics yet."}
              </span>
              <Button variant="outline" size="sm" onClick={redoAutomatically} disabled={retrying} className="gap-1">
                {retrying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                {source ? "Redo automatically" : "Transcribe now"}
              </Button>
            </div>
          )}

          {selectedTrackId && mode === "edit" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Paste or type your lyrics, one line per row. Lines keep their timing when you only change words.
              </p>
              <Textarea
                value={rawLyrics}
                onChange={e => setRawLyrics(e.target.value)}
                placeholder={"First line of the song\nSecond line of the song\nThird line..."}
                rows={12}
                className="font-mono text-sm"
              />
              <Button onClick={handleParseLyrics} disabled={!rawLyrics.trim()}>
                Prepare Sync ({rawLyrics.split("\n").filter(l => l.trim()).length} lines)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Interface */}
      {selectedTrackId && mode === "sync" && lines.length > 0 && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Transport Controls */}
            <div className="flex items-center gap-3 flex-wrap">
              <Button variant="outline" size="icon" onClick={togglePlay}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <span className="text-sm font-mono text-muted-foreground min-w-[60px]">
                {formatTime(currentTime)}
              </span>
              <Button
                onClick={handleTapSync}
                disabled={syncIndex >= lines.length || !isPlaying}
                className="gap-2 bg-primary text-primary-foreground px-6"
              >
                <Mic className="h-4 w-4" />
                Tap to Sync (Line {syncIndex + 1}/{lines.length})
              </Button>
              <Button variant="ghost" size="sm" onClick={resetSync} className="gap-1">
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setMode("edit")} className="gap-1">
                Edit Text
              </Button>
            </div>

            {/* Lines List */}
            <ScrollArea className="h-[400px] pr-3" ref={scrollRef as any}>
              <div className="space-y-1">
                {lines.map((line, i) => (
                  <div
                    key={i}
                    data-sync-line={i}
                    className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                      i === syncIndex
                        ? "bg-primary/10 border border-primary/30"
                        : i < syncIndex && line.time >= 0
                        ? "bg-muted/30"
                        : ""
                    }`}
                  >
                    {/* Timestamp */}
                    <div className="flex items-center gap-1 min-w-[100px]">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => adjustTime(i, -0.1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className={`text-xs font-mono min-w-[50px] text-center ${line.time >= 0 ? "text-primary" : "text-muted-foreground"}`}>
                        {formatTime(line.time)}
                      </span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => adjustTime(i, 0.1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Status */}
                    {line.time >= 0 && <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />}

                    {/* Text */}
                    <input
                      aria-label={`Line ${i + 1}`}
                      value={line.text}
                      onChange={(e) => setLines(prev => prev.map((l, j) => j === i ? { ...l, text: e.target.value } : l))}
                      className={`flex-1 min-w-0 bg-transparent text-sm rounded px-1 py-0.5 focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary ${i === syncIndex ? "font-semibold" : ""}`}
                    />

                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeLine(i)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Save Controls */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => handleSave(false)} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Draft
              </Button>
              <Button onClick={() => handleSave(true)} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save & Publish
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
