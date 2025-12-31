import { useState, useEffect } from 'react';
import { Heart, Clock, Music, Users, ListMusic, Flame, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ProfileStatsProps {
  userId: string;
  className?: string;
}

interface Stats {
  totalListeningTime: number;
  totalLikes: number;
  totalPlaylists: number;
  followingArtists: number;
  followingFans: number;
  followers: number;
  streakDays: number;
  topGenre: string;
}

export function ProfileStats({ userId, className }: ProfileStatsProps) {
  const [stats, setStats] = useState<Stats>({
    totalListeningTime: 0,
    totalLikes: 0,
    totalPlaylists: 0,
    followingArtists: 0,
    followingFans: 0,
    followers: 0,
    streakDays: 0,
    topGenre: 'Music'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    try {
      // Get listening time
      const { data: historyData } = await supabase
        .from('listening_history')
        .select('play_duration')
        .eq('user_id', userId);

      const totalMinutes = historyData?.reduce((sum, h) => sum + (h.play_duration || 0), 0) || 0;

      // Get likes count
      const { count: likesCount } = await supabase
        .from('track_likes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get playlists count
      const { count: playlistsCount } = await supabase
        .from('playlists')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get following artists count
      const { count: artistFollowsCount } = await supabase
        .from('artist_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      // Get fan follows (following)
      const { count: fanFollowingCount } = await supabase
        .from('fan_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      // Get fan followers
      const { count: fanFollowersCount } = await supabase
        .from('fan_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      // Get engagement data for streak
      const { data: engagementData } = await supabase
        .from('fan_engagement')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      setStats({
        totalListeningTime: Math.round(totalMinutes / 60), // Convert to hours
        totalLikes: likesCount || 0,
        totalPlaylists: playlistsCount || 0,
        followingArtists: artistFollowsCount || 0,
        followingFans: fanFollowingCount || 0,
        followers: fanFollowersCount || 0,
        streakDays: engagementData?.level || 0,
        topGenre: 'Electronic' // Could be computed from listening history
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (hours: number) => {
    if (hours < 1) return '<1h';
    if (hours >= 1000) return `${(hours / 1000).toFixed(1)}k hrs`;
    return `${hours}h`;
  };

  const statItems = [
    { icon: Clock, label: 'Listening', value: formatTime(stats.totalListeningTime), color: 'text-cyan-400' },
    { icon: Heart, label: 'Liked', value: stats.totalLikes.toString(), color: 'text-pink-500' },
    { icon: ListMusic, label: 'Playlists', value: stats.totalPlaylists.toString(), color: 'text-purple-400' },
    { icon: Users, label: 'Following', value: (stats.followingArtists + stats.followingFans).toString(), color: 'text-green-400' },
    { icon: TrendingUp, label: 'Followers', value: stats.followers.toString(), color: 'text-orange-400' },
    { icon: Flame, label: 'Level', value: stats.streakDays.toString(), color: 'text-yellow-400' },
  ];

  if (loading) {
    return (
      <div className={cn("grid grid-cols-3 sm:grid-cols-6 gap-4", className)}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-3 sm:grid-cols-6 gap-3", className)}>
      {statItems.map((item) => (
        <div
          key={item.label}
          className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-default"
        >
          <item.icon className={cn("w-5 h-5 mb-2", item.color)} />
          <span className="text-xl sm:text-2xl font-black text-white">{item.value}</span>
          <span className="text-xs text-white/50 mt-1">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
