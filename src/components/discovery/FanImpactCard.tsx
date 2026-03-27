import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Users, DollarSign, TrendingUp } from "lucide-react";

interface FanImpactCardProps {
  userId: string;
}

export function FanImpactCard({ userId }: FanImpactCardProps) {
  const [stats, setStats] = useState({ totalStreams: 0, artistsSupported: 0, totalContribution: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadImpact();
  }, [userId]);

  const loadImpact = async () => {
    try {
      const { data: history } = await supabase
        .from("listening_history")
        .select("track_id, tracks(artist_name, user_id)")
        .eq("user_id", userId)
        .limit(1000);

      if (history) {
        const uniqueArtists = new Set(
          history.map((h: any) => h.tracks?.user_id).filter(Boolean)
        );
        const totalStreams = history.length;
        setStats({
          totalStreams,
          artistsSupported: uniqueArtists.size,
          totalContribution: totalStreams,
        });
      }
    } catch (e) {
      console.error("Fan impact load error:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || stats.totalStreams === 0) return null;

  const statItems = [
    { icon: Users, label: "Artists Supported", value: String(stats.artistsSupported), color: "#00CFFF" },
    { icon: TrendingUp, label: "Total Streams", value: stats.totalStreams.toLocaleString(), color: "#8B5CF6" },
    { icon: DollarSign, label: "Contributed", value: `$${stats.totalContribution.toLocaleString()}`, color: "#22C55E" },
  ];

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6"
      style={{
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Subtle gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,207,255,0.3), rgba(139,92,246,0.3), transparent)" }} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{
            background: "rgba(0,207,255,0.08)",
            border: "1px solid rgba(0,207,255,0.15)",
          }}>
            <Heart className="w-5 h-5" style={{ color: "#00CFFF" }} />
          </div>
          <div>
            <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
              Your Impact
            </p>
            <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 24, color: "#FFFFFF", letterSpacing: "0.04em", lineHeight: 1.1 }}>
              YOU MAKE A DIFFERENCE
            </p>
          </div>
        </div>

        <div className="flex gap-6 sm:gap-8 ml-0 sm:ml-auto">
          {statItems.map((item) => (
            <div key={item.label} className="text-center">
              <div className="flex items-center gap-1.5 justify-center">
                <item.icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                <span className="text-xl font-black text-white" style={{ fontFamily: "'Raleway', sans-serif" }}>{item.value}</span>
              </div>
              <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
