import { Home, Search, Library, User } from "lucide-react";

interface BottomNavBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const NAV_ITEMS = [
  { id: "discover", label: "Home", icon: Home },
  { id: "trending", label: "Search", icon: Search },
  { id: "library", label: "Library", icon: Library },
  { id: "artists", label: "Profile", icon: User },
];

export function BottomNavBar({ activeTab, onTabChange }: BottomNavBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div
        style={{
          background: "#0D0D0D",
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div className="flex items-center justify-around h-[68px] px-4 max-w-[560px] mx-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className="flex flex-col items-center gap-1 px-5 py-1 transition-all duration-200 min-w-[60px] relative"
              >
                <item.icon
                  className="transition-all duration-200"
                  style={{
                    width: 22,
                    height: 22,
                    color: isActive ? "hsl(var(--primary))" : "rgba(255,255,255,0.35)",
                    strokeWidth: isActive ? 2.2 : 1.5,
                  }}
                />
                <span
                  className="transition-all duration-200"
                  style={{
                    fontSize: 10,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "hsl(var(--primary))" : "rgba(255,255,255,0.35)",
                    letterSpacing: "0.02em",
                  }}
                >
                  {item.label}
                </span>
                {/* Active dot indicator */}
                {isActive && (
                  <div
                    className="absolute -bottom-0.5 w-1 h-1 rounded-full"
                    style={{ background: "hsl(var(--primary))" }}
                  />
                )}
              </button>
            );
          })}
        </div>
        {/* Home indicator bar */}
        <div className="flex justify-center pb-2">
          <div className="h-[5px] w-[134px] rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>
      </div>
    </div>
  );
}
