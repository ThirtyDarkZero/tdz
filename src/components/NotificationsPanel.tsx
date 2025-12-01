import { useState, useEffect } from "react";
import { Bell, Heart, UserPlus, Music, Play, MessageSquare, X, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: 'like' | 'follow' | 'comment' | 'play_milestone' | 'track_published' | 'presave';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  metadata?: {
    track_id?: string;
    track_title?: string;
    user_name?: string;
    milestone?: number;
  };
}

export const NotificationsPanel = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
      // Subscribe to realtime notifications
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setNotifications(prev => [payload.new as Notification, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    // For now, generate mock notifications based on recent activity
    // In production, this would come from a notifications table
    const mockNotifications: Notification[] = [];

    // Get recent likes on user's tracks
    const { data: recentLikes } = await supabase
      .from("track_likes")
      .select(`
        id,
        created_at,
        track:tracks!inner(id, title, user_id)
      `)
      .eq("tracks.user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (recentLikes) {
      recentLikes.forEach((like: any) => {
        mockNotifications.push({
          id: like.id,
          type: 'like',
          title: 'New Like',
          message: `Someone liked "${like.track?.title}"`,
          read: false,
          created_at: like.created_at,
          metadata: {
            track_id: like.track?.id,
            track_title: like.track?.title,
          }
        });
      });
    }

    // Get recent followers
    const { data: recentFollows } = await supabase
      .from("artist_follows")
      .select(`
        id,
        created_at,
        follower_id
      `)
      .eq("artist_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (recentFollows) {
      recentFollows.forEach((follow: any) => {
        mockNotifications.push({
          id: follow.id,
          type: 'follow',
          title: 'New Follower',
          message: 'Someone started following you',
          read: false,
          created_at: follow.created_at,
        });
      });
    }

    // Get recent presaves
    const { data: recentPresaves } = await supabase
      .from("track_presaves")
      .select(`
        id,
        presaved_at,
        track:tracks!inner(id, title, user_id)
      `)
      .eq("artist_id", user.id)
      .order("presaved_at", { ascending: false })
      .limit(5);

    if (recentPresaves) {
      recentPresaves.forEach((presave: any) => {
        mockNotifications.push({
          id: presave.id,
          type: 'presave',
          title: 'New Pre-save',
          message: `Someone pre-saved "${presave.track?.title}"`,
          read: false,
          created_at: presave.presaved_at,
          metadata: {
            track_id: presave.track?.id,
            track_title: presave.track?.title,
          }
        });
      });
    }

    // Sort by date
    mockNotifications.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="w-4 h-4 text-red-500" />;
      case 'follow': return <UserPlus className="w-4 h-4 text-primary" />;
      case 'comment': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'play_milestone': return <Play className="w-4 h-4 text-green-500" />;
      case 'track_published': return <Music className="w-4 h-4 text-primary" />;
      case 'presave': return <Bell className="w-4 h-4 text-yellow-500" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
              <CheckCheck className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
              <p className="text-xs mt-1">We'll notify you when something happens</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-accent/50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};