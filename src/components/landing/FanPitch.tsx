import { Sparkles, Headphones, Users, Eye, Activity, Heart, Wand2, Trophy } from "lucide-react";

const FEATURES = [
  { Icon: Heart, title: "Your $12 goes to who you play", body: "Every qualified play sends $1 to the artist behind it. No pooled pot, no mystery math. You can see exactly who you're backing." },
  { Icon: Eye, title: "Recommendations that explain themselves", body: "Every suggestion tells you why it showed up. No black-box algorithm deciding your taste for you." },
  { Icon: Wand2, title: "AI Mood Mix", body: "Type a feeling like \"late-night drive, rain on the window\" and get a playlist built for that moment." },
  { Icon: Users, title: "Listen Together", body: "Start a live room and share one queue with friends in real time, wherever they are." },
  { Icon: Activity, title: "Live Pulse", body: "Watch what's resonating on TDZ right now and catch the next breakout before everyone else does." },
  { Icon: Headphones, title: "The Orb Player", body: "A full-screen, immersive player with smooth DJ-style crossfades between tracks." },
  { Icon: Sparkles, title: "Moodscapes", body: "Switch the whole app's vibe with one tap: Chill, Hype, Focus and more." },
  { Icon: Trophy, title: "Your fan journey", body: "Earn badges, level up your profile and show the artists you found first." },
];

const COMPARE = [
  ["Where your money goes", "Straight to the artists you play", "Into one shared pool"],
  ["Why a song was picked", "Shown on every recommendation", "Hidden"],
  ["Listening with friends", "Built in, live", "Limited or add-on"],
  ["Fan recognition", "Badges, levels, early-supporter status", "None"],
];

export function FanPitch({ onStart, onExplore }: { onStart: () => void; onExplore: () => void }) {
  return (
    <section aria-labelledby="fan-pitch-title" className="relative py-24 px-4 overflow-hidden" style={{ background: "#000" }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, hsl(9 100% 64% / 0.18), transparent 70%), radial-gradient(ellipse 50% 50% at 90% 80%, hsl(190 100% 50% / 0.10), transparent 70%)" }} />
      <div className="relative max-w-6xl mx-auto">
        <p className="text-center" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: 12, color: "#FF6347", letterSpacing: "0.4em" }}>FOR PARTICIPANTS · FOR FANS</p>
        <h2 id="fan-pitch-title" className="text-center mt-3" style={{
          fontFamily: "'Six Caps', sans-serif", fontSize: "clamp(56px, 9vw, 140px)", lineHeight: 0.95, letterSpacing: "0.03em",
          background: "linear-gradient(180deg, #FFFFFF 0%, #D0D0D0 45%, #6A6A6A 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          THE STREAMING SERVICE<br />WHERE EVERY PLAY MATTERS
        </h2>
        <p className="text-center mx-auto mt-5 max-w-2xl" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 17, color: "#BBB", lineHeight: 1.6 }}>
          Same unlimited listening you're used to. The difference: on TDZ your subscription actually reaches the artists you love, and discovery feels like an adventure instead of a feed.
        </p>

        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <button onClick={onStart} className="liquid-glass liquid-glass-btn liquid-glass-cta rounded-full px-8 py-3.5"
            style={{ color: "#FFF", fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.14em" }}>
            START LISTENING · $12/MO
          </button>
          <button onClick={onExplore} className="liquid-glass liquid-glass-btn rounded-full px-8 py-3.5"
            style={{ color: "#FFF", fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: 13, letterSpacing: "0.14em" }}>
            EXPLORE DISCOVERY →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-16">
          {FEATURES.map(({ Icon, title, body }) => (
            <article key={title} className="liquid-glass liquid-glass-btn rounded-3xl p-6">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4" style={{ background: "hsl(9 100% 64% / 0.15)", border: "1px solid hsl(9 100% 64% / 0.35)" }}>
                <Icon className="w-5 h-5" style={{ color: "#FF6347" }} aria-hidden />
              </div>
              <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 30, color: "#FFF", letterSpacing: "0.04em", lineHeight: 1 }}>{title}</h3>
              <p className="mt-2" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 14, color: "#AAA", lineHeight: 1.55 }}>{body}</p>
            </article>
          ))}
        </div>

        <div className="liquid-glass rounded-3xl mt-14 overflow-x-auto">
          <table className="w-full text-left" style={{ fontFamily: "'Raleway', sans-serif", minWidth: 560 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid hsl(0 0% 100% / 0.1)" }}>
                <th className="p-5" style={{ fontSize: 11, color: "#777", letterSpacing: "0.2em" }}>WHY FANS SWITCH</th>
                <th className="p-5" style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 28, color: "#FF6347", letterSpacing: "0.05em" }}>TDZ</th>
                <th className="p-5" style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 28, color: "#666", letterSpacing: "0.05em" }}>TYPICAL STREAMING APP</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(([k, a, b]) => (
                <tr key={k} style={{ borderBottom: "1px solid hsl(0 0% 100% / 0.06)" }}>
                  <td className="p-5" style={{ fontSize: 14, color: "#CCC" }}>{k}</td>
                  <td className="p-5" style={{ fontSize: 14, color: "#FFF", fontWeight: 600 }}>{a}</td>
                  <td className="p-5" style={{ fontSize: 14, color: "#777" }}>{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
