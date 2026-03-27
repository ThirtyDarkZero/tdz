import { Home, Search, Library, User } from "lucide-react";
import { cn } from "@/lib/utils";

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
        className="mx-auto max-w-[520px]"
        style={{
          background: "rgba(18,18,18,0.95)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className="flex flex-col items-center gap-0.5 px-4 py-1.5 transition-colors min-w-[56px]"
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                  strokeWidth={isActive ? 2.2 : 1.5}
                />
                <span
                  className={cn(
                    "text-[10px] transition-colors",
                    isActive
                      ? "font-semibold text-foreground"
                      : "font-normal text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Home indicator */}
        <div className="flex justify-center pb-1">
          <div className="h-[4px] w-32 rounded-full bg-muted-foreground/30" />
        </div>
      </div>
    </div>
  );
}
