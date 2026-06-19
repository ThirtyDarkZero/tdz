import { useState } from "react";
import { Sparkles, Send } from "lucide-react";
import { useMoodCast } from "@/hooks/useMoodCast";

const MOOD_PRESETS = [
  { label: "Chill", prompt: "Late night chill with warm electronic textures", emoji: "🌊", color: "#38BDF8" },
  { label: "Hype", prompt: "High-energy hype tracks for the gym, 130+ BPM", emoji: "🔥", color: "#F43F5E" },
  { label: "Focus", prompt: "Instrumental focus music for deep work, no vocals", emoji: "🎯", color: "#34D399" },
  { label: "Heartbreak", prompt: "Sad emotional songs about heartbreak and longing", emoji: "💔", color: "#A78BFA" },
  { label: "Drive", prompt: "Cinematic driving music for a long night highway", emoji: "🚗", color: "#FBB724" },
];

interface MoodCastBarProps {
  onCast: (tracks: any[]) => void;
}

export function MoodCastBar({ onCast }: MoodCastBarProps) {
  const { cast, loading } = useMoodCast();
  const [input, setInput] = useState("");

  const handle = async (prompt: string) => {
    const tracks = await cast(prompt);
    if (tracks?.length) onCast(tracks);
  };

  return (
    <section
      className="mx-3 sm:mx-5 my-4 p-4 sm:p-5"
      style={{
        background: "linear-gradient(135deg, rgba(255,99,71,0.06), rgba(167,139,250,0.05))",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 24,
        backdropFilter: "blur(80px)",
      }}
      aria-label="AI Mood Mix"
    >
      <div className="flex items-center gap-2 mb-2.5">
        <Sparkles className="w-3.5 h-3.5" style={{ color: "#FF6347" }} />
        <span
          style={{
            fontFamily: "'Raleway', sans-serif",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: "#FF6347",
          }}
        >
          AI MOOD CAST · ONE-TAP MIX
        </span>
      </div>
      <h2
        style={{
          fontFamily: "'Six Caps', sans-serif",
          fontSize: "clamp(26px, 4vw, 38px)",
          lineHeight: 0.95,
          color: "#fff",
          marginBottom: 14,
        }}
      >
        TELL US A VIBE — WE'LL BUILD THE JOURNEY
      </h2>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        {MOOD_PRESETS.map((m) => (
          <button
            key={m.label}
            disabled={loading}
            onClick={() => handle(m.prompt)}
            className="flex-shrink-0 transition-all active:scale-95 disabled:opacity-50"
            style={{
              padding: "10px 16px",
              borderRadius: 999,
              background: `linear-gradient(135deg, ${m.color}22, ${m.color}08)`,
              border: `1px solid ${m.color}55`,
            }}
          >
            <span
              style={{
                fontFamily: "'Raleway', sans-serif",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: m.color,
              }}
            >
              {m.emoji} {m.label.toUpperCase()}
            </span>
          </button>
        ))}
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim().length >= 3) handle(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder="e.g. rainy Sunday morning, neo-soul + lo-fi…"
          className="flex-1 outline-none px-4"
          style={{
            height: 44,
            background: "rgba(0,0,0,0.35)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 999,
            color: "#fff",
            fontFamily: "'Raleway', sans-serif",
            fontSize: 13,
          }}
        />
        <button
          type="submit"
          disabled={loading || input.trim().length < 3}
          className="px-5 transition-all active:scale-95 disabled:opacity-50"
          style={{
            height: 44,
            borderRadius: 999,
            background: "linear-gradient(135deg, #FF6347, #FF8A65)",
            color: "#fff",
            fontFamily: "'Raleway', sans-serif",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.1em",
            border: "none",
          }}
        >
          {loading ? "CASTING…" : (
            <span className="inline-flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5" /> CAST
            </span>
          )}
        </button>
      </form>
    </section>
  );
}
