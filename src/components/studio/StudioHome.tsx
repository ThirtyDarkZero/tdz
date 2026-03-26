import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Music, TrendingUp, Users, ArrowRight, Wallet, Bell, CheckCircle2, AlertCircle
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

  const metricCards = [
    { label: "IMPACT", value: stats.totalStreams, sub: "Intentional plays", color: "#00CFFF", icon: TrendingUp, section: "insights" },
    { label: "RELEASES", value: stats.totalTracks, sub: "Total tracks", color: "#8B5CF6", icon: Music, section: "music" },
    { label: "EARNINGS", value: stats.pendingEarnings, sub: "Pending payout", color: "#22C55E", icon: Wallet, section: "settings", prefix: "$" },
    { label: "COMMUNITY", value: stats.followers, sub: "Invested in your journey", color: "#F97316", icon: Users, section: "promote" },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Header — dark Studio theme */}
      <div className="relative overflow-hidden rounded-2xl" style={{ background: "linear-gradient(135deg, #141414, #1a1a2e)" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 80% 20%, rgba(0,207,255,0.08), transparent 60%)" }} />
        <div className="relative z-10 p-8 md:p-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: "rgba(0,207,255,0.7)" }}>
                {greeting()}
              </p>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4" style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em", color: "#fff" }}>
                {artistName}
              </h1>
              <div className="flex items-center gap-4">
                <SubscriptionBadge size="sm" />
                <a href={`/artist/${user?.id}`} target="_blank" className="text-sm flex items-center gap-1 transition-colors" style={{ color: "rgba(255,255,255,0.5)" }}>
                  View Public Profile <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={onUploadClick} className="gap-2" style={{ background: "linear-gradient(135deg, #00CFFF, #8B5CF6)", color: "#000", fontWeight: 700 }}>
                <Music className="w-4 h-4" />
                Release Music
              </Button>
              <Button variant="outline" onClick={() => onNavigate("music")} className="gap-2 border-white/10 text-white/70 hover:text-white hover:border-white/20">
                View All Releases
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricCards.map((card, i) => (
          <ScrollReveal key={card.label} delay={i * 0.1}>
            <div
              className="group relative p-5 rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: "#1A1A1A",
                border: `1px solid ${card.color}15`,
              }}
              onClick={() => onNavigate(card.section)}
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl" style={{ background: card.color, opacity: 0.6 }} />
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${card.color}15` }}>
                  <card.icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.4)" }}>{card.label}</p>
                  <p className="text-2xl font-bold mt-0.5" style={{ color: card.color }}>
                    {card.prefix || ""}<AnimatedCounter value={typeof card.value === 'number' ? Math.floor(card.value) : card.value} />
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{card.sub}</p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {/* Content Boxes */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* YOUR STORY SO FAR */}
        <div className="md:col-span-2 rounded-xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between p-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div>
              <h2 className="text-xl font-bold" style={{ color: "#fff" }}>Your Story So Far</h2>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Recent releases and performance</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("insights")} className="gap-1 text-white/40 hover:text-white">
              View All <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="p-6">
            {recentReleases.length === 0 ? (
              <div className="text-center py-12 rounded-xl" style={{ border: "2px dashed rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <Music className="w-12 h-12 mx-auto mb-4" style={{ color: "rgba(255,255,255,0.15)" }} />
                <h3 className="font-semibold mb-2 text-white">No releases yet</h3>
                <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>Start by uploading your first track</p>
                <Button onClick={onUploadClick} className="gap-2" style={{ background: "linear-gradient(135deg, #00CFFF, #8B5CF6)", color: "#000" }}>
                  <Music className="w-4 h-4" />
                  Upload Music
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentReleases.map((track) => (
                  <div
                    key={track.id}
                    className="group flex items-center gap-4 p-4 rounded-xl transition-all cursor-pointer"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                    onClick={() => navigate(`/track/${track.id}`)}
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform" style={{ background: "rgba(255,255,255,0.05)" }}>
                      {track.album?.cover_art_path ? (
                        <img
                          src={supabase.storage.from("album-covers").getPublicUrl(track.album.cover_art_path).data.publicUrl}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="w-6 h-6" style={{ color: "rgba(255,255,255,0.2)" }} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate text-white group-hover:text-[#00CFFF] transition-colors">{track.title}</p>
                      <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {format(new Date(track.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-lg text-white">{(track.play_count || 0).toLocaleString()}</p>
                        <p className="text-[10px] uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.3)" }}>streams</p>
                      </div>
                      <Badge className={`uppercase text-[10px] font-semibold ${track.is_published ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-white/5 text-white/50 border-white/10'}`}>
                        {track.is_published ? "Live" : "Draft"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-xl overflow-hidden" style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3 p-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,207,255,0.1)" }}>
              <Bell className="w-4 h-4" style={{ color: "#00CFFF" }} />
            </div>
            <h2 className="text-lg font-bold text-white">Notifications</h2>
          </div>
          <div className="p-6">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-3" style={{ color: "rgba(34,197,94,0.3)" }} />
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-4 rounded-xl transition-all"
                    style={{ background: "rgba(0,207,255,0.05)", border: "1px solid rgba(0,207,255,0.1)" }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(0,207,255,0.1)" }}>
                        <AlertCircle className="w-3 h-3" style={{ color: "#00CFFF" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{notif.message || notif.notification_type}</p>
                        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
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
