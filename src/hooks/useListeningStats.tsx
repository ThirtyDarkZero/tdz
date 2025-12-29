import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ListeningStats {
  totalListeningTime: number; // in seconds
  tracksPlayed: number;
  uniqueArtists: number;
  topGenres: { genre: string; count: number }[];
  recentTracks: { trackId: string; title: string; artistName: string; playedAt: string }[];
  dailyListeningTime: { date: string; seconds: number }[];
  streakDays: number;
  lastListenedAt: string | null;
}

interface UseListeningStatsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

/**
 * Hook to track and retrieve user listening statistics
 * Inspired by PHP music platform analytics patterns
 */
export function useListeningStats(options: UseListeningStatsOptions = {}) {
  const { autoRefresh = false, refreshInterval = 60000 } = options;
  const { user } = useAuth();
  
  const [stats, setStats] = useState<ListeningStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!user) {
      setStats(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch listening history for the user
      const { data: history, error: historyError } = await supabase
        .from('listening_history')
        .select(`
          id,
          track_id,
          play_duration,
          played_at,
          tracks (
            id,
            title,
            artist_name,
            genre
          )
        `)
        .eq('user_id', user.id)
        .order('played_at', { ascending: false })
        .limit(1000);

      if (historyError) throw historyError;

      if (!history || history.length === 0) {
        setStats({
          totalListeningTime: 0,
          tracksPlayed: 0,
          uniqueArtists: 0,
          topGenres: [],
          recentTracks: [],
          dailyListeningTime: [],
          streakDays: 0,
          lastListenedAt: null,
        });
        return;
      }

      // Calculate total listening time
      const totalListeningTime = history.reduce((sum, h) => sum + (h.play_duration || 0), 0);

      // Get unique artists
      const artistSet = new Set<string>();
      const genreCount: Record<string, number> = {};

      history.forEach(h => {
        const track = h.tracks as { artist_name?: string; genre?: string } | null;
        if (track?.artist_name) artistSet.add(track.artist_name);
        if (track?.genre) {
          genreCount[track.genre] = (genreCount[track.genre] || 0) + 1;
        }
      });

      // Top genres
      const topGenres = Object.entries(genreCount)
        .map(([genre, count]) => ({ genre, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Recent tracks
      const recentTracks = history.slice(0, 10).map(h => {
        const track = h.tracks as { id?: string; title?: string; artist_name?: string } | null;
        return {
          trackId: h.track_id,
          title: track?.title || 'Unknown',
          artistName: track?.artist_name || 'Unknown',
          playedAt: h.played_at,
        };
      });

      // Calculate daily listening time (last 7 days)
      const dailyMap: Record<string, number> = {};
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      history.forEach(h => {
        const date = new Date(h.played_at);
        if (date >= sevenDaysAgo) {
          const dateStr = date.toISOString().split('T')[0];
          dailyMap[dateStr] = (dailyMap[dateStr] || 0) + (h.play_duration || 0);
        }
      });

      const dailyListeningTime = Object.entries(dailyMap)
        .map(([date, seconds]) => ({ date, seconds }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate streak (consecutive days with listening)
      let streakDays = 0;
      const today = new Date().toISOString().split('T')[0];
      let checkDate = new Date();

      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (dailyMap[dateStr]) {
          streakDays++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
        if (streakDays > 365) break; // Safety limit
      }

      setStats({
        totalListeningTime,
        tracksPlayed: history.length,
        uniqueArtists: artistSet.size,
        topGenres,
        recentTracks,
        dailyListeningTime,
        streakDays,
        lastListenedAt: history[0]?.played_at || null,
      });

    } catch (err) {
      console.error('Error fetching listening stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchStats, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchStats]);

  // Format time helper
  const formatListeningTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }, []);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
    formatListeningTime,
  };
}
