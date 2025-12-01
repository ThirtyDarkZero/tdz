import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Users, 
  ListMusic, 
  MessageCircle, 
  Sparkles,
  Play,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useSocialData } from '@/hooks/useSocialData';
import { ActivityFeed } from './ActivityFeed';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface SocialSidebarProps {
  className?: string;
}

export function SocialSidebar({ className }: SocialSidebarProps) {
  const { trendingPlaylists, loading } = useSocialData();
  const [topCurators, setTopCurators] = useState<any[]>([]);
  const [recentComments, setRecentComments] = useState<any[]>([]);

  useEffect(() => {
    loadTopCurators();
    loadRecentComments();
  }, []);

  const loadTopCurators = async () => {
    const { data } = await supabase
      .from('fan_engagement')
      .select('user_id, playlists_created, followers_count')
      .order('playlists_created', { ascending: false })
      .limit(5);

    if (data) {
      const userIds = data.map(d => d.user_id);
      const { data: profiles } = await supabase
        .from('listener_profiles')
        .select('user_id, display_name, profile_image_path')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      setTopCurators(data.map(d => ({
        ...d,
        profile: profileMap.get(d.user_id)
      })));
    }
  };

  const loadRecentComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) {
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('listener_profiles')
        .select('user_id, display_name, profile_image_path')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      setRecentComments(data.map(c => ({
        ...c,
        user: profileMap.get(c.user_id)
      })));
    }
  };

  const getAvatarUrl = (path: string | null | undefined) => {
    if (!path) return null;
    return supabase.storage.from('listener-images').getPublicUrl(path).data.publicUrl;
  };

  const getPlaylistCoverUrl = (path: string | null | undefined) => {
    if (!path) return null;
    return supabase.storage.from('album-covers').getPublicUrl(path).data.publicUrl;
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="space-y-4 pr-2 pb-4">
        {/* Trending Playlists */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Trending Playlists
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {trendingPlaylists.slice(0, 5).map((playlist, index) => (
              <div 
                key={playlist.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
              >
                <span className="text-xs font-bold text-muted-foreground w-4">
                  {index + 1}
                </span>
                <div className="w-10 h-10 rounded bg-primary/20 overflow-hidden flex-shrink-0">
                  {playlist.cover_image_path ? (
                    <img 
                      src={getPlaylistCoverUrl(playlist.cover_image_path)} 
                      alt="" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ListMusic className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  {playlist.playlist_motion_covers?.[0] && (
                    <Badge className="absolute bottom-0.5 right-0.5 text-[8px] h-4 px-1">
                      <Sparkles className="w-2 h-2 mr-0.5" />
                      Motion
                    </Badge>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{playlist.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Play className="w-3 h-3" />
                    {playlist.play_count || 0} plays
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Curators */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Top Curators
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topCurators.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">No curators yet</p>
            ) : (
              topCurators.map((curator, index) => (
                <div 
                  key={curator.user_id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <span className="text-xs font-bold text-muted-foreground w-4">
                    {index + 1}
                  </span>
                  <Avatar className="w-8 h-8 ring-2 ring-primary/20">
                    <AvatarImage src={getAvatarUrl(curator.profile?.profile_image_path)} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {curator.profile?.display_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {curator.profile?.display_name || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {curator.playlists_created} playlists
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    Follow
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Separator className="bg-border/50" />

        {/* Recent Comments */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              Recent Discussions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentComments.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">No comments yet</p>
            ) : (
              recentComments.map((comment) => (
                <div 
                  key={comment.id}
                  className="flex items-start gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={getAvatarUrl(comment.user?.profile_image_path)} />
                    <AvatarFallback className="bg-primary/20 text-primary text-[10px]">
                      {comment.user?.display_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs">
                      <span className="font-medium">{comment.user?.display_name || 'User'}</span>
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Separator className="bg-border/50" />

        {/* Activity Feed */}
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 px-1">
            <Sparkles className="w-4 h-4 text-primary" />
            Live Activity
          </h3>
          <ActivityFeed variant="sidebar" />
        </div>
      </div>
    </ScrollArea>
  );
}
