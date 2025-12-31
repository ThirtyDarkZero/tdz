import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
  [key: string]: any;
}

interface CuratedPlaylistGridProps {
  tracks: Track[];
  onPlayPlaylist: (name: string, tracks: Track[]) => void;
  onViewAll?: (category: string) => void;
}

// BPMSupreme-inspired curated sets
const CURATED_SETS = {
  "New & Noteworthy": {
    id: "new-noteworthy",
    icon: Sparkles,
    gradient: "from-cyan-500 to-blue-600",
    description: "Fresh drops and rising stars",
    filter: (tracks: Track[]) => tracks.slice(0, 20), // Most recent
  },
  "Trending Now": {
    id: "trending",
    icon: TrendingUp,
    gradient: "from-pink-500 to-rose-600",
    description: "What everyone's playing",
    filter: (tracks: Track[]) => [...tracks].sort((a, b) => (b.play_count || 0) - (a.play_count || 0)).slice(0, 20),
  },
  "Best of 2025": {
    id: "best-2025",
    icon: Star,
    gradient: "from-amber-500 to-orange-600",
    description: "Year's top tracks",
    filter: (tracks: Track[]) => tracks.slice(0, 25),
  },
  "Club Hits": {
    id: "club-hits",
    icon: PartyPopper,
    gradient: "from-fuchsia-500 to-purple-600",
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
    gradient: "from-orange-500 to-red-600",
    description: "Bars & beats",
    filter: (tracks: Track[]) => tracks.filter(t => 
      t.genre?.toLowerCase().includes('hip') || 
      t.genre?.toLowerCase().includes('rap')
    ).slice(0, 20),
  },
  "R&B Slow Jams": {
    id: "rnb-slow-jams",
    icon: Heart,
    gradient: "from-purple-500 to-pink-600",
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
    gradient: "from-red-500 to-orange-600",
    description: "Pump up the energy",
    filter: (tracks: Track[]) => tracks.filter(t => 
      (t.bpm && t.bpm >= 130) || 
      t.mood?.toLowerCase().includes('energetic')
    ).slice(0, 20),
  },
  "Chill Vibes": {
    id: "chill",
    icon: Coffee,
    gradient: "from-teal-500 to-cyan-600",
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
    gradient: "from-indigo-600 to-purple-800",
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
    gradient: "from-yellow-400 to-orange-500",
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
    gradient: "from-emerald-500 to-teal-600",
    description: "Miles of great music",
    filter: (tracks: Track[]) => tracks.filter(t => 
      t.genre?.toLowerCase().includes('rock') || 
      t.mood?.toLowerCase().includes('uplifting')
    ).slice(0, 20),
  },
  "Gaming Session": {
    id: "gaming",
    icon: Gamepad2,
    gradient: "from-violet-600 to-purple-700",
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
  // Generate playlists from tracks
  const generatedPlaylists = useMemo(() => {
    const result: Record<string, { tracks: Track[]; config: typeof CURATED_SETS[keyof typeof CURATED_SETS] }> = {};
    
    Object.entries(CURATED_SETS).forEach(([name, config]) => {
      let filteredTracks = config.filter(tracks);
      
      // Ensure minimum tracks
      if (filteredTracks.length < 5) {
        filteredTracks = [...filteredTracks, ...tracks.slice(0, 10 - filteredTracks.length)];
      }
      
      result[name] = {
        tracks: filteredTracks,
        config,
      };
    });
    
    return result;
  }, [tracks]);

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
          hover:scale-[1.02] transition-all duration-300 shadow-xl flex-shrink-0
          ${isLarge ? 'w-[280px] h-[320px]' : 'w-[200px] h-[240px]'}
        `}
        onClick={() => onPlayPlaylist(name, playlist.tracks)}
      >
        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${playlist.config.gradient} opacity-90`} />
        
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Content */}
        <div className="relative h-full flex flex-col justify-between p-5 z-10">
          {/* Top section */}
          <div className="flex items-start justify-between">
            <div className={`
              ${isLarge ? 'w-14 h-14' : 'w-10 h-10'} 
              rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center
            `}>
              <Icon className={`${isLarge ? 'w-7 h-7' : 'w-5 h-5'} text-white`} />
            </div>
            <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
              {playlist.tracks.length} tracks
            </Badge>
          </div>
          
          {/* Bottom section */}
          <div className="space-y-2">
            <h3 className={`${isLarge ? 'text-2xl' : 'text-lg'} font-bold text-white leading-tight`}>
              {name}
            </h3>
            <p className="text-sm text-white/70">{playlist.config.description}</p>
          </div>
          
          {/* Play button */}
          <Button
            size="icon"
            className={`
              absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
              rounded-full bg-white/90 text-black opacity-0 group-hover:opacity-100
              transition-all hover:scale-110 shadow-xl
              ${isLarge ? 'w-14 h-14' : 'w-12 h-12'}
            `}
          >
            <Play className={`${isLarge ? 'w-6 h-6' : 'w-5 h-5'} ml-0.5`} fill="currentColor" />
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-10">
      {CATEGORY_SECTIONS.map((section) => (
        <div key={section.title} className="space-y-4">
          {/* Section header */}
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold text-white">{section.title}</h2>
            <button
              onClick={() => onViewAll?.(section.title)}
              className="flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors"
            >
              See More
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          {/* Playlist cards */}
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4">
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
