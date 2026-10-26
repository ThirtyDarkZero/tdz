import { useState } from "react";
import { Crown, Trophy, Users, DollarSign, Tv, Smartphone } from "lucide-react";

export function LastStageStanding() {
  const [scenario, setScenario] = useState<"conservative" | "aggressive">("conservative");

  const econ = {
    conservative: { viewers: "500K", conv: "12%", subs: "60K", mrr: "$720K", payback: "<90 days" },
    aggressive:   { viewers: "2M",   conv: "8%",  subs: "160K", mrr: "$1.92M", payback: "<30 days" },
  }[scenario];

  return (
    <div className="space-y-10">
      {/* Hero card */}
      <div className="relative overflow-hidden rounded-3xl border border-[#FF6347]/40 bg-gradient-to-br from-[#1a0a0a] via-[#0a0a0a] to-[#0a0a14] p-8 md:p-14">
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, #FF6347, transparent)" }} />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, #D4A017, transparent)" }} />

        <div className="relative grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF6347]/10 border border-[#FF6347]/30 mb-6">
              <Tv className="w-3.5 h-3.5 text-[#FF6347]" />
              <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, color: "#FF6347", letterSpacing: "0.3em", textTransform: "uppercase", fontWeight: 700 }}>
                Go-To-Market · Flagship Series
              </span>
            </div>

            <h2 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: "clamp(56px, 9vw, 120px)", letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 0.85, color: "#fff" }}>
              Last Stage<br /><span style={{ color: "#FF6347" }}>Standing</span>
            </h2>

            <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 18, color: "#ccc", fontWeight: 300, fontStyle: "italic" }} className="mt-6 max-w-md">
              American Idol meets Twitch — settled by the fans who pay the artists.
            </p>

            <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 15, color: "#888", fontWeight: 400 }} className="mt-4 max-w-md">
              32 unsigned artists. 12 weeks. One $250,000 check. Every vote is a paid stream. Every viewer who downloads to vote becomes a fan who funds the next song.
            </p>
          </div>

          <div className="relative">
            <div className="rounded-3xl border-2 border-[#D4A017]/50 bg-black/60 p-8 backdrop-blur-xl text-center">
              <Trophy className="w-12 h-12 mx-auto text-[#D4A017]" />
              <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#D4A017", letterSpacing: "0.3em", textTransform: "uppercase", fontWeight: 700 }} className="mt-4">
                Grand Prize
              </div>
              <div style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 96, color: "#fff", letterSpacing: "0.02em", lineHeight: 1 }} className="mt-2">
                $250K
              </div>
              <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "#aaa", fontWeight: 400 }} className="mt-3">
                + TDZ Deal<br />+ National Tour
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Format */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { icon: Users, num: "32", label: "Artists Compete", color: "#00CFFF" },
          { icon: Smartphone, num: "100%", label: "Voting In-App Only", color: "#22C55E" },
          { icon: Crown, num: "12", label: "Weeks · One Champion", color: "#D4A017" },
        ].map((x, i) => {
          const Icon = x.icon;
          return (
            <div key={i} className="rounded-2xl p-6 border border-[#222] bg-[#0a0a0a]">
              <Icon className="w-6 h-6" style={{ color: x.color }} />
              <div style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 64, color: x.color, lineHeight: 1, letterSpacing: "0.03em" }} className="mt-4">{x.num}</div>
              <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#888", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600 }} className="mt-2">{x.label}</div>
            </div>
          );
        })}
      </div>

      {/* Unit economics calculator */}
      <div className="rounded-3xl border border-[#22C55E]/30 bg-gradient-to-br from-[#0a140a] to-[#050505] p-8">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#22C55E", letterSpacing: "0.3em", textTransform: "uppercase", fontWeight: 700 }}>
              Unit Economics — One Season
            </div>
            <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 48, color: "#fff", letterSpacing: "0.03em", lineHeight: 1 }} className="mt-2">
              The Math That Closes The Round
            </h3>
          </div>
          <div className="inline-flex p-1 rounded-full border border-[#333] bg-black/40">
            {(["conservative", "aggressive"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScenario(s)}
                className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${scenario === s ? "bg-[#22C55E] text-black" : "text-[#888]"}`}
                style={{ fontFamily: "'Raleway', sans-serif", letterSpacing: "0.18em" }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Viewers", value: econ.viewers },
            { label: "Conversion", value: econ.conv },
            { label: "Paid Subs", value: econ.subs },
            { label: "New MRR", value: econ.mrr, hl: true },
            { label: "Payback", value: econ.payback },
          ].map((x, i) => (
            <div key={i} className={`rounded-2xl p-5 ${x.hl ? "border-2 border-[#22C55E] bg-[#22C55E]/5" : "border border-[#222] bg-black/40"}`}>
              <div style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 40, color: x.hl ? "#22C55E" : "#fff", letterSpacing: "0.03em", lineHeight: 1 }}>{x.value}</div>
              <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, color: "#777", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600 }} className="mt-2">{x.label}</div>
            </div>
          ))}
        </div>

        <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "#888", fontWeight: 400 }} className="mt-6">
          Production budget: <span className="text-white font-semibold">~$1.8M</span>. YouTube + TikTok cutdowns drive the funnel; full episodes are <span className="text-[#22C55E] font-semibold">TDZ-app exclusive</span> — the same wedge that built Twitch and HQ Trivia.
        </p>
      </div>

      {/* Why it's the GTM */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl p-8 border border-[#222] bg-[#0a0a0a]">
          <DollarSign className="w-6 h-6 text-[#FF6347]" />
          <h4 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 36, color: "#fff", letterSpacing: "0.03em", lineHeight: 1 }} className="mt-3">
            Every Vote Is Revenue
          </h4>
          <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 14, color: "#888", fontWeight: 400 }} className="mt-3">
            Voting requires the app. The app requires an account. Each vote is a tracked, monetized stream — and an artist gets paid $1 for it. The show literally pays for itself, one stream at a time.
          </p>
        </div>
        <div className="rounded-2xl p-8 border border-[#222] bg-[#0a0a0a]">
          <Crown className="w-6 h-6 text-[#D4A017]" />
          <h4 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 36, color: "#fff", letterSpacing: "0.03em", lineHeight: 1 }} className="mt-3">
            Lead Investor Perks
          </h4>
          <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 14, color: "#888", fontWeight: 400 }} className="mt-3">
            Board observer seat. On-stage prize-presentation rights at the Season 1 finale. First look at all subsequent seasons + spin-off formats.
          </p>
        </div>
      </div>
    </div>
  );
}
