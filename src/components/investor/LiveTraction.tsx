import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";

interface Stats {
  artists: number | null;
  paidStreams: number | null;
  payoutsMTD: number | null;
  paidSubs: number | null;
}

export function LiveTraction() {
  const [stats, setStats] = useState<Stats>({ artists: null, paidStreams: null, payoutsMTD: null, paidSubs: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const sb = supabase as any;
      const [a, s, p, sub] = await Promise.all([
        sb.from("artist_profiles").select("*", { count: "exact", head: true }),
        sb.from("stream_events").select("*", { count: "exact", head: true }).eq("eligible_for_payout", true),
        sb.from("artist_payouts").select("amount").gte("created_at", monthStart.toISOString()),
        sb.from("user_subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
      ]);

      if (cancelled) return;
      const payouts = (p.data || []).reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);
      setStats({
        artists: a.count ?? 0,
        paidStreams: s.count ?? 0,
        payoutsMTD: payouts,
        paidSubs: sub.count ?? 0,
      });
    })();
    return () => { cancelled = true; };
  }, []);

  const tiles = [
    { label: "Artists Onboarded", value: stats.artists, format: (v: number) => v.toLocaleString(), color: "#00CFFF" },
    { label: "Paying Subscribers", value: stats.paidSubs, format: (v: number) => v.toLocaleString(), color: "#22C55E" },
    { label: "Intentional Plays Paid", value: stats.paidStreams, format: (v: number) => v.toLocaleString(), color: "#D4A017" },
    { label: "Paid To Artists (MTD)", value: stats.payoutsMTD, format: (v: number) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: "#FF6347" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 justify-center">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#22C55E", letterSpacing: "0.3em", textTransform: "uppercase", fontWeight: 700 }}>
          Live · Stripe-verified · Updated in real time
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tiles.map((t, i) => (
          <div key={i} className="rounded-2xl p-6 border border-[#222] bg-gradient-to-br from-[#0F0F0F] to-[#050505] relative overflow-hidden group">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity" style={{ background: `radial-gradient(circle at 50% 0%, ${t.color}, transparent 70%)` }} />
            <div style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 56, color: t.color, letterSpacing: "0.04em", lineHeight: 1 }}>
              {t.value === null ? "—" : t.format(t.value)}
            </div>
            <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#888", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 600 }} className="mt-3">
              {t.label}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#D4A017]/30 bg-[#D4A017]/5">
          <Sparkles className="w-3.5 h-3.5 text-[#D4A017]" />
          <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#D4A017", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700 }}>
            Pre-Seed · Live payout infrastructure operational
          </span>
        </div>
      </div>
    </div>
  );
}
