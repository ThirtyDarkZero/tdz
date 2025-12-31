import { useMemo, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { 
  Play, Music2, Headphones, Mic2, Guitar, Drum, Piano, 
  Dumbbell, Heart, Moon, Sun, Coffee, PartyPopper, Brain,
  Car, Plane, Gamepad2, Book, Utensils, Sparkles, Zap,
  CloudRain, Wind, Flame, Leaf, Star, Trophy, Loader2
} from "lucide-react";

interface Track {
  id: string;
  title: string;
  artist_name: string;
  genre?: string;
  mood?: string;
  bpm?: number;
  duration?: number;
  file_path?: string;
  play_count?: number;
  youtubeId?: string;
  thumbnail?: string;
  source?: 'tdz' | 'youtube' | 'global';
  [key: string]: any;
}

interface EditorialPlaylistsProps {
  tracks: Track[];
  onPlayPlaylist: (name: string, tracks: Track[]) => void;
  onPlaylistClick?: (playlistId: string) => void;
}

// Genre Configuration - PHP style with rich metadata
const GENRE_CONFIG: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  image: string;
  description: string;
  color: string;
}> = {
  "Hip Hop": {
    icon: Mic2,
    gradient: "from-amber-600 to-orange-800",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80",
    description: "Beats, bars & urban vibes",
    color: "amber"
  },
  "R&B": {
    icon: Headphones,
    gradient: "from-purple-600 to-violet-800",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80",
    description: "Smooth rhythms & soulful vocals",
    color: "purple"
  },
  "Rock": {
    icon: Guitar,
    gradient: "from-red-600 to-rose-800",
    image: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&q=80",
    description: "Raw energy & guitar power",
    color: "red"
  },
  "Pop": {
    icon: Music2,
    gradient: "from-pink-500 to-fuchsia-700",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80",
    description: "Catchy hooks & mainstream hits",
    color: "pink"
  },
  "Electronic": {
    icon: Drum,
    gradient: "from-cyan-500 to-blue-700",
    image: "https://images.unsplash.com/photo-1571266028243-d220c6e3d9ec?w=400&q=80",
    description: "Synths, drops & digital beats",
    color: "cyan"
  },
  "Jazz": {
    icon: Piano,
    gradient: "from-yellow-600 to-amber-800",
    image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&q=80",
    description: "Improvisation & timeless class",
    color: "yellow"
  },
  "Soul": {
    icon: Heart,
    gradient: "from-orange-500 to-red-700",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80",
    description: "Deep emotions & groove",
    color: "orange"
  },
  "Classical": {
    icon: Piano,
    gradient: "from-slate-500 to-gray-700",
    image: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&q=80",
    description: "Orchestral masterpieces",
    color: "slate"
  },
  "Country": {
    icon: Guitar,
    gradient: "from-amber-700 to-yellow-900",
    image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&q=80",
    description: "Stories & southern soul",
    color: "amber"
  },
  "Latin": {
    icon: Drum,
    gradient: "from-rose-500 to-orange-600",
    image: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=400&q=80",
    description: "Tropical rhythms & passion",
    color: "rose"
  }
};

// Activity-based playlists - BusyOwl PHP pattern
const ACTIVITY_CONFIG: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  image: string;
  description: string;
  keywords: string[];
  bpmRange?: [number, number];
}> = {
  "Workout": {
    icon: Dumbbell,
    gradient: "from-red-500 to-orange-600",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80",
    description: "High energy fuel for your gains",
    keywords: ["energetic", "power", "intense", "pump"],
    bpmRange: [120, 180]
  },
  "Focus": {
    icon: Brain,
    gradient: "from-indigo-500 to-blue-700",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80",
    description: "Deep concentration zone",
    keywords: ["ambient", "minimal", "instrumental", "calm"],
    bpmRange: [60, 100]
  },
  "Party": {
    icon: PartyPopper,
    gradient: "from-fuchsia-500 to-pink-600",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80",
    description: "Turn up the celebration",
    keywords: ["dance", "upbeat", "club", "party"],
    bpmRange: [110, 140]
  },
  "Road Trip": {
    icon: Car,
    gradient: "from-emerald-500 to-teal-700",
    image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&q=80",
    description: "Miles of good vibes",
    keywords: ["rock", "feel-good", "sing-along"],
    bpmRange: [90, 130]
  },
  "Sleep": {
    icon: Moon,
    gradient: "from-slate-600 to-indigo-900",
    image: "https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=400&q=80",
    description: "Drift away peacefully",
    keywords: ["ambient", "peaceful", "soft", "dreamy"],
    bpmRange: [40, 70]
  },
  "Morning": {
    icon: Coffee,
    gradient: "from-amber-400 to-orange-500",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80",
    description: "Start your day right",
    keywords: ["uplifting", "positive", "fresh"],
    bpmRange: [80, 120]
  },
  "Gaming": {
    icon: Gamepad2,
    gradient: "from-violet-600 to-purple-800",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80",
    description: "Level up your gameplay",
    keywords: ["electronic", "intense", "epic"],
    bpmRange: [100, 160]
  },
  "Travel": {
    icon: Plane,
    gradient: "from-sky-400 to-blue-600",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&q=80",
    description: "Soundtrack your journey",
    keywords: ["world", "chill", "ambient"],
    bpmRange: [70, 110]
  },
  "Study": {
    icon: Book,
    gradient: "from-green-500 to-emerald-700",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80",
    description: "Boost your productivity",
    keywords: ["lo-fi", "instrumental", "minimal"],
    bpmRange: [60, 90]
  },
  "Dinner": {
    icon: Utensils,
    gradient: "from-rose-400 to-red-600",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80",
    description: "Perfect dining ambiance",
    keywords: ["jazz", "soul", "elegant"],
    bpmRange: [70, 100]
  }
};

// Mood-based playlists - emotional states
const MOOD_CONFIG: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  image: string;
  description: string;
  keywords: string[];
  emoji: string;
}> = {
  "Happy": {
    icon: Sun,
    gradient: "from-yellow-400 to-orange-500",
    image: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=400&q=80",
    description: "Pure joy & good times",
    keywords: ["happy", "joyful", "upbeat", "cheerful"],
    emoji: "😊"
  },
  "Sad": {
    icon: CloudRain,
    gradient: "from-slate-500 to-blue-800",
    image: "https://images.unsplash.com/photo-1499346030926-9a72daac6c63?w=400&q=80",
    description: "Feel your feelings",
    keywords: ["sad", "melancholy", "emotional"],
    emoji: "😢"
  },
  "Chill": {
    icon: Wind,
    gradient: "from-teal-400 to-cyan-600",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80",
    description: "Relax & unwind",
    keywords: ["chill", "relaxed", "mellow", "calm"],
    emoji: "😌"
  },
  "Romantic": {
    icon: Heart,
    gradient: "from-pink-500 to-rose-600",
    image: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&q=80",
    description: "Love in the air",
    keywords: ["romantic", "love", "sensual"],
    emoji: "💕"
  },
  "Energetic": {
    icon: Zap,
    gradient: "from-orange-500 to-red-600",
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&q=80",
    description: "Maximum energy boost",
    keywords: ["energetic", "powerful", "intense"],
    emoji: "⚡"
  },
  "Peaceful": {
    icon: Leaf,
    gradient: "from-green-400 to-emerald-600",
    image: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=400&q=80",
    description: "Inner calm & serenity",
    keywords: ["peaceful", "serene", "tranquil"],
    emoji: "🍃"
  },
  "Confident": {
    icon: Trophy,
    gradient: "from-amber-500 to-yellow-600",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&q=80",
    description: "Boss mode activated",
    keywords: ["confident", "bold", "powerful"],
    emoji: "💪"
  },
  "Dreamy": {
    icon: Star,
    gradient: "from-purple-400 to-indigo-600",
    image: "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=400&q=80",
    description: "Lost in the clouds",
    keywords: ["dreamy", "ethereal", "ambient"],
    emoji: "✨"
  },
  "Angry": {
    icon: Flame,
    gradient: "from-red-600 to-rose-800",
    image: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=400&q=80",
    description: "Release the rage",
    keywords: ["angry", "aggressive", "intense"],
    emoji: "🔥"
  },
  "Motivated": {
    icon: Sparkles,
    gradient: "from-cyan-400 to-blue-600",
    image: "https://images.unsplash.com/photo-1504805572947-34fad45aed93?w=400&q=80",
    description: "Chase your dreams",
    keywords: ["motivational", "inspiring", "uplifting"],
    emoji: "🚀"
  }
};

type PlaylistCategory = "genres" | "activities" | "moods";

export function EditorialPlaylists({ tracks, onPlayPlaylist, onPlaylistClick }: EditorialPlaylistsProps) {
  const [activeCategory, setActiveCategory] = useState<PlaylistCategory>("genres");
  const [globalTracks, setGlobalTracks] = useState<Track[]>([]);
  const [loadingGlobal, setLoadingGlobal] = useState(false);

  // Fetch trending global library content for editorial playlists
  useEffect(() => {
    const fetchGlobalContent = async () => {
      setLoadingGlobal(true);
      try {
        // Fetch from Billboard charts and trending content
        const { data } = await supabase.functions.invoke('unified-music-search', {
          body: { 
            query: 'top hits 2024', 
            type: 'track',
            limit: 50,
            includeCharts: true,
            aiEnrich: false
          }
        });
        
        if (data?.results) {
          const globalResults: Track[] = data.results
            .filter((r: any) => r.youtubeId)
            .map((r: any) => ({
              id: r.id,
              title: r.title,
              artist_name: r.artist,
              genre: r.genres?.[0] || 'Pop',
              mood: r.moodTags?.[0] || 'Energetic',
              bpm: r.acousticData?.bpm,
              youtubeId: r.youtubeId,
              thumbnail: r.thumbnail,
              source: 'global' as const,
              play_count: r.popularity || 0,
            }));
          setGlobalTracks(globalResults);
        }
      } catch (error) {
        console.error('Error fetching global content:', error);
      } finally {
        setLoadingGlobal(false);
      }
    };

    fetchGlobalContent();
  }, []);

  // Combine TDZ tracks with global library tracks
  const allTracks = useMemo(() => {
    return [...tracks, ...globalTracks];
  }, [tracks, globalTracks]);

  // Generate genre playlists from all tracks (TDZ + global)
  const genrePlaylists = useMemo(() => {
    const grouped: Record<string, Track[]> = {};
    
    allTracks.forEach(track => {
      const genre = track.genre || "Other";
      if (!grouped[genre]) {
        grouped[genre] = [];
      }
      grouped[genre].push(track);
    });

    return Object.entries(grouped)
      .sort(([, a], [, b]) => b.length - a.length)
      .slice(0, 10)
      .map(([genre, genreTracks]) => ({
        id: `genre-${genre.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: genre,
        tracks: genreTracks,
        config: GENRE_CONFIG[genre] || {
          icon: Music2,
          gradient: "from-primary to-primary-glow",
          image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80",
          description: `Best of ${genre}`,
          color: "primary"
        }
      }));
  }, [tracks]);

  // Generate activity playlists by matching track properties (from all sources)
  const activityPlaylists = useMemo(() => {
    return Object.entries(ACTIVITY_CONFIG).map(([activity, config]) => {
      // Filter tracks by BPM range and keyword matching
      const matchingTracks = allTracks.filter(track => {
        // BPM match
        if (config.bpmRange && track.bpm) {
          if (track.bpm < config.bpmRange[0] || track.bpm > config.bpmRange[1]) {
            return false;
          }
        }
        
        // Keyword matching in genre/mood/title
        const trackText = `${track.genre || ''} ${track.mood || ''} ${track.title || ''}`.toLowerCase();
        return config.keywords.some(keyword => trackText.includes(keyword.toLowerCase()));
      });

      // If not enough tracks matched, add some from compatible genres
      let finalTracks = matchingTracks;
      if (matchingTracks.length < 5) {
        const additionalTracks = allTracks
          .filter(t => !matchingTracks.includes(t))
          .slice(0, 10 - matchingTracks.length);
        finalTracks = [...matchingTracks, ...additionalTracks];
      }

      return {
        id: `activity-${activity.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: activity,
        tracks: finalTracks.slice(0, 25),
        config
      };
    });
  }, [tracks]);

  // Generate mood playlists by matching track mood (from all sources)
  const moodPlaylists = useMemo(() => {
    return Object.entries(MOOD_CONFIG).map(([mood, config]) => {
      // Filter tracks by mood matching
      const matchingTracks = allTracks.filter(track => {
        const trackMood = (track.mood || '').toLowerCase();
        const trackText = `${trackMood} ${track.genre || ''} ${track.title || ''}`.toLowerCase();
        return config.keywords.some(keyword => trackText.includes(keyword.toLowerCase()));
      });

      // Fill with random tracks if needed
      let finalTracks = matchingTracks;
      if (matchingTracks.length < 5) {
        const additionalTracks = allTracks
          .filter(t => !matchingTracks.includes(t))
          .slice(0, 10 - matchingTracks.length);
        finalTracks = [...matchingTracks, ...additionalTracks];
      }

      return {
        id: `mood-${mood.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: mood,
        tracks: finalTracks.slice(0, 25),
        config
      };
    });
  }, [tracks]);

  const renderPlaylistCard = (
    playlist: { id: string; name: string; tracks: Track[]; config: any },
    index: number,
    showEmoji?: boolean
  ) => {
    const Icon = playlist.config.icon;
    
    return (
      <Card
        key={playlist.id}
        onClick={() => onPlaylistClick?.(playlist.id)}
        className="relative group cursor-pointer overflow-hidden flex-shrink-0 w-[180px] md:w-[200px] h-[240px] md:h-[260px] border-0 hover:scale-[1.02] transition-all duration-300 shadow-lg"
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        {/* Background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
          style={{ backgroundImage: `url(${playlist.config.image})` }}
        />
        
        {/* Gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t ${playlist.config.gradient} opacity-75 group-hover:opacity-85 transition-opacity`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Content */}
        <div className="relative h-full flex flex-col justify-between p-4 md:p-5 z-10">
          {/* Top badge */}
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-0 text-xs">
              {playlist.tracks.length} tracks
            </Badge>
            {showEmoji && playlist.config.emoji && (
              <span className="text-2xl">{playlist.config.emoji}</span>
            )}
          </div>

          {/* Bottom info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-white/90" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-white leading-tight">{playlist.name}</h3>
            <p className="text-xs md:text-sm text-white/70 line-clamp-2">{playlist.config.description}</p>
          </div>

          {/* Play button overlay */}
          <Button
            size="icon"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full w-12 h-12 bg-white/90 text-black opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-xl"
            onClick={(e) => {
              e.stopPropagation();
              onPlayPlaylist(playlist.name, playlist.tracks);
            }}
          >
            <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
          </Button>
        </div>
      </Card>
    );
  };

  const currentPlaylists = activeCategory === "genres" 
    ? genrePlaylists 
    : activeCategory === "activities" 
      ? activityPlaylists 
      : moodPlaylists;

  return (
    <div className="space-y-6">
      {/* Header with tabs */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">
            <span className="text-gradient-aurora">Editorial Playlists</span>
          </h2>
          <Badge variant="outline" className="border-primary/30 text-primary">
            Curated for You
          </Badge>
        </div>

        <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as PlaylistCategory)}>
          <TabsList className="bg-muted/30 backdrop-blur-sm border border-border/50">
            <TabsTrigger 
              value="genres" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Music2 className="w-4 h-4 mr-2" />
              Genres
            </TabsTrigger>
            <TabsTrigger 
              value="activities"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Dumbbell className="w-4 h-4 mr-2" />
              Activities
            </TabsTrigger>
            <TabsTrigger 
              value="moods"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Heart className="w-4 h-4 mr-2" />
              Moods
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Playlist grid */}
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {currentPlaylists.map((playlist, index) => 
            renderPlaylistCard(playlist, index, activeCategory === "moods")
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Featured section for each category */}
      {activeCategory === "genres" && genrePlaylists.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {genrePlaylists.slice(0, 4).map((playlist, index) => {
            const Icon = playlist.config.icon;
            return (
              <Card 
                key={`featured-${playlist.id}`}
                onClick={() => onPlayPlaylist(playlist.name, playlist.tracks)}
                className={`group cursor-pointer p-4 bg-gradient-to-br ${playlist.config.gradient} border-0 hover:scale-[1.02] transition-all`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white truncate">{playlist.name}</h4>
                    <p className="text-xs text-white/70">{playlist.tracks.length} tracks</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-8 h-8 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Play className="w-4 h-4 text-white" fill="currentColor" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick access chips for activities */}
      {activeCategory === "activities" && (
        <div className="flex flex-wrap gap-2">
          {activityPlaylists.slice(0, 6).map((playlist) => {
            const Icon = playlist.config.icon;
            return (
              <Button
                key={`chip-${playlist.id}`}
                variant="outline"
                size="sm"
                onClick={() => onPlayPlaylist(playlist.name, playlist.tracks)}
                className={`rounded-full bg-gradient-to-r ${playlist.config.gradient} text-white border-0 hover:opacity-90`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {playlist.name}
              </Button>
            );
          })}
        </div>
      )}

      {/* Emoji mood selector */}
      {activeCategory === "moods" && (
        <div className="flex flex-wrap gap-3 justify-center p-4 bg-muted/20 rounded-xl">
          {moodPlaylists.map((playlist) => (
            <button
              key={`emoji-${playlist.id}`}
              onClick={() => onPlayPlaylist(playlist.name, playlist.tracks)}
              className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-muted/40 transition-colors group"
            >
              <span className="text-3xl group-hover:scale-125 transition-transform">
                {playlist.config.emoji}
              </span>
              <span className="text-xs text-muted-foreground group-hover:text-foreground">
                {playlist.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
