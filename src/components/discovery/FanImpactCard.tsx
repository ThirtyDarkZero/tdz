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
          totalContribution: totalStreams, // $1 per stream
        });
      }
    } catch (e) {
      console.error("Fan impact load error:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || stats.totalStreams === 0) return null;

  return (
    <div className="mx-4 sm:mx-6 lg:mx-8 mb-6">
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
        style={{
          background: "linear-gradient(135deg, rgba(0,207,255,0.08) 0%, rgba(139,92,246,0.08) 100%)",
          border: "1px solid rgba(0,207,255,0.15)",
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(0,207,255,0.15)" }}>
              <Heart className="w-6 h-6" style={{ color: "#00CFFF" }} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest" style={{ color: "#888", fontFamily: "'Raleway', sans-serif" }}>
                Your Fan Impact
              </p>
              <p className="text-lg font-bold text-white" style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 28, letterSpacing: "0.04em" }}>
                YOU MAKE A DIFFERENCE
              </p>
            </div>
          </div>

          <div className="flex gap-6 sm:gap-10 ml-0 sm:ml-auto">
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center">
                <Users className="w-4 h-4" style={{ color: "#00CFFF" }} />
                <span className="text-2xl font-black text-white">{stats.artistsSupported}</span>
              </div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: "#666" }}>Artists Supported</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center">
                <TrendingUp className="w-4 h-4" style={{ color: "#22C55E" }} />
                <span className="text-2xl font-black text-white">{stats.totalStreams.toLocaleString()}</span>
              </div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: "#666" }}>Total Streams</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center">
                <DollarSign className="w-4 h-4" style={{ color: "#22C55E" }} />
                <span className="text-2xl font-black" style={{ color: "#22C55E" }}>${stats.totalContribution.toLocaleString()}</span>
              </div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: "#666" }}>Contributed to Artists</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
