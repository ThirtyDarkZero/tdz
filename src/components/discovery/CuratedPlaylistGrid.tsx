import { useMemo, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { 
  Play, ChevronRight, Sparkles, TrendingUp, Clock, Star,
  Music2, Mic2, Headphones, Radio, Zap, Heart, PartyPopper,
  Sun, Moon, Coffee, Dumbbell, Car, Gamepad2, Flame
} from "lucide-react";

interface Track {
  id: string;
  title: string;
  artist_name: string;
  genre?: string;
  mood?: string;
  bpm?: number;
  source?: 'tdz' | 'youtube' | 'global';
  youtubeId?: string;
  thumbnail?: string;
  chartPosition?: number;
  [key: string]: any;
}

interface CuratedPlaylistGridProps {
  tracks: Track[];
  onPlayPlaylist: (name: string, tracks: Track[]) => void;
  onViewAll?: (category: string) => void;
}

// Amazing curated sets with stunning artwork
const CURATED_SETS = {
  "New & Noteworthy": {
    id: "new-noteworthy",
    icon: Sparkles,
    gradient: "from-cyan-500/80 to-blue-600/80",
    artwork: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
    description: "Fresh drops and rising stars",
    filter: (tracks: Track[]) => tracks.slice(0, 20),
  },
  "Trending Now": {
    id: "trending",
    icon: TrendingUp,
    gradient: "from-pink-500/80 to-rose-600/80",
    artwork: "https://images.unsplash.com/photo-1571266028243-d220c6e3d9ec?w=800&q=80",
    description: "What everyone's playing",
    filter: (tracks: Track[]) => [...tracks].sort((a, b) => (b.play_count || 0) - (a.play_count || 0)).slice(0, 20),
  },
  "Best of 2025": {
    id: "best-2025",
    icon: Star,
    gradient: "from-amber-500/80 to-orange-600/80",
    artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
    description: "Year's top tracks",
    filter: (tracks: Track[]) => tracks.slice(0, 25),
  },
  "Club Hits": {
    id: "club-hits",
    icon: PartyPopper,
    gradient: "from-fuchsia-500/80 to-purple-600/80",
    artwork: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80",
    description: "Peak time bangers",
    filter: (tracks: Track[]) => tracks.filter(t => 
      (t.bpm && t.bpm >= 120 && t.bpm <= 135) || 
      t.genre?.toLowerCase().includes('dance') ||
      t.genre?.toLowerCase().includes('electronic')
    ).slice(0, 20),
  },
  "Hip Hop Essentials": {
    id: "hip-hop-essentials",
    icon: Mic2,
    gradient: "from-orange-500/80 to-red-600/80",
    artwork: "https://images.unsplash.com/photo-1601643157091-ce5c665179ab?w=800&q=80",
    description: "Bars & beats",
    filter: (tracks: Track[]) => tracks.filter(t => 
      t.genre?.toLowerCase().includes('hip') || 
      t.genre?.toLowerCase().includes('rap')
    ).slice(0, 20),
  },
  "R&B Slow Jams": {
    id: "rnb-slow-jams",
    icon: Heart,
    gradient: "from-purple-500/80 to-pink-600/80",
    artwork: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80",
    description: "Smooth & sensual",
    filter: (tracks: Track[]) => tracks.filter(t => 
      t.genre?.toLowerCase().includes('r&b') || 
      t.genre?.toLowerCase().includes('soul') ||
      t.mood?.toLowerCase().includes('romantic')
    ).slice(0, 20),
  },
  "Workout Power": {
    id: "workout",
    icon: Dumbbell,
    gradient: "from-red-500/80 to-orange-600/80",
    artwork: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
    description: "Pump up the energy",
    filter: (tracks: Track[]) => tracks.filter(t => 
      (t.bpm && t.bpm >= 130) || 
      t.mood?.toLowerCase().includes('energetic')
    ).slice(0, 20),
  },
  "Chill Vibes": {
    id: "chill",
    icon: Coffee,
    gradient: "from-teal-500/80 to-cyan-600/80",
    artwork: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80",
    description: "Easy listening",
    filter: (tracks: Track[]) => tracks.filter(t => 
      t.mood?.toLowerCase().includes('chill') || 
      t.mood?.toLowerCase().includes('calm') ||
      (t.bpm && t.bpm < 100)
    ).slice(0, 20),
  },
  "Late Night": {
    id: "late-night",
    icon: Moon,
    gradient: "from-indigo-600/80 to-purple-800/80",
    artwork: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80",
    description: "After hours vibes",
    filter: (tracks: Track[]) => tracks.filter(t => 
      t.mood?.toLowerCase().includes('dark') || 
      t.mood?.toLowerCase().includes('moody') ||
      t.genre?.toLowerCase().includes('ambient')
    ).slice(0, 20),
  },
  "Summertime": {
    id: "summer",
    icon: Sun,
    gradient: "from-yellow-400/80 to-orange-500/80",
    artwork: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80",
    description: "Feel-good summer anthems",
    filter: (tracks: Track[]) => tracks.filter(t => 
      t.mood?.toLowerCase().includes('happy') || 
      t.mood?.toLowerCase().includes('upbeat') ||
      t.genre?.toLowerCase().includes('pop')
    ).slice(0, 20),
  },
  "Road Trip": {
    id: "road-trip",
    icon: Car,
    gradient: "from-emerald-500/80 to-teal-600/80",
    artwork: "https://images.unsplash.com/photo-1504509546545-e000b4a62425?w=800&q=80",
    description: "Miles of great music",
    filter: (tracks: Track[]) => tracks.filter(t => 
      t.genre?.toLowerCase().includes('rock') || 
      t.mood?.toLowerCase().includes('uplifting')
    ).slice(0, 20),
  },
  "Gaming Session": {
    id: "gaming",
    icon: Gamepad2,
    gradient: "from-violet-600/80 to-purple-700/80",
    artwork: "https://images.unsplash.com/photo-1511882150382-421056c89033?w=800&q=80",
    description: "Epic gaming soundtrack",
    filter: (tracks: Track[]) => tracks.filter(t => 
      t.genre?.toLowerCase().includes('electronic') || 
      t.genre?.toLowerCase().includes('edm') ||
      (t.bpm && t.bpm >= 140)
    ).slice(0, 20),
  },
};

const CATEGORY_SECTIONS = [
  {
    title: "New & Noteworthy",
    sets: ["New & Noteworthy", "Trending Now", "Best of 2025"],
  },
  {
    title: "By Genre",
    sets: ["Club Hits", "Hip Hop Essentials", "R&B Slow Jams"],
  },
  {
    title: "By Mood & Activity",
    sets: ["Workout Power", "Chill Vibes", "Late Night", "Summertime", "Road Trip", "Gaming Session"],
  },
];

export function CuratedPlaylistGrid({ tracks, onPlayPlaylist, onViewAll }: CuratedPlaylistGridProps) {
  const [globalTrendingTracks, setGlobalTrendingTracks] = useState<Track[]>([]);
  const [loadingGlobal, setLoadingGlobal] = useState(true);

  // Fetch trending from global library (Billboard, TheAudioDB)
  useEffect(() => {
    const fetchGlobalTrending = async () => {
      try {
        const { data } = await supabase.functions.invoke('unified-music-search', {
          body: {
            query: 'Billboard Hot 100 2025',
            limit: 50,
            sources: ['billboard', 'theaudiodb'],
            includeAcoustic: true,
          }
        });

        if (data?.results) {
          const globalTracks: Track[] = data.results
            .filter((r: any) => r.title && !r.title.includes('%'))
            .map((r: any, idx: number) => ({
              id: `global-${r.id || idx}`,
              title: r.title,
              artist_name: r.artist,
              genre: r.genre || 'Pop',
              mood: r.mood,
              bpm: r.bpm,
              source: 'global' as const,
              youtubeId: r.youtubeId,
              thumbnail: r.thumbnail || r.theAudioDBImage || r.allMusicImage,
              chartPosition: r.chartPosition || idx + 1,
            }));
          setGlobalTrendingTracks(globalTracks);
        }
      } catch (error) {
        console.error('Error fetching global trending:', error);
      } finally {
        setLoadingGlobal(false);
      }
    };

    fetchGlobalTrending();
  }, []);

  // Combine TDZ tracks with global trending
  const allTracks = useMemo(() => {
    const combined = [...tracks];
    
    // Add global tracks that aren't duplicates
    globalTrendingTracks.forEach(gt => {
      const exists = combined.some(t => 
        t.title.toLowerCase() === gt.title.toLowerCase() &&
        t.artist_name.toLowerCase() === gt.artist_name.toLowerCase()
      );
      if (!exists) {
        combined.push(gt);
      }
    });

    return combined;
  }, [tracks, globalTrendingTracks]);

  // Generate playlists from combined tracks
  const generatedPlaylists = useMemo(() => {
    const result: Record<string, { tracks: Track[]; config: typeof CURATED_SETS[keyof typeof CURATED_SETS] }> = {};
    
    Object.entries(CURATED_SETS).forEach(([name, config]) => {
      let filteredTracks = config.filter(allTracks);
      
      // For "Trending Now", prioritize global charting tracks
      if (name === "Trending Now") {
        const chartingTracks = globalTrendingTracks
          .filter(t => t.chartPosition && t.chartPosition <= 50)
          .sort((a, b) => (a.chartPosition || 999) - (b.chartPosition || 999));
        
        if (chartingTracks.length > 5) {
          filteredTracks = [...chartingTracks, ...filteredTracks.filter(t => !chartingTracks.includes(t))].slice(0, 30);
        }
      }
      
      // Ensure minimum tracks
      if (filteredTracks.length < 5) {
        filteredTracks = [...filteredTracks, ...allTracks.slice(0, 10 - filteredTracks.length)];
      }
      
      result[name] = {
        tracks: filteredTracks,
        config,
      };
    });
    
    return result;
  }, [allTracks, globalTrendingTracks]);

  const renderPlaylistCard = (name: string, size: 'small' | 'large' = 'small') => {
    const playlist = generatedPlaylists[name];
    if (!playlist) return null;
    
    const Icon = playlist.config.icon;
    const isLarge = size === 'large';
    
    return (
      <Card
        key={name}
        className={`
          relative group cursor-pointer overflow-hidden border-0 
          hover:scale-[1.03] transition-all duration-500 shadow-2xl flex-shrink-0
          ${isLarge ? 'w-[300px] h-[360px]' : 'w-[220px] h-[280px]'}
        `}
        onClick={() => onPlayPlaylist(name, playlist.tracks)}
      >
        {/* Background artwork */}
        <div className="absolute inset-0">
          <img 
            src={playlist.config.artwork}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          {/* Gradient overlay */}
          <div className={`absolute inset-0 bg-gradient-to-br ${playlist.config.gradient} mix-blend-multiply`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </div>
        
        {/* Animated shimmer on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
        </div>
        
        {/* Content */}
        <div className="relative h-full flex flex-col justify-between p-5 z-10">
          {/* Top section */}
          <div className="flex items-start justify-between">
            <div className={`
              ${isLarge ? 'w-14 h-14' : 'w-12 h-12'} 
              rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center
              border border-white/20 shadow-lg
            `}>
              <Icon className={`${isLarge ? 'w-7 h-7' : 'w-6 h-6'} text-white`} />
            </div>
            <Badge className="bg-black/40 text-white border-0 backdrop-blur-sm text-xs px-2.5 py-1">
              {playlist.tracks.length} tracks
            </Badge>
          </div>
          
          {/* Bottom section */}
          <div className="space-y-3">
            <h3 className={`${isLarge ? 'text-2xl' : 'text-xl'} font-bold text-white leading-tight drop-shadow-lg`}>
              {name}
            </h3>
            <p className="text-sm text-white/80 line-clamp-2">{playlist.config.description}</p>
          </div>
          
          {/* Play button - appears on hover */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              size="icon"
              className={`
                rounded-full bg-white text-black opacity-0 group-hover:opacity-100
                transition-all duration-300 hover:scale-110 shadow-2xl
                ${isLarge ? 'w-16 h-16' : 'w-14 h-14'}
                translate-y-4 group-hover:translate-y-0
              `}
            >
              <Play className={`${isLarge ? 'w-7 h-7' : 'w-6 h-6'} ml-1`} fill="currentColor" />
            </Button>
          </div>
        </div>
        
        {/* Glow effect on hover */}
        <div className={`absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 blur-xl bg-gradient-to-br ${playlist.config.gradient}`} />
      </Card>
    );
  };

  return (
    <div className="space-y-12">
      {CATEGORY_SECTIONS.map((section) => (
        <div key={section.title} className="space-y-5">
          {/* Section header */}
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">{section.title}</h2>
            <button
              onClick={() => onViewAll?.(section.title)}
              className="flex items-center gap-1.5 text-sm text-white/60 hover:text-cyan-400 transition-colors group"
            >
              See More
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
          {/* Playlist cards */}
          <ScrollArea className="w-full">
            <div className="flex gap-5 pb-4">
              {section.sets.map((setName, index) => 
                renderPlaylistCard(setName, index === 0 && section.title === "New & Noteworthy" ? 'large' : 'small')
              )}
            </div>
            <ScrollBar orientation="horizontal" className="opacity-0" />
          </ScrollArea>
        </div>
      ))}
    </div>
  );
}