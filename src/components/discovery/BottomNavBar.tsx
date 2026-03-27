import { Compass, Radio, Library, Search, Play, Pause, SkipForward, SkipBack } from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";

interface BottomNavBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const NAV_ITEMS = [
  { id: "discover", label: "Discover", icon: Compass },
  { id: "trending", label: "Radio", icon: Radio },
  // Center slot is the player orb
  { id: "library", label: "Library", icon: Library },
  { id: "artists", label: "Search", icon: Search },
];

export function BottomNavBar({ activeTab, onTabChange }: BottomNavBarProps) {
  const { currentTrack, isPlaying, pauseTrack, resumeTrack, nextTrack, previousTrack } = usePlayer();

  const togglePlay = () => (isPlaying ? pauseTrack() : resumeTrack());

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Glassmorphic nav container */}
      <div
        className="relative mx-auto"
        style={{
          maxWidth: 520,
          padding: "0 16px 12px",
        }}
      >
        {/* Now playing mini strip above nav (if track playing) */}
        {currentTrack && (
          <div
            className="flex items-center gap-3 px-4 py-2 mb-2 rounded-2xl"
            style={{
              background: "rgba(20,15,35,0.85)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* Track art */}
            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
              {currentTrack.album_cover_path ? (
                <img src={currentTrack.album_cover_path} alt="" className="w-full h-full object-cover" />
              ) : currentTrack.thumbnail ? (
                <img src={currentTrack.thumbnail} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.4), rgba(0,207,255,0.4))" }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate" style={{ fontFamily: "'Raleway', sans-serif" }}>{currentTrack.title}</p>
              <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Raleway', sans-serif" }}>{currentTrack.artist_name}</p>
            </div>
            {/* Mini controls */}
            <div className="flex items-center gap-1">
              <button onClick={previousTrack} className="p-1.5">
                <SkipBack className="w-3 h-3" style={{ color: "rgba(255,255,255,0.5)" }} />
              </button>
              <button onClick={nextTrack} className="p-1.5">
                <SkipForward className="w-3 h-3" style={{ color: "rgba(255,255,255,0.5)" }} />
              </button>
            </div>
            {/* Progress bar */}
            <div className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full" style={{ width: "35%", background: "linear-gradient(90deg, #00CFFF, #8B5CF6)" }} />
            </div>
          </div>
        )}

        {/* Main nav bar */}
        <div
          className="relative flex items-center justify-around rounded-3xl"
          style={{
            height: 72,
            background: "rgba(20,15,35,0.9)",
            backdropFilter: "blur(32px)",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 -4px 40px rgba(0,0,0,0.5), 0 0 80px rgba(139,92,246,0.05)",
          }}
        >
          {/* Left items */}
          {NAV_ITEMS.slice(0, 2).map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="flex flex-col items-center gap-1 py-2 px-4 transition-all"
            >
              <item.icon
                className="w-5 h-5 transition-colors"
                style={{ color: activeTab === item.id ? "#FFFFFF" : "rgba(255,255,255,0.35)" }}
              />
              <span
                style={{
                  fontFamily: "'Raleway', sans-serif",
                  fontSize: 10,
                  fontWeight: activeTab === item.id ? 700 : 500,
                  color: activeTab === item.id ? "#FFFFFF" : "rgba(255,255,255,0.35)",
                  letterSpacing: "0.03em",
                }}
              >
                {item.label}
              </span>
            </button>
          ))}

          {/* Center: Play orb */}
          <div className="relative -mt-8">
            <button
              onClick={togglePlay}
              className="relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
              style={{
                background: "linear-gradient(135deg, #8B5CF6, #6366F1, #00CFFF)",
                boxShadow: "0 4px 30px rgba(139,92,246,0.5), 0 0 60px rgba(139,92,246,0.2), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              {/* Inner glow */}
              <div
                className="absolute inset-1 rounded-full"
                style={{
                  background: "linear-gradient(135deg, rgba(139,92,246,0.8), rgba(99,102,241,0.6))",
                  boxShadow: "inset 0 2px 8px rgba(255,255,255,0.15)",
                }}
              />
              <div className="relative z-10">
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-white" fill="white" />
                ) : (
                  <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                )}
              </div>
            </button>
            {/* Outer glow ring */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                inset: -4,
                border: "1px solid rgba(139,92,246,0.3)",
                boxShadow: "0 0 20px rgba(139,92,246,0.15)",
              }}
            />
          </div>

          {/* Right items */}
          {NAV_ITEMS.slice(2).map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="flex flex-col items-center gap-1 py-2 px-4 transition-all"
            >
              <item.icon
                className="w-5 h-5 transition-colors"
                style={{ color: activeTab === item.id ? "#FFFFFF" : "rgba(255,255,255,0.35)" }}
              />
              <span
                style={{
                  fontFamily: "'Raleway', sans-serif",
                  fontSize: 10,
                  fontWeight: activeTab === item.id ? 700 : 500,
                  color: activeTab === item.id ? "#FFFFFF" : "rgba(255,255,255,0.35)",
                  letterSpacing: "0.03em",
                }}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* Home indicator line */}
        <div className="flex justify-center mt-2">
          <div className="w-32 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>
      </div>
    </div>
  );
}
