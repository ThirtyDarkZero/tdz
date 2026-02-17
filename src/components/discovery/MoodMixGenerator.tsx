import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer } from "@/contexts/PlayerContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Sparkles, Play, Plus, Loader2, Music, 
  Zap, Moon, Sun, Heart, Flame 
} from "lucide-react";

interface MoodTrack {
  id: string;
  title: string;
  artist_name: string;
  duration: number;
  file_path: string;
  play_count: number;
  source?: 'tdz' | 'youtube' | 'spotify';
  youtubeId?: string;
  thumbnail?: string;
  album_cover_path?: string;
  album_cover_bucket?: string;
}

const MOOD_PRESETS = [
  { label: "Late Night Drive", icon: Moon, prompt: "Late night drive through a neon city" },
  { label: "Workout Energy", icon: Flame, prompt: "High-energy workout with heavy bass drops" },
  { label: "Chill & Study", icon: Sun, prompt: "Calm lo-fi beats for studying and focus" },
  { label: "Feel Good Vibes", icon: Heart, prompt: "Happy upbeat feel-good summer vibes" },
  { label: "Dark & Moody", icon: Zap, prompt: "Dark atmospheric moody electronic" },
];

export function MoodMixGenerator() {
  const { playTrack, addToQueue } = usePlayer();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MoodTrack[]>([]);
  const [mixName, setMixName] = useState("");

  const generateMix = useCallback(async (moodPrompt: string) => {
    if (!moodPrompt.trim()) return;
    
    setLoading(true);
    setResults([]);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-mood-mix', {
        body: { prompt: moodPrompt.trim(), limit: 20 },
      });

      if (error) throw error;

      if (data?.tracks?.length > 0) {
        setResults(data.tracks);
        setMixName(data.mixName || moodPrompt);
        toast.success(`Generated "${data.mixName}" with ${data.tracks.length} tracks`);
      } else {
        toast.info("No matching tracks found. Try a different mood!");
      }
    } catch (err) {
      console.error('Mood mix error:', err);
      toast.error("Failed to generate mood mix");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateMix(prompt);
  };

  const handlePlayTrack = (track: MoodTrack, index: number) => {
    playTrack(track, results);
  };

  const handlePlayAll = () => {
    if (results.length > 0) {
      playTrack(results[0], results);
      toast.success(`Now playing: ${mixName}`);
    }
  };

  const handleAddAllToQueue = () => {
    results.forEach(track => addToQueue(track));
    toast.success(`Added ${results.length} tracks to queue`);
  };

  const getCoverUrl = (track: MoodTrack) => {
    if (track.thumbnail) return track.thumbnail;
    if (track.album_cover_path) {
      const bucket = track.album_cover_bucket || 'album-covers';
      return supabase.storage.from(bucket).getPublicUrl(track.album_cover_path).data.publicUrl;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Prompt Input */}
      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-primary/10">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">AI Mood Mix</h2>
            <p className="text-sm text-muted-foreground">Describe your vibe and we'll create a playlist</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Late night drive through a neon city..."
            className="flex-1 h-12 text-base bg-card border-border/50"
            disabled={loading}
          />
          <Button 
            type="submit" 
            size="lg" 
            disabled={loading || !prompt.trim()}
            className="bg-gradient-to-r from-primary to-primary-glow shadow-glow px-6"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          </Button>
        </form>
      </div>

      {/* Mood Presets */}
      <div className="flex flex-wrap gap-2">
        {MOOD_PRESETS.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            onClick={() => {
              setPrompt(preset.prompt);
              generateMix(preset.prompt);
            }}
            disabled={loading}
            className="gap-1.5"
          >
            <preset.icon className="w-3.5 h-3.5" />
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">{mixName}</h3>
              <p className="text-sm text-muted-foreground">{results.length} tracks</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handlePlayAll} className="bg-gradient-to-r from-primary to-primary-glow">
                <Play className="w-4 h-4 mr-1" fill="currentColor" /> Play All
              </Button>
              <Button size="sm" variant="outline" onClick={handleAddAllToQueue}>
                <Plus className="w-4 h-4 mr-1" /> Queue All
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            {results.map((track, index) => {
              const coverUrl = getCoverUrl(track);
              return (
                <button
                  key={track.id}
                  onClick={() => handlePlayTrack(track, index)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors group text-left"
                >
                  <span className="w-6 text-xs text-muted-foreground text-right tabular-nums">
                    {index + 1}
                  </span>
                  <div className="w-10 h-10 rounded bg-muted flex-shrink-0 overflow-hidden">
                    {coverUrl ? (
                      <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{track.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{track.artist_name}</p>
                  </div>
                  {track.source === 'youtube' && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">YT</Badge>
                  )}
                  <Play className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && results.length === 0 && (
        <Card className="p-8 text-center bg-card/50 border-dashed">
          <Sparkles className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">Describe a mood or pick a preset to get started</p>
        </Card>
      )}
    </div>
  );
}
