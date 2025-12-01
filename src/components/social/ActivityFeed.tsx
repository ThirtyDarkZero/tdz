import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Heart, 
  MessageCircle, 
  ListMusic, 
  UserPlus, 
  Play, 
  Share2,
  Music,
  Loader2
} from 'lucide-react';
import { useSocialData, Activity } from '@/hooks/useSocialData';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ActivityFeedProps {
  variant?: 'full' | 'compact' | 'sidebar';
  className?: string;
  maxItems?: number;
}

export function ActivityFeed({ variant = 'full', className, maxItems = 20 }: ActivityFeedProps) {
  const { activities, loading } = useSocialData();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'liked_track':
      case 'liked_playlist':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'commented':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'created_playlist':
      case 'added_to_playlist':
        return <ListMusic className="w-4 h-4 text-green-500" />;
      case 'followed_artist':
      case 'followed_fan':
        return <UserPlus className="w-4 h-4 text-purple-500" />;
      case 'listened':
        return <Play className="w-4 h-4 text-primary" />;
      case 'shared':
        return <Share2 className="w-4 h-4 text-orange-500" />;
      case 'posted':
        return <Music className="w-4 h-4 text-primary" />;
      default:
        return <Music className="w-4 h-4 text-primary" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    const metadata = activity.metadata as any;
    switch (activity.activity_type) {
      case 'liked_track':
        return `liked a track${metadata?.track_title ? `: "${metadata.track_title}"` : ''}`;
      case 'liked_playlist':
        return `liked a playlist${metadata?.playlist_name ? `: "${metadata.playlist_name}"` : ''}`;
      case 'commented':
        return `commented on ${activity.target_type || 'content'}`;
      case 'created_playlist':
        return `created a new playlist${metadata?.playlist_name ? `: "${metadata.playlist_name}"` : ''}`;
      case 'added_to_playlist':
        return `added a track to playlist`;
      case 'followed_artist':
        return `followed an artist${metadata?.artist_name ? `: ${metadata.artist_name}` : ''}`;
      case 'followed_fan':
        return `followed a fan`;
      case 'listened':
        return `played a track${metadata?.track_title ? `: "${metadata.track_title}"` : ''}`;
      case 'shared':
        return `shared ${activity.target_type || 'content'}`;
      case 'posted':
        return `shared something new`;
      default:
        return 'was active';
    }
  };

  const getAvatarUrl = (path: string | null | undefined) => {
    if (!path) return null;
    return supabase.storage.from('listener-images').getPublicUrl(path).data.publicUrl;
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

  const displayActivities = activities.slice(0, maxItems);

  if (variant === 'sidebar') {
    return (
      <div className={cn("space-y-1", className)}>
        {displayActivities.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No recent activity</p>
        ) : (
          displayActivities.slice(0, 10).map((activity) => (
            <div 
              key={activity.id}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="relative">
                <Avatar className="w-7 h-7">
                  <AvatarImage src={getAvatarUrl(activity.user?.profile_image_path)} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {activity.user?.display_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-background flex items-center justify-center">
                  {getActivityIcon(activity.activity_type)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs truncate">
                  <span className="font-medium">{activity.user?.display_name || 'User'}</span>
                  {' '}
                  <span className="text-muted-foreground">{getActivityText(activity)}</span>
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <Card className={cn("bg-card/50 backdrop-blur-sm border-border/50", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Play className="w-5 h-5 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className={variant === 'compact' ? "h-[300px]" : "h-[500px]"}>
          <div className="space-y-3 pr-4">
            {displayActivities.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No recent activity</p>
            ) : (
              displayActivities.map((activity) => (
                <div 
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-accent/20 hover:bg-accent/30 transition-colors"
                >
                  <div className="relative">
                    <Avatar className="w-10 h-10 ring-2 ring-primary/10">
                      <AvatarImage src={getAvatarUrl(activity.user?.profile_image_path)} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {activity.user?.display_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background flex items-center justify-center border border-border">
                      {getActivityIcon(activity.activity_type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user?.display_name || 'User'}</span>
                      {' '}
                      <span className="text-muted-foreground">{getActivityText(activity)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
