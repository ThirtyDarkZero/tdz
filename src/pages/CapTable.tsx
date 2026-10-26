import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import tdzLogo from "@/assets/tdz-logo.png";

/**
 * Cap Table page — color-matched to the Investors page palette
 * (Gold #D4A017, Green #22C55E, Blue #00CFFF, Coral #FF6347, Silver chrome).
 */

const C = {
  gold: "#D4A017",
  goldLight: "#E8C76A",
  goldDark: "#8A6820",
  silver: "#D0D0D0",
  bg: "#000",
  surface: "#0E0E0E",
  card: "#111",
  border: "rgba(255,255,255,0.07)",
  text: "#F2EDE4",
  muted: "#7A7A7A",
  green: "#22C55E",
  blue: "#00CFFF",
};

const ral = "'Raleway', sans-serif";
const six = "'Six Caps', sans-serif";

const rows = [
  { name: "Founder", type: "Common · Restricted", typeColor: C.goldDark, shares: "6,500,000", pct: "65", value: "$43.35M", color: C.goldLight, bar: C.gold, founder: true },
  { name: "Pre-Seed Investors", type: "Preferred · Series PS-1", typeColor: C.muted, shares: "2,000,000", pct: "20", value: "$13.35M", color: C.silver, bar: C.silver, founder: false },
  { name: "Employee Option Pool", type: "Reserved · ESOP", typeColor: C.muted, shares: "1,000,000", pct: "10", value: "$6.67M", color: C.green, bar: C.green, founder: false },
  { name: "Advisors / Future Hires", type: "Reserved · Warrants", typeColor: C.muted, shares: "500,000", pct: "5", value: "$3.33M", color: C.blue, bar: C.blue, founder: false },
];

const valStrip = [
  { num: "$56.7M", label: "Pre-Money Valuation", sub: "implied at ask", color: C.blue },
  { num: "$66.7M", label: "Post-Money Valuation", sub: "after close", color: C.green },
  { num: "$10M", label: "Raise Amount", sub: "pre-seed / seed", color: C.goldLight },
  { num: "15%", label: "Investor Equity", sub: "clean · no SAFEs", color: C.silver },
];

const terms = [
  { key: "Security Type", val: "Preferred Equity", desc: "Series PS-1 Preferred Shares · No SAFEs · Clean cap table from day one" },
  { key: "Round Size", val: "$10,000,000", desc: "Pre-seed / seed positioning · Live beta · subscription revenue generating" },
  { key: "Pre-Money Valuation", val: "$56,666,667", desc: "Implied at 15% for $10M · Justified by live traction + full AI platform" },
  { key: "Investor Equity", val: "15% Post-Close", desc: "Clean single number · No ratchets · No anti-dilution complexity" },
  { key: "Use of Funds", val: "3 Pillars", desc: "AI infrastructure scale · Artist acquisition · Team growth" },
  { key: "Stage / Status", val: "Beta · Live", desc: "Artists on platform · Subscription MRR active · Full AI label OS deployed" },
];

const scenarios = [
  { tag: "Conservative", tagBg: "rgba(120,120,120,0.15)", tagColor: C.muted, pre: "$20M", raise: "$3M", pct: "13%", note: "Typical pre-seed, 2024–25", active: false },
  { tag: "Moderate", tagBg: "rgba(0,207,255,0.12)", tagColor: C.blue, pre: "$35M", raise: "$5M", pct: "13%", note: "Strong AI story + live beta", active: false },
  { tag: "Your Ask ✦", tagBg: "rgba(212,160,23,0.18)", tagColor: C.gold, pre: "$56.7M", raise: "$10M", pct: "15%", note: "Seed-stage · defensible with traction", active: true },
];

export default function CapTable() {
  const navigate = useNavigate();

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: "100vh", fontFamily: ral, position: "relative" }}>
      {/* Back nav */}
      <div className="sticky top-0 z-40 backdrop-blur-xl" style={{ background: "rgba(0,0,0,0.7)", borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate("/investors")}
            className="flex items-center gap-2 text-xs uppercase tracking-widest hover:text-white transition-colors"
            style={{ color: C.muted, fontFamily: ral, letterSpacing: "0.18em", fontWeight: 600 }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Investors
          </button>
          <span style={{ fontFamily: six, fontSize: 18, color: C.goldLight, letterSpacing: "0.12em", textTransform: "uppercase" }}>Cap Table</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-12 py-12 md:py-16">
        {/* HEADER */}
        <div className="flex items-center gap-8 pb-10 mb-12" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div style={{ width: 88, height: 88, borderRadius: "50%", overflow: "hidden", border: `1px solid ${C.gold}50`, boxShadow: `0 0 40px ${C.gold}20`, flexShrink: 0 }}>
            <img src={tdzLogo} alt="TDZ" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div className="flex-1">
            <div style={{ fontFamily: six, fontSize: 56, letterSpacing: "0.08em", lineHeight: 1, color: C.goldLight, textTransform: "uppercase" }}>TDZ</div>
            <div style={{ fontSize: 11, letterSpacing: "0.32em", textTransform: "uppercase", color: C.muted, marginTop: 6 }}>$1 Per Stream · Full Label OS for Independent Artists</div>
          </div>
          <div className="text-right hidden md:block">
            <div style={{ fontFamily: six, fontSize: 26, letterSpacing: "0.12em", color: C.text, textTransform: "uppercase" }}>Cap Table</div>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.12em", marginTop: 5, textTransform: "uppercase" }}>Pre-Seed Round · Q2 2026</div>
          </div>
        </div>

        {/* VALUATION STRIP */}
        <p style={{ fontFamily: six, fontSize: 13, letterSpacing: "0.3em", textTransform: "uppercase", color: C.goldDark, marginBottom: 20 }}>Valuation Summary</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px mb-12" style={{ background: C.border, border: `1px solid ${C.border}`, borderRadius: 2, overflow: "hidden" }}>
          {valStrip.map((v, i) => (
            <div key={i} style={{ background: C.card, padding: "28px 20px", textAlign: "center", position: "relative" }}>
              <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 32, height: 1, background: C.gold, opacity: 0.4 }} />
              <div style={{ fontFamily: six, fontSize: 44, letterSpacing: "0.04em", lineHeight: 1, marginBottom: 8, color: v.color }}>{v.num}</div>
              <div style={{ fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: C.muted, fontWeight: 500 }}>{v.label}</div>
              <div style={{ fontSize: 10, color: C.goldDark, marginTop: 4, letterSpacing: "0.06em" }}>{v.sub}</div>
            </div>
          ))}
        </div>

        {/* CAP TABLE */}
        <p style={{ fontFamily: six, fontSize: 13, letterSpacing: "0.3em", textTransform: "uppercase", color: C.goldDark, marginBottom: 16 }}>Capitalization Table — Post-Close</p>
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 2, overflow: "hidden", marginBottom: 40 }}>
          {/* Header */}
          <div className="grid items-center px-5 py-3" style={{ gridTemplateColumns: "2fr 1fr 0.7fr 1.2fr 80px", gap: 8, background: "rgba(212,160,23,0.06)", borderBottom: `1px solid ${C.gold}25` }}>
            <div style={{ fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase", color: C.goldDark, fontWeight: 600 }}>Shareholder</div>
            <div style={{ fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase", color: C.goldDark, fontWeight: 600, textAlign: "right" }}>Shares</div>
            <div style={{ fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase", color: C.goldDark, fontWeight: 600, textAlign: "right" }}>%</div>
            <div style={{ fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase", color: C.goldDark, fontWeight: 600, textAlign: "right" }}>Post-Money Value</div>
            <div style={{ fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase", color: C.goldDark, fontWeight: 600 }}>Allocation</div>
          </div>

          {rows.map((r, i) => (
            <div
              key={i}
              className="grid items-center px-5 py-4"
              style={{ gridTemplateColumns: "2fr 1fr 0.7fr 1.2fr 80px", gap: 8, borderBottom: `1px solid ${C.border}`, background: r.founder ? "rgba(212,160,23,0.04)" : "transparent" }}
            >
              <div>
                <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{r.name}</div>
                <div style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 3, color: r.typeColor }}>{r.type}</div>
              </div>
              <div style={{ fontSize: 12, color: C.muted, textAlign: "right" }}>{r.shares}</div>
              <div style={{ fontFamily: six, fontSize: 26, letterSpacing: "0.04em", textAlign: "right", color: r.color }}>{r.pct}</div>
              <div style={{ fontSize: 12, textAlign: "right", fontWeight: 500, color: r.color }}>{r.value}</div>
              <div className="flex items-center">
                <div style={{ width: "100%", height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${r.pct}%`, background: r.bar, borderRadius: 2 }} />
                </div>
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="grid px-5 py-4" style={{ gridTemplateColumns: "2fr 1fr 0.7fr 1.2fr 80px", gap: 8, background: "rgba(212,160,23,0.05)", borderTop: `1px solid ${C.gold}25` }}>
            <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: C.gold, fontWeight: 600 }}>Total Authorized</div>
            <div style={{ fontSize: 11, color: C.muted, textAlign: "right" }}>10,000,000</div>
            <div style={{ fontFamily: six, fontSize: 26, color: C.goldLight, textAlign: "right", letterSpacing: "0.04em" }}>100</div>
            <div style={{ fontSize: 13, color: C.goldLight, fontWeight: 600, textAlign: "right" }}>$66.7M</div>
            <div />
          </div>
        </div>

        {/* GOLD LINE */}
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`, opacity: 0.25, margin: "40px 0" }} />

        {/* ROUND TERMS */}
        <p style={{ fontFamily: six, fontSize: 13, letterSpacing: "0.3em", textTransform: "uppercase", color: C.goldDark, marginBottom: 16 }}>Round Terms</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px mb-10" style={{ background: C.border, border: `1px solid ${C.border}`, borderRadius: 2, overflow: "hidden" }}>
          {terms.map((t, i) => (
            <div key={i} style={{ background: C.card, padding: "20px 22px" }}>
              <div style={{ fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase", color: C.muted, fontWeight: 600, marginBottom: 6 }}>{t.key}</div>
              <div style={{ fontFamily: six, fontSize: 22, letterSpacing: "0.06em", color: C.goldLight, lineHeight: 1 }}>{t.val}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 5, lineHeight: 1.6, letterSpacing: "0.02em" }}>{t.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`, opacity: 0.25, margin: "40px 0" }} />

        {/* SCENARIOS */}
        <p style={{ fontFamily: six, fontSize: 13, letterSpacing: "0.3em", textTransform: "uppercase", color: C.goldDark, marginBottom: 16 }}>Valuation Sense-Check — Three Scenarios</p>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 2, overflow: "hidden", marginBottom: 40 }}>
          <div className="grid px-5 py-3" style={{ gridTemplateColumns: "140px 1fr 1fr 1fr 1.5fr", background: "rgba(255,255,255,0.02)", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase", color: C.muted, fontWeight: 600 }}>Scenario</div>
            <div style={{ fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase", color: C.muted, fontWeight: 600, textAlign: "right" }}>Pre-Money</div>
            <div style={{ fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase", color: C.muted, fontWeight: 600, textAlign: "right" }}>Raise</div>
            <div style={{ fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase", color: C.muted, fontWeight: 600, textAlign: "right" }}>Investor %</div>
            <div style={{ fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase", color: C.muted, fontWeight: 600, textAlign: "right" }}>Context</div>
          </div>
          {scenarios.map((s, i) => (
            <div
              key={i}
              className="grid items-center px-5 py-4"
              style={{ gridTemplateColumns: "140px 1fr 1fr 1fr 1.5fr", borderBottom: i < scenarios.length - 1 ? `1px solid ${C.border}` : "none", background: s.active ? "rgba(212,160,23,0.05)" : "transparent" }}
            >
              <div>
                <span style={{ display: "inline-block", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, padding: "4px 10px", borderRadius: 1, background: s.tagBg, color: s.tagColor, fontFamily: ral }}>{s.tag}</span>
              </div>
              <div style={{ fontSize: 13, color: s.active ? C.goldLight : C.text, textAlign: "right", fontWeight: s.active ? 600 : 400 }}>{s.pre}</div>
              <div style={{ fontSize: 13, color: s.active ? C.goldLight : C.text, textAlign: "right", fontWeight: s.active ? 600 : 400 }}>{s.raise}</div>
              <div style={{ fontSize: 13, color: s.active ? C.goldLight : C.text, textAlign: "right", fontWeight: s.active ? 600 : 400 }}>{s.pct}</div>
              <div style={{ fontSize: 10, color: s.active ? C.goldDark : C.muted, textAlign: "right", letterSpacing: "0.04em" }}>{s.note}</div>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8" style={{ borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase", lineHeight: 1.8 }}>
            TDZ · Investor Relations<br />
            thirtydarkzero.net/investors · Confidential
          </div>
          <a href="mailto:invest@thirtydarkzero.com" style={{ color: C.gold, fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textDecoration: "none" }}>
            invest@thirtydarkzero.com ↗
          </a>
        </div>
      </div>
    </div>
  );
}
