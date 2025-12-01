import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  UserPlus, 
  ListMusic, 
  Share2,
  AtSign,
  Music,
  Check,
  Settings
} from 'lucide-react';
import { useNotifications } from '@/hooks/useSocialData';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export function NotificationsPanelEnhanced() {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
      case 'playlist_like':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'comment':
      case 'reply':
      case 'playlist_comment':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'follow':
      case 'new_follower':
        return <UserPlus className="w-4 h-4 text-green-500" />;
      case 'mention':
        return <AtSign className="w-4 h-4 text-purple-500" />;
      case 'share':
        return <Share2 className="w-4 h-4 text-orange-500" />;
      case 'playlist_add':
      case 'track_added_to_playlist':
        return <ListMusic className="w-4 h-4 text-primary" />;
      case 'artist_release':
        return <Music className="w-4 h-4 text-primary" />;
      default:
        return <Bell className="w-4 h-4 text-primary" />;
    }
  };

  const getNotificationText = (notification: any) => {
    switch (notification.notification_type) {
      case 'like':
        return 'liked your post';
      case 'playlist_like':
        return 'liked your playlist';
      case 'comment':
        return 'commented on your post';
      case 'reply':
        return 'replied to your comment';
      case 'playlist_comment':
        return 'commented on your playlist';
      case 'follow':
      case 'new_follower':
        return 'started following you';
      case 'mention':
        return 'mentioned you';
      case 'share':
        return 'shared your content';
      case 'playlist_add':
        return 'added your track to a playlist';
      case 'track_added_to_playlist':
        return 'added a track to your playlist';
      case 'artist_release':
        return 'released new music';
      default:
        return notification.message || 'interacted with you';
    }
  };

  const getAvatarUrl = (actorId: string | null) => {
    // This would need to be enhanced to fetch actor profile
    return null;
  };

  const handleMarkAllRead = () => {
    markAsRead();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-red-500 border-2 border-background"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0 bg-card/95 backdrop-blur-xl border-border/50" 
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleMarkAllRead}
                className="text-xs h-7"
              >
                <Check className="w-3 h-3 mr-1" />
                Mark all read
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                When someone interacts with you, you'll see it here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 p-4 hover:bg-accent/50 transition-colors cursor-pointer",
                    !notification.is_read && "bg-primary/5"
                  )}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={getAvatarUrl(notification.actor_id)} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        U
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background flex items-center justify-center border border-border">
                      {getNotificationIcon(notification.notification_type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">Someone</span>
                      {' '}
                      <span className="text-muted-foreground">
                        {getNotificationText(notification)}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <Separator className="bg-border/50" />
        <div className="p-2">
          <Button variant="ghost" className="w-full text-sm h-9">
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
