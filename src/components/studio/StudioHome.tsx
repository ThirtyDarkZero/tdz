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
import { AnimatedCounter, ScrollReveal } from "@/components/AnimatedHeading";

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
      {/* PHP Admin-Style Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border/30 shadow-lg">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5" />
        
        {/* Content */}
        <div className="relative z-10 p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-muted-foreground/70 text-sm font-semibold uppercase tracking-wider mb-2">
                {greeting()}
              </p>
              <h1 className="text-4xl md:text-5xl font-display font-black tracking-tight mb-4">
                {artistName}
              </h1>
              <div className="flex items-center gap-4">
                <SubscriptionBadge size="sm" />
                <a 
                  href={`/artist/${user?.id}`} 
                  target="_blank"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  View Public Profile 
                  <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={onUploadClick} 
                className="gap-2 bg-gradient-to-r from-primary via-violet-500 to-fuchsia-500 hover:shadow-glow text-primary-foreground"
              >
                <Music className="w-4 h-4" />
                Release Music
              </Button>
              <Button variant="outline" onClick={() => onNavigate("music")} className="gap-2 border-border/50 hover:border-primary/50">
                View All Releases
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* PHP Admin-Style Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ScrollReveal delay={0}>
          <div 
            className="group relative p-5 rounded-xl bg-card border border-border/30 cursor-pointer transition-all duration-300 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5"
            onClick={() => onNavigate("insights")}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Impact</p>
                <p className="text-2xl font-bold">
                  <AnimatedCounter value={stats.totalStreams} />
                </p>
                <p className="text-xs text-muted-foreground mt-1">Intentional plays</p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div 
            className="group relative p-5 rounded-xl bg-card border border-border/30 cursor-pointer transition-all duration-300 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5"
            onClick={() => onNavigate("music")}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Music className="w-6 h-6 text-purple-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Releases</p>
                <p className="text-2xl font-bold">
                  <AnimatedCounter value={stats.totalTracks} />
                </p>
                <p className="text-xs text-muted-foreground mt-1">Total tracks</p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div 
            className="group relative p-5 rounded-xl bg-card border border-border/30 cursor-pointer transition-all duration-300 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5"
            onClick={() => onNavigate("settings")}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wallet className="w-6 h-6 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Earnings</p>
                <p className="text-2xl font-bold text-green-500">
                  <AnimatedCounter value={Math.floor(stats.pendingEarnings)} prefix="$" suffix={`.${(stats.pendingEarnings % 1).toFixed(2).slice(2)}`} />
                </p>
                <p className="text-xs text-muted-foreground mt-1">Pending payout</p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <div 
            className="group relative p-5 rounded-xl bg-card border border-border/30 cursor-pointer transition-all duration-300 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/5"
            onClick={() => onNavigate("promote")}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-orange-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Community</p>
                <p className="text-2xl font-bold">
                  <AnimatedCounter value={stats.followers} />
                </p>
                <p className="text-xs text-muted-foreground mt-1">Invested in your journey</p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* PHP Admin-Style Content Boxes */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Manage Your Release - Box Style */}
        <div className="md:col-span-2 rounded-xl bg-card border border-border/30 overflow-hidden">
          {/* Box Title */}
          <div className="flex items-center justify-between p-6 border-b border-border/20">
            <div>
              <h2 className="text-xl font-display font-bold">Your Story So Far</h2>
              <p className="text-sm text-muted-foreground mt-1">Recent releases and performance</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("music")} className="gap-1 text-muted-foreground hover:text-foreground">
              View All <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Box Content */}
          <div className="p-6">
            {recentReleases.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border/30 rounded-xl bg-muted/20">
                <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="font-semibold mb-2">No releases yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Start by uploading your first track</p>
                <Button onClick={onUploadClick} className="gap-2 bg-gradient-to-r from-primary to-violet-500">
                  <Music className="w-4 h-4" />
                  Upload Music
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentReleases.map((track) => (
                  <div 
                    key={track.id} 
                    className="group flex items-center gap-4 p-4 rounded-xl bg-muted/20 border border-border/20 hover:border-primary/30 hover:bg-muted/40 transition-all cursor-pointer"
                    onClick={() => navigate(`/track/${track.id}`)}
                  >
                    <div className="w-14 h-14 rounded-xl bg-muted/50 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
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
                      <p className="font-semibold truncate group-hover:text-primary transition-colors">{track.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(track.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-lg">{(track.play_count || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">streams</p>
                      </div>
                      <Badge 
                        variant={track.is_published ? "default" : "secondary"} 
                        className={`uppercase text-[10px] font-semibold ${track.is_published ? 'bg-green-500/10 text-green-500 border-green-500/30' : ''}`}
                      >
                        {track.is_published ? "Live" : "Draft"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Notifications - Box Style */}
        <div className="rounded-xl bg-card border border-border/30 overflow-hidden">
          {/* Box Title */}
          <div className="flex items-center gap-3 p-6 border-b border-border/20">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-lg font-display font-bold">Notifications</h2>
          </div>

          {/* Box Content */}
          <div className="p-6">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-500/30" />
                <p className="text-sm text-muted-foreground">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    className="p-4 rounded-xl bg-primary/5 border border-primary/10 hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <AlertCircle className="w-3 h-3 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
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
          </div>
        </div>
      </div>
    </div>
  );
};
