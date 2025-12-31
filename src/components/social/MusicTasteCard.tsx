import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Music, Disc, Mic2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MusicTasteCardProps {
  userId: string;
  className?: string;
}

interface TasteData {
  topArtists: { name: string; plays: number }[];
  topGenres: { name: string; percentage: number }[];
  recentMood: string;
  musicPersonality: string;
}

const personalityTypes = [
  { name: 'Explorer', description: 'Always seeking new sounds', icon: '🧭' },
  { name: 'Curator', description: 'Master of playlists', icon: '📚' },
  { name: 'Devotee', description: 'Deep artist connection', icon: '💜' },
  { name: 'Eclectic', description: 'Genre-bending taste', icon: '🌈' },
  { name: 'Nostalgic', description: 'Loves timeless classics', icon: '⏳' },
  { name: 'Trendsetter', description: 'First to discover', icon: '✨' },
];

export function MusicTasteCard({ userId, className }: MusicTasteCardProps) {
  const [taste, setTaste] = useState<TasteData>({
    topArtists: [],
    topGenres: [],
    recentMood: 'Chill',
    musicPersonality: 'Explorer'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasteData();
  }, [userId]);

  const loadTasteData = async () => {
    try {
      // Get listening history to determine top artists
      const { data: historyData } = await supabase
        .from('listening_history')
        .select(`
          track_id,
          tracks:track_id (artist_name, genre)
        `)
        .eq('user_id', userId)
        .limit(100);

      // Count artist plays
      const artistCounts: Record<string, number> = {};
      const genreCounts: Record<string, number> = {};

      historyData?.forEach(h => {
        if (h.tracks) {
          const track = h.tracks as any;
          artistCounts[track.artist_name] = (artistCounts[track.artist_name] || 0) + 1;
          if (track.genre) {
            genreCounts[track.genre] = (genreCounts[track.genre] || 0) + 1;
          }
        }
      });

      const topArtists = Object.entries(artistCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, plays]) => ({ name, plays }));

      const totalGenrePlays = Object.values(genreCounts).reduce((a, b) => a + b, 0) || 1;
      const topGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([name, count]) => ({ 
          name, 
          percentage: Math.round((count / totalGenrePlays) * 100) 
        }));

      // Determine personality based on listening patterns
      const uniqueArtists = Object.keys(artistCounts).length;
      const uniqueGenres = Object.keys(genreCounts).length;
      
      let personality = personalityTypes[0];
      if (uniqueGenres > 5) personality = personalityTypes[3]; // Eclectic
      else if (uniqueArtists < 10 && topArtists.length > 0) personality = personalityTypes[2]; // Devotee
      else if (topGenres.length > 0 && topGenres[0].percentage > 60) personality = personalityTypes[1]; // Curator

      setTaste({
        topArtists: topArtists.length > 0 ? topArtists : [{ name: 'Discover more', plays: 0 }],
        topGenres: topGenres.length > 0 ? topGenres : [{ name: 'All genres', percentage: 100 }],
        recentMood: 'Vibing',
        musicPersonality: personality.name
      });
    } catch (error) {
      console.error('Error loading taste data:', error);
    } finally {
      setLoading(false);
    }
  };

  const personality = personalityTypes.find(p => p.name === taste.musicPersonality) || personalityTypes[0];

  if (loading) {
    return (
      <div className={cn("rounded-2xl bg-gradient-to-br from-purple-900/50 to-cyan-900/50 p-6", className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-1/3" />
          <div className="h-20 bg-white/5 rounded-xl" />
          <div className="h-16 bg-white/5 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl bg-gradient-to-br from-purple-900/40 to-cyan-900/40 border border-white/10 overflow-hidden", className)}>
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            Music DNA
          </h3>
          <span className="text-2xl">{personality.icon}</span>
        </div>

        {/* Personality Badge */}
        <div className="bg-white/10 rounded-xl p-4 mb-4">
          <p className="text-sm text-white/60 mb-1">Your Music Personality</p>
          <p className="text-2xl font-black text-cyan-400">{personality.name}</p>
          <p className="text-sm text-white/50 mt-1">{personality.description}</p>
        </div>
      </div>

      {/* Top Artists */}
      <div className="px-6 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <Mic2 className="w-4 h-4 text-white/50" />
          <span className="text-sm font-medium text-white/70">Top Artists</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {taste.topArtists.slice(0, 4).map((artist, idx) => (
            <div 
              key={artist.name}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium",
                idx === 0 
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" 
                  : "bg-white/10 text-white/70"
              )}
            >
              {artist.name}
            </div>
          ))}
        </div>
      </div>

      {/* Genre Breakdown */}
      <div className="px-6 pb-6">
        <div className="flex items-center gap-2 mb-3">
          <Disc className="w-4 h-4 text-white/50" />
          <span className="text-sm font-medium text-white/70">Genre Mix</span>
        </div>
        <div className="space-y-2">
          {taste.topGenres.map((genre, idx) => (
            <div key={genre.name} className="flex items-center gap-3">
              <span className="text-xs text-white/50 w-20 truncate">{genre.name}</span>
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all",
                    idx === 0 ? "bg-gradient-to-r from-cyan-500 to-purple-500" :
                    idx === 1 ? "bg-purple-500" :
                    idx === 2 ? "bg-pink-500" : "bg-white/30"
                  )}
                  style={{ width: `${genre.percentage}%` }}
                />
              </div>
              <span className="text-xs text-white/40 w-10 text-right">{genre.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
