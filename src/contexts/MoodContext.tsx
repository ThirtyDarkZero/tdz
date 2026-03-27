import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

export type MoodTheme = "default" | "chill" | "hype" | "focus" | "vibes" | "late-night" | "soul";

interface MoodColors {
  accent: string;
  nebulaPrimary: string;
  nebulaSecondary: string;
  artGlow: string;
  label: string;
  emoji: string;
}

const MOOD_PALETTES: Record<MoodTheme, MoodColors> = {
  default: {
    accent: "#00CFFF",
    nebulaPrimary: "rgba(72, 12, 168, 0.55)",
    nebulaSecondary: "rgba(18, 48, 110, 0.65)",
    artGlow: "rgba(0, 207, 255, 0.3)",
    label: "DEFAULT",
    emoji: "🎵",
  },
  chill: {
    accent: "#38BDF8",
    nebulaPrimary: "rgba(14, 60, 120, 0.6)",
    nebulaSecondary: "rgba(56, 189, 248, 0.15)",
    artGlow: "rgba(56, 189, 248, 0.3)",
    label: "CHILL",
    emoji: "🌊",
  },
  hype: {
    accent: "#F43F5E",
    nebulaPrimary: "rgba(120, 12, 60, 0.6)",
    nebulaSecondary: "rgba(244, 63, 94, 0.15)",
    artGlow: "rgba(244, 63, 94, 0.3)",
    label: "HYPE",
    emoji: "🔥",
  },
  focus: {
    accent: "#34D399",
    nebulaPrimary: "rgba(8, 80, 60, 0.6)",
    nebulaSecondary: "rgba(52, 211, 153, 0.15)",
    artGlow: "rgba(52, 211, 153, 0.3)",
    label: "FOCUS",
    emoji: "🎯",
  },
  vibes: {
    accent: "#A78BFA",
    nebulaPrimary: "rgba(80, 20, 160, 0.6)",
    nebulaSecondary: "rgba(167, 139, 250, 0.15)",
    artGlow: "rgba(167, 139, 250, 0.3)",
    label: "VIBES",
    emoji: "💜",
  },
  "late-night": {
    accent: "#EF4444",
    nebulaPrimary: "rgba(80, 10, 10, 0.65)",
    nebulaSecondary: "rgba(239, 68, 68, 0.12)",
    artGlow: "rgba(239, 68, 68, 0.3)",
    label: "LATE NIGHT",
    emoji: "🌙",
  },
  soul: {
    accent: "#FBB724",
    nebulaPrimary: "rgba(100, 60, 0, 0.6)",
    nebulaSecondary: "rgba(251, 183, 36, 0.15)",
    artGlow: "rgba(251, 183, 36, 0.3)",
    label: "SOUL",
    emoji: "✨",
  },
};

interface MoodContextType {
  mood: MoodTheme;
  setMood: (mood: MoodTheme) => void;
  colors: MoodColors;
}

const MoodContext = createContext<MoodContextType | null>(null);

export function MoodProvider({ children }: { children: ReactNode }) {
  const [mood, setMoodState] = useState<MoodTheme>("default");

  const setMood = useCallback((newMood: MoodTheme) => {
    setMoodState(newMood);
  }, []);

  useEffect(() => {
    const c = MOOD_PALETTES[mood];
    const root = document.documentElement;
    root.style.setProperty("--mood-accent", c.accent);
    root.style.setProperty("--mood-accent-glow", c.artGlow);
    root.style.setProperty("--nebula-violet", c.nebulaPrimary);
    root.style.setProperty("--nebula-indigo", c.nebulaSecondary);
    root.style.setProperty("--art-glow", c.artGlow);
    root.style.transition = "all 1.4s ease";
    const timer = setTimeout(() => { root.style.transition = ""; }, 1500);
    return () => clearTimeout(timer);
  }, [mood]);

  return (
    <MoodContext.Provider value={{ mood, setMood, colors: MOOD_PALETTES[mood] }}>
      {children}
    </MoodContext.Provider>
  );
}

export function useMood() {
  const ctx = useContext(MoodContext);
  if (!ctx) {
    return {
      mood: "default" as MoodTheme,
      setMood: () => {},
      colors: MOOD_PALETTES.default,
    };
  }
  return ctx;
}
