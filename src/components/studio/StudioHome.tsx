import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Music, TrendingUp, Users, Play, Clock, 
  ArrowRight, Wallet, Bell, CheckCircle2, AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";
import { format } from "date-fns";

interface StudioHomeProps {
  artistName: string;
  onNavigate: (section: string) => void;
  onUploadClick: () => void;
}

export const StudioHome = ({ artistName, onNavigate, onUploadClick }: StudioHomeProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStreams: 0,
    totalTracks: 0,
    pendingEarnings: 0,
    followers: 0
  });
  const [recentReleases, setRecentReleases] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadStats();
      loadRecentReleases();
      loadNotifications();
    }
  }, [user]);

  const loadStats = async () => {
    if (!user) return;
    
    const [profileRes, tracksRes, earningsRes] = await Promise.all([
      supabase.from("artist_profiles").select("total_plays, monthly_listeners").eq("user_id", user.id).single(),
      supabase.from("tracks").select("id").eq("user_id", user.id),
      supabase.from("artist_earnings").select("total_earnings").eq("artist_id", user.id).eq("payout_status", "pending")
    ]);

    setStats({
      totalStreams: profileRes.data?.total_plays || 0,
      totalTracks: tracksRes.data?.length || 0,
      pendingEarnings: earningsRes.data?.reduce((sum, e) => sum + (e.total_earnings || 0), 0) || 0,
      followers: profileRes.data?.monthly_listeners || 0
    });
  };

  const loadRecentReleases = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("tracks")
      .select("id, title, created_at, is_published, play_count, album:albums(title, cover_art_path)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3);
    setRecentReleases(data || []);
  };

  const loadNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(3);
    setNotifications(data || []);
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card/80 to-card border border-border/50 p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-muted-foreground text-lg font-medium mb-1">{greeting()}</p>
            <h1 className="text-4xl md:text-5xl font-display font-black tracking-tight mb-3">
              {artistName}
            </h1>
            <div className="flex items-center gap-3">
              <SubscriptionBadge size="sm" />
              <a 
                href={`/artist/${user?.id}`} 
                target="_blank"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                View Public Profile →
              </a>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={onUploadClick} className="gap-2 bg-primary hover:bg-primary/90">
              <Music className="w-4 h-4" />
              Release Music
            </Button>
            <Button variant="outline" onClick={() => onNavigate("music")} className="gap-2">
              View All Releases
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 bg-card/50 border-border/50 hover:border-primary/30 transition-colors cursor-pointer" onClick={() => onNavigate("insights")}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground font-medium">IMPACT</span>
          </div>
          <p className="text-3xl font-bold">{stats.totalStreams.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Intentional plays</p>
        </Card>

        <Card className="p-5 bg-card/50 border-border/50 hover:border-primary/30 transition-colors cursor-pointer" onClick={() => onNavigate("music")}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Music className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground font-medium">RELEASES</span>
          </div>
          <p className="text-3xl font-bold">{stats.totalTracks}</p>
          <p className="text-xs text-muted-foreground mt-1">Total tracks</p>
        </Card>

        <Card className="p-5 bg-card/50 border-border/50 hover:border-primary/30 transition-colors cursor-pointer" onClick={() => onNavigate("settings")}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-sm text-muted-foreground font-medium">EARNINGS</span>
          </div>
          <p className="text-3xl font-bold text-green-500">${stats.pendingEarnings.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">Pending payout</p>
        </Card>

        <Card className="p-5 bg-card/50 border-border/50 hover:border-primary/30 transition-colors cursor-pointer" onClick={() => onNavigate("promote")}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground font-medium">COMMUNITY</span>
          </div>
          <p className="text-3xl font-bold">{stats.followers.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Invested in your journey</p>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Manage Your Release */}
        <Card className="md:col-span-2 p-6 bg-card/50 border-border/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display font-bold">Your Story So Far</h2>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("music")} className="gap-1 text-muted-foreground hover:text-foreground">
              View All <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {recentReleases.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-border/50 rounded-xl">
              <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-semibold mb-2">No releases yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Start by uploading your first track</p>
              <Button onClick={onUploadClick} className="gap-2">
                <Music className="w-4 h-4" />
                Upload Music
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentReleases.map((track) => (
                <div 
                  key={track.id} 
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/track/${track.id}`)}
                >
                  <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                    {track.album?.cover_art_path ? (
                      <img 
                        src={supabase.storage.from("artist-images").getPublicUrl(track.album.cover_art_path).data.publicUrl}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Music className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{track.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(track.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">{(track.play_count || 0).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">streams</p>
                    </div>
                    <Badge variant={track.is_published ? "default" : "secondary"} className="uppercase text-xs">
                      {track.is_published ? "Live" : "Draft"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Notifications */}
        <Card className="p-6 bg-card/50 border-border/50">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-display font-bold">Notifications</h2>
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div 
                  key={notif.id}
                  className="p-3 rounded-lg bg-primary/10 border border-primary/20"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{notif.message || notif.notification_type}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(notif.created_at), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
