import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Play, Music, ListMusic, Share2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface Activity {
  id: string;
  type: 'like' | 'listen' | 'playlist_create' | 'follow' | 'comment' | 'share';
  content: string;
  timestamp: string;
  metadata?: any;
}

interface ProfileActivityFeedProps {
  userId: string;
  isOwnProfile?: boolean;
  limit?: number;
}

export function ProfileActivityFeed({ userId, isOwnProfile = false, limit = 20 }: ProfileActivityFeedProps) {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [userId]);

  const loadActivities = async () => {
    try {
      // Fetch from activity_log table
      const { data: activityData } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Also fetch listening history for play activities
      const { data: listenData } = await supabase
        .from('listening_history')
        .select(`
          id, played_at, track_id,
          tracks:track_id (id, title, artist_name)
        `)
        .eq('user_id', userId)
        .order('played_at', { ascending: false })
        .limit(10);

      // Fetch recent likes
      const { data: likesData } = await supabase
        .from('track_likes')
        .select(`
          id, created_at, track_id,
          tracks:track_id (id, title, artist_name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      const combined: Activity[] = [];

      // Add activity log entries
      if (activityData) {
        activityData.forEach(a => {
          combined.push({
            id: a.id,
            type: a.activity_type as any,
            content: getActivityContent(a.activity_type, a.metadata),
            timestamp: a.created_at,
            metadata: a.metadata
          });
        });
      }

      // Add listening activities
      if (listenData) {
        listenData.filter(l => l.tracks).forEach(l => {
          combined.push({
            id: `listen-${l.id}`,
            type: 'listen',
            content: `Listened to "${(l.tracks as any).title}" by ${(l.tracks as any).artist_name}`,
            timestamp: l.played_at,
            metadata: { track: l.tracks, track_id: l.track_id }
          });
        });
      }

      // Add like activities
      if (likesData) {
        likesData.filter(l => l.tracks).forEach(l => {
          combined.push({
            id: `like-${l.id}`,
            type: 'like',
            content: `Liked "${(l.tracks as any).title}" by ${(l.tracks as any).artist_name}`,
            timestamp: l.created_at,
            metadata: { track: l.tracks, track_id: l.track_id }
          });
        });
      }

      // Sort by timestamp and dedupe
      combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // Dedupe by keeping first occurrence
      const seen = new Set();
      const deduped = combined.filter(a => {
        const key = `${a.type}-${a.content}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setActivities(deduped.slice(0, limit));
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityContent = (type: string, metadata: any) => {
    switch (type) {
      case 'playlist_create':
        return `Created playlist "${metadata?.playlist_name || 'Untitled'}"`;
      case 'follow':
        return `Started following ${metadata?.artist_name || 'an artist'}`;
      case 'comment':
        return `Commented on a track`;
      case 'share':
        return `Shared music with the community`;
      default:
        return 'Activity';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-pink-500" fill="currentColor" />;
      case 'listen':
        return <Play className="w-4 h-4 text-cyan-400" fill="currentColor" />;
      case 'playlist_create':
        return <ListMusic className="w-4 h-4 text-purple-400" />;
      case 'follow':
        return <Music className="w-4 h-4 text-green-400" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-blue-400" />;
      case 'share':
        return <Share2 className="w-4 h-4 text-orange-400" />;
      default:
        return <Music className="w-4 h-4 text-white/50" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-white/50">
        <Music className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No recent activity</p>
        {isOwnProfile && (
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4 border-white/20"
            onClick={() => navigate('/discover')}
          >
            Start Exploring
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((activity) => (
        <div
          key={activity.id}
          onClick={() => {
            if (activity.metadata?.track_id) {
              navigate(`/track/${activity.metadata.track_id}`);
            }
          }}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            {getActivityIcon(activity.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white/80 truncate group-hover:text-white transition-colors">
              {activity.content}
            </p>
            <p className="text-xs text-white/40">
              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
