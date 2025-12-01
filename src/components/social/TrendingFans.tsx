import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Trophy, Star, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface TrendingFansProps {
  className?: string;
  variant?: 'card' | 'list';
}

interface FanWithEngagement {
  user_id: string;
  xp_total: number;
  level: number;
  playlists_created: number;
  comments_made: number;
  followers_count: number;
  profile?: {
    display_name: string;
    profile_image_path: string | null;
    bio: string | null;
  };
  badges?: string[];
}

export function TrendingFans({ className, variant = 'card' }: TrendingFansProps) {
  const [fans, setFans] = useState<FanWithEngagement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrendingFans();
  }, []);

  const loadTrendingFans = async () => {
    const { data: engagementData } = await supabase
      .from('fan_engagement')
      .select('*')
      .order('xp_total', { ascending: false })
      .limit(10);

    if (engagementData) {
      const userIds = engagementData.map(e => e.user_id);
      
      const { data: profiles } = await supabase
        .from('listener_profiles')
        .select('user_id, display_name, profile_image_path, bio')
        .in('user_id', userIds);

      const { data: badges } = await supabase
        .from('fan_badges')
        .select('user_id, badge_type')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const badgeMap = new Map<string, string[]>();
      badges?.forEach(b => {
        if (!badgeMap.has(b.user_id)) badgeMap.set(b.user_id, []);
        badgeMap.get(b.user_id)!.push(b.badge_type);
      });

      const fansWithProfiles = engagementData.map(e => ({
        ...e,
        profile: profileMap.get(e.user_id),
        badges: badgeMap.get(e.user_id) || []
      }));

      setFans(fansWithProfiles);
    }
    setLoading(false);
  };

  const getAvatarUrl = (path: string | null | undefined) => {
    if (!path) return null;
    return supabase.storage.from('listener-images').getPublicUrl(path).data.publicUrl;
  };

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'curator':
      case 'playlist_master':
        return <Star className="w-3 h-3" />;
      case 'top_commenter':
      case 'social_butterfly':
        return <Sparkles className="w-3 h-3" />;
      case 'super_fan':
        return <Trophy className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getLevelColor = (level: number) => {
    if (level >= 10) return 'text-yellow-500';
    if (level >= 5) return 'text-purple-500';
    if (level >= 3) return 'text-blue-500';
    return 'text-muted-foreground';
  };

  if (loading) {
    return (
      <Card className={cn("bg-card/50 backdrop-blur-sm", className)}>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn("space-y-2", className)}>
        {fans.map((fan, index) => (
          <div
            key={fan.user_id}
            className="flex items-center gap-3 p-3 rounded-lg bg-card/50 hover:bg-card/80 transition-colors cursor-pointer"
          >
            <span className="text-sm font-bold text-muted-foreground w-5">
              #{index + 1}
            </span>
            <Avatar className="w-10 h-10 ring-2 ring-primary/20">
              <AvatarImage src={getAvatarUrl(fan.profile?.profile_image_path)} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {fan.profile?.display_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">
                  {fan.profile?.display_name || 'Music Fan'}
                </span>
                <Badge variant="outline" className={cn("text-xs", getLevelColor(fan.level))}>
                  Lvl {fan.level}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {fan.badges.slice(0, 3).map((badge) => (
                  <Badge 
                    key={badge} 
                    variant="secondary" 
                    className="text-[10px] h-4 px-1.5 capitalize"
                  >
                    {getBadgeIcon(badge)}
                    <span className="ml-0.5">{badge.replace('_', ' ')}</span>
                  </Badge>
                ))}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-primary">{fan.xp_total} XP</p>
              <p className="text-xs text-muted-foreground">{fan.followers_count} followers</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card className={cn("bg-card/50 backdrop-blur-sm border-border/50", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Top Fans This Week
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fans.slice(0, 6).map((fan, index) => (
            <div
              key={fan.user_id}
              className="relative p-4 rounded-xl bg-gradient-to-br from-accent/50 to-accent/20 border border-border/50 hover:border-primary/30 transition-all cursor-pointer group"
            >
              {/* Rank Badge */}
              {index < 3 && (
                <div className={cn(
                  "absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                  index === 0 && "bg-yellow-500 text-yellow-950",
                  index === 1 && "bg-gray-300 text-gray-950",
                  index === 2 && "bg-amber-600 text-amber-950"
                )}>
                  #{index + 1}
                </div>
              )}

              <div className="flex flex-col items-center text-center">
                <Avatar className="w-16 h-16 ring-4 ring-primary/20 group-hover:ring-primary/40 transition-all">
                  <AvatarImage src={getAvatarUrl(fan.profile?.profile_image_path)} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xl">
                    {fan.profile?.display_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="mt-3">
                  <h4 className="font-semibold truncate max-w-[150px]">
                    {fan.profile?.display_name || 'Music Fan'}
                  </h4>
                  <Badge 
                    variant="outline" 
                    className={cn("mt-1 text-xs", getLevelColor(fan.level))}
                  >
                    Level {fan.level}
                  </Badge>
                </div>

                <div className="flex flex-wrap justify-center gap-1 mt-2">
                  {fan.badges.slice(0, 2).map((badge) => (
                    <Badge 
                      key={badge} 
                      variant="secondary" 
                      className="text-[10px] capitalize"
                    >
                      {badge.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span>{fan.playlists_created} playlists</span>
                  <span>{fan.followers_count} followers</span>
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3 w-full text-xs h-8"
                >
                  <Users className="w-3 h-3 mr-1" />
                  Follow
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
