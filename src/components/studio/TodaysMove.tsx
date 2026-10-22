import { useEffect, useState } from "react";
import { Flame, Zap, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useActingArtist } from "@/contexts/ActingArtistContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { pickTodaysMove, nextStreak, currentStreak, type Move } from "@/lib/todaysMove";

const today = () => new Date().toISOString().slice(0, 10);

export function TodaysMove({ onNavigate, onUploadClick }: { onNavigate: (s: string) => void; onUploadClick: () => void }) {
  const { user } = useAuthContext();
  const { effectiveUserId } = useActingArtist();
  const uid = effectiveUserId ?? user?.id;
  const key = `tdz-todays-move-${uid}`;
  const [move, setMove] = useState<Move | null>(null);
  const [state, setState] = useState<{ streak: number; last?: string }>({ streak: 0 });

  useEffect(() => {
    if (!uid) return;
    try { setState(JSON.parse(localStorage.getItem(key) || '{"streak":0}')); } catch { /* ignore */ }
    (async () => {
      const now = Date.now();
      const d7 = new Date(now - 7 * 864e5).toISOString();
      const d14 = new Date(now - 14 * 864e5).toISOString();
      const [{ data: tracks }, { count: s7 }, { count: sp }] = await Promise.all([
        supabase.from("tracks").select("title, play_count, is_published").eq("user_id", uid).order("play_count", { ascending: false }),
        supabase.from("stream_events").select("id", { count: "exact", head: true }).eq("artist_id", uid).gte("streamed_at", d7),
        supabase.from("stream_events").select("id", { count: "exact", head: true }).eq("artist_id", uid).gte("streamed_at", d14).lt("streamed_at", d7),
      ]);
      const t = tracks ?? [];
      setMove(pickTodaysMove({
        trackCount: t.length,
        publishedCount: t.filter((x: any) => x.is_published).length,
        streams7d: s7 ?? 0,
        streamsPrev7d: sp ?? 0,
        topTrackTitle: t[0]?.title,
      }));
    })();
  }, [uid, key]);

  if (!move) return null;
  const done = state.last === today();
  const streak = currentStreak(state, new Date());

  const act = () => {
    const next = nextStreak(state, new Date());
    setState(next);
    localStorage.setItem(key, JSON.stringify(next));
    move.section === "upload" ? onUploadClick() : onNavigate(move.section);
  };

  return (
    <section aria-label="Today's Move" className="glass-card rounded-2xl p-5 md:p-6 mb-6 border border-primary/30 relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl bg-primary/20 pointer-events-none" />
      <div className="relative flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold flex items-center gap-2">
            <Zap className="w-3.5 h-3.5" /> Today's Move
          </p>
          <h2 className="text-4xl md:text-5xl uppercase text-foreground mt-1" style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em" }}>{move.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{move.why}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-center px-3" aria-label={`${streak} day streak`}>
            <Flame className={`w-6 h-6 mx-auto ${streak ? "text-primary" : "text-muted-foreground"}`} />
            <div className="text-2xl text-foreground" style={{ fontFamily: "'Six Caps', sans-serif" }}>{streak}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">day streak</div>
          </div>
          <button onClick={act} className="min-h-[44px] px-5 rounded-full bg-primary text-primary-foreground font-semibold text-sm uppercase tracking-wider hover:scale-105 transition-transform flex items-center gap-2">
            {done ? <><Check className="w-4 h-4" /> Done · Go again</> : <>{move.cta} →</>}
          </button>
        </div>
      </div>
    </section>
  );
}
