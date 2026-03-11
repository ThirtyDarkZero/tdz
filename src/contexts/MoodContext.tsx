import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

export type MoodTheme = "default" | "chill" | "hype" | "focus" | "vibes" | "late-night";

interface MoodColors {
  nebula1: string;
  nebula2: string;
  nebula3: string;
  accent: string;
  accentGlow: string;
  playerGradient: string;
}

const MOOD_PALETTES: Record<MoodTheme, MoodColors> = {
  default: {
    nebula1: "rgba(59,15,107,0.55)",
    nebula2: "rgba(14,42,92,0.6)",
    nebula3: "rgba(10,74,110,0.35)",
    accent: "#00CFFF",
    accentGlow: "rgba(0,207,255,0.3)",
    playerGradient: "linear-gradient(90deg, #00CFFF, #7C3AED)",
  },
  chill: {
    nebula1: "rgba(20,60,120,0.55)",
    nebula2: "rgba(10,80,100,0.6)",
    nebula3: "rgba(30,100,130,0.35)",
    accent: "#7DD3FC",
    accentGlow: "rgba(125,211,252,0.3)",
    playerGradient: "linear-gradient(90deg, #7DD3FC, #38BDF8)",
  },
  hype: {
    nebula1: "rgba(120,20,20,0.55)",
    nebula2: "rgba(130,60,10,0.6)",
    nebula3: "rgba(140,80,0,0.35)",
    accent: "#EF4444",
    accentGlow: "rgba(239,68,68,0.3)",
    playerGradient: "linear-gradient(90deg, #EF4444, #F97316)",
  },
  focus: {
    nebula1: "rgba(10,80,50,0.55)",
    nebula2: "rgba(15,100,70,0.6)",
    nebula3: "rgba(20,90,80,0.35)",
    accent: "#22C55E",
    accentGlow: "rgba(34,197,94,0.3)",
    playerGradient: "linear-gradient(90deg, #22C55E, #10B981)",
  },
  vibes: {
    nebula1: "rgba(80,20,120,0.55)",
    nebula2: "rgba(100,30,140,0.6)",
    nebula3: "rgba(60,10,100,0.35)",
    accent: "#C084FC",
    accentGlow: "rgba(192,132,252,0.3)",
    playerGradient: "linear-gradient(90deg, #C084FC, #A855F7)",
  },
  "late-night": {
    nebula1: "rgba(30,20,80,0.55)",
    nebula2: "rgba(20,15,60,0.6)",
    nebula3: "rgba(40,25,90,0.35)",
    accent: "#818CF8",
    accentGlow: "rgba(129,140,248,0.3)",
    playerGradient: "linear-gradient(90deg, #818CF8, #6366F1)",
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

  // Apply CSS variables for mood theming
  useEffect(() => {
    const colors = MOOD_PALETTES[mood];
    const root = document.documentElement;
    root.style.setProperty("--mood-nebula1", colors.nebula1);
    root.style.setProperty("--mood-nebula2", colors.nebula2);
    root.style.setProperty("--mood-nebula3", colors.nebula3);
    root.style.setProperty("--mood-accent", colors.accent);
    root.style.setProperty("--mood-accent-glow", colors.accentGlow);
    root.style.setProperty("--mood-player-gradient", colors.playerGradient);
    root.style.setProperty("--mood-transition", "1.2s ease");
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
