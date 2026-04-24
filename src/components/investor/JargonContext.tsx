import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Mode = "generalist" | "industry";
const Ctx = createContext<{ mode: Mode; setMode: (m: Mode) => void; t: (g: string, i: string) => string }>({
  mode: "generalist",
  setMode: () => {},
  t: (g) => g,
});

export function JargonProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(() => (localStorage.getItem("tdz-jargon") as Mode) || "generalist");
  useEffect(() => { localStorage.setItem("tdz-jargon", mode); }, [mode]);
  const t = (generalist: string, industry: string) => (mode === "generalist" ? generalist : industry);
  return <Ctx.Provider value={{ mode, setMode, t }}>{children}</Ctx.Provider>;
}

export const useJargon = () => useContext(Ctx);

export function JargonToggle() {
  const { mode, setMode } = useJargon();
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-full border border-border/40 bg-card/40 backdrop-blur-md text-xs">
      {(["generalist", "industry"] as Mode[]).map((m) => (
        <button
          key={m}
          onClick={() => setMode(m)}
          className={`px-3 py-1.5 rounded-full font-semibold uppercase tracking-wider transition-all ${
            mode === m ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
          }`}
          style={{ fontFamily: "'Raleway', sans-serif", fontSize: 10, letterSpacing: "0.15em" }}
        >
          {m === "generalist" ? "Generalist" : "Music Insider"}
        </button>
      ))}
    </div>
  );
}
