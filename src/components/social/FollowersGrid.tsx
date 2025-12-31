import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, UserCheck, Users } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Fan {
  id: string;
  user_id: string;
  display_name: string;
  profile_image_path: string | null;
  bio: string | null;
  isFollowing?: boolean;
}

interface FollowersGridProps {
  userId: string;
  type: 'followers' | 'following';
  isOwnProfile?: boolean;
  className?: string;
}

export function FollowersGrid({ userId, type, isOwnProfile = false, className }: FollowersGridProps) {
  const navigate = useNavigate();
  const [fans, setFans] = useState<Fan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentUser();
    loadFans();
  }, [userId, type]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user?.id || null);
  };

  const loadFans = async () => {
    try {
      let userIds: string[] = [];

      if (type === 'followers') {
        const { data } = await supabase
          .from('fan_follows')
          .select('follower_id')
          .eq('following_id', userId);
        userIds = data?.map(f => f.follower_id) || [];
      } else {
        const { data } = await supabase
          .from('fan_follows')
          .select('following_id')
          .eq('follower_id', userId);
        userIds = data?.map(f => f.following_id) || [];
      }

      if (userIds.length === 0) {
        setFans([]);
        setLoading(false);
        return;
      }

      // Get profiles for these users
      const { data: profiles } = await supabase
        .from('listener_profiles')
        .select('*')
        .in('user_id', userIds)
        .limit(20);

      // Check which ones the current user follows
      const { data: { user } } = await supabase.auth.getUser();
      let followingSet = new Set<string>();

      if (user) {
        const { data: following } = await supabase
          .from('fan_follows')
          .select('following_id')
          .eq('follower_id', user.id);
        followingSet = new Set(following?.map(f => f.following_id) || []);
      }

      const fansData: Fan[] = (profiles || []).map(p => ({
        id: p.id,
        user_id: p.user_id,
        display_name: p.display_name,
        profile_image_path: p.profile_image_path,
        bio: p.bio,
        isFollowing: followingSet.has(p.user_id)
      }));

      setFans(fansData);
    } catch (error) {
      console.error('Error loading fans:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async (fanUserId: string) => {
    if (!currentUser) {
      toast.error('Please sign in to follow');
      return;
    }

    const fan = fans.find(f => f.user_id === fanUserId);
    if (!fan) return;

    try {
      if (fan.isFollowing) {
        await supabase
          .from('fan_follows')
          .delete()
          .eq('follower_id', currentUser)
          .eq('following_id', fanUserId);
      } else {
        await supabase
          .from('fan_follows')
          .insert({ follower_id: currentUser, following_id: fanUserId });
      }

      setFans(fans.map(f => 
        f.user_id === fanUserId 
          ? { ...f, isFollowing: !f.isFollowing }
          : f
      ));

      toast.success(fan.isFollowing ? 'Unfollowed' : 'Following');
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Failed to update follow');
    }
  };

  const getAvatarUrl = (path: string | null) => {
    if (!path) return null;
    return supabase.storage.from('listener-images').getPublicUrl(path).data.publicUrl;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (fans.length === 0) {
    return (
      <div className="text-center py-8 text-white/50">
        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">
          {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
        </p>
        {isOwnProfile && type === 'following' && (
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4 border-white/20"
            onClick={() => navigate('/discover')}
          >
            Find Music Fans
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4", className)}>
      {fans.map((fan) => (
        <div
          key={fan.id}
          className="flex flex-col items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
        >
          <Avatar 
            className="w-16 h-16 mb-3 ring-2 ring-white/10 group-hover:ring-cyan-500/50 transition-all cursor-pointer"
            onClick={() => navigate(`/fan/${fan.user_id}`)}
          >
            <AvatarImage src={getAvatarUrl(fan.profile_image_path) || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-cyan-600 to-purple-600 text-white text-xl">
              {fan.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <p 
            className="font-medium text-sm text-center truncate w-full cursor-pointer hover:text-cyan-400 transition-colors"
            onClick={() => navigate(`/fan/${fan.user_id}`)}
          >
            {fan.display_name}
          </p>
          
          {fan.bio && (
            <p className="text-xs text-white/40 text-center line-clamp-1 mt-1">
              {fan.bio}
            </p>
          )}

          {currentUser && currentUser !== fan.user_id && (
            <Button
              variant={fan.isFollowing ? "secondary" : "default"}
              size="sm"
              className={cn(
                "mt-3 rounded-full text-xs h-8",
                fan.isFollowing 
                  ? "bg-white/10 hover:bg-white/20" 
                  : "bg-cyan-500 hover:bg-cyan-400 text-black"
              )}
              onClick={() => toggleFollow(fan.user_id)}
            >
              {fan.isFollowing ? (
                <>
                  <UserCheck className="w-3 h-3 mr-1" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="w-3 h-3 mr-1" />
                  Follow
                </>
              )}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
