import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useActingArtist } from "@/contexts/ActingArtistContext";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Upload, TrendingUp, Music, Search, ArrowRight } from "lucide-react";

interface RosterArtist {
  artist_id: string;
  artist_name: string;
  profile_image?: string | null;
  track_count?: number;
  play_count?: number;
}

const REVENUE_PER_STREAM = 1;

export function RosterReleasesPanel() {
  const { user } = useAuthContext();
  const { setActingArtist, refresh } = useActingArtist();
  const navigate = useNavigate();
  const [roster, setRoster] = useState<RosterArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      if (!user) return;
      setLoading(true);
      const { data: ma } = await supabase
        .from("manager_artists")
        .select("artist_id")
        .eq("manager_id", user.id);
      const ids = (ma || []).map((r) => r.artist_id);
      if (ids.length === 0) {
        setRoster([]);
        setLoading(false);
        return;
      }
      const [{ data: profiles }, { data: tracks }] = await Promise.all([
        supabase.from("artist_profiles").select("user_id, artist_name, profile_image_path").in("user_id", ids),
        supabase.from("tracks").select("user_id, play_count").in("user_id", ids),
      ]);
      const rows: RosterArtist[] = ids.map((id) => {
        const p = profiles?.find((x) => x.user_id === id);
        const ts = tracks?.filter((t) => t.user_id === id) || [];
        return {
          artist_id: id,
          artist_name: p?.artist_name || "Unnamed artist",
          profile_image: p?.profile_image_path || null,
          track_count: ts.length,
          play_count: ts.reduce((s, t: any) => s + (t.play_count || 0), 0),
        };
      });
      setRoster(rows);
      setLoading(false);
    })();
  }, [user]);

  const releaseAs = async (artistId: string) => {
    await refresh();
    setActingArtist(artistId);
    toast.success("Studio switched — releasing on this artist's behalf");
    navigate(`/studio?as=${artistId}`);
  };

  const filtered = roster.filter((r) =>
    r.artist_name.toLowerCase().includes(q.trim().toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Card className="p-5 glass-card">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Upload className="w-4 h-4 text-primary" /> Release on behalf of your roster
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Pick an artist below. Studio will open in "acting as" mode — every upload, edit, and analytic
              you touch will belong to that artist. Your files upload securely into their space.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search roster…" className="pl-9 h-9" />
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : roster.length === 0 ? (
        <Card className="p-8 glass-card text-center">
          <p className="text-sm text-muted-foreground mb-4">
            No artists yet. Invite one from the Roster tab, and once they accept you can release music on their behalf here.
          </p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-6 glass-card text-center text-sm text-muted-foreground">
          No roster artists match "{q}".
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((r) => (
            <Card key={r.artist_id} className="p-4 glass-card hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-fuchsia-500/20 flex items-center justify-center font-semibold text-sm">
                  {r.artist_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{r.artist_name}</div>
                  <div className="text-[10px] text-muted-foreground">Roster artist</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 mb-3 text-center">
                <div className="p-1.5 rounded bg-muted/30">
                  <Music className="w-3 h-3 mx-auto text-muted-foreground mb-0.5" />
                  <div className="text-[10px] text-muted-foreground">Tracks</div>
                  <div className="text-xs font-semibold">{r.track_count || 0}</div>
                </div>
                <div className="p-1.5 rounded bg-muted/30">
                  <TrendingUp className="w-3 h-3 mx-auto text-muted-foreground mb-0.5" />
                  <div className="text-[10px] text-muted-foreground">Streams</div>
                  <div className="text-xs font-semibold">{(r.play_count || 0).toLocaleString()}</div>
                </div>
                <div className="p-1.5 rounded bg-muted/30">
                  <div className="text-[10px] text-muted-foreground">Revenue</div>
                  <div className="text-xs font-semibold text-primary">
                    ${((r.play_count || 0) * REVENUE_PER_STREAM).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => releaseAs(r.artist_id)}>
                  <Upload className="w-3 h-3 mr-1" /> Release as
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => navigate(`/artist/${r.artist_id}`)}
                >
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
