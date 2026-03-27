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
    <div className={cn("flex gap-4 overflow-x-auto pb-2 scrollbar-hide", className)}>
      {fans.map((fan) => {
        const avatarUrl = getAvatarUrl(fan.profile_image_path);
        return (
          <div
            key={fan.id}
            className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0"
            style={{ width: 90 }}
            onClick={() => navigate(`/fan/${fan.user_id}`)}
          >
            {/* Glow ring - fan portal style */}
            <div
              className="relative flex items-center justify-center"
              style={{
                width: 72 + 8,
                height: 72 + 8,
                borderRadius: "50%",
                background: `linear-gradient(135deg, #FF6347, #8B5CF6)`,
                padding: 3,
              }}
            >
              <div
                className="rounded-full overflow-hidden flex items-center justify-center"
                style={{
                  width: 72,
                  height: 72,
                  background: "hsl(var(--background))",
                }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fan.display_name}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-600 to-purple-600 text-white text-xl font-bold">
                    {fan.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <span
              className="font-body truncate text-center w-full"
              style={{ fontSize: 11, fontWeight: 600, color: "var(--text-2, rgba(255,255,255,0.7))" }}
            >
              {fan.display_name}
            </span>
            {currentUser && currentUser !== fan.user_id && (
              <Button
                variant={fan.isFollowing ? "secondary" : "default"}
                size="sm"
                className={cn(
                  "rounded-full text-xs h-7 px-3",
                  fan.isFollowing 
                    ? "bg-white/10 hover:bg-white/20" 
                    : "bg-cyan-500 hover:bg-cyan-400 text-black"
                )}
                onClick={(e) => { e.stopPropagation(); toggleFollow(fan.user_id); }}
              >
                {fan.isFollowing ? "Following" : "Follow"}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
