import { Home, Compass, LayoutGrid, User, ShoppingBag, Disc3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";

interface BottomNavBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BASE_NAV_ITEMS = [
  { id: "discover", label: "HOME", icon: Home },
  { id: "explore", label: "EXPLORE", icon: Compass },
  { id: "library", label: "LIBRARY", icon: LayoutGrid },
  { id: "feed", label: "PROFILE", icon: User },
  { id: "store", label: "STORE", icon: ShoppingBag },
];

export function BottomNavBar({ activeTab, onTabChange }: BottomNavBarProps) {
  const { user } = useAuth();
  const { role } = useUserRole(user);
  const navigate = useNavigate();

  const isArtist = role === "artist" || role === "verified_artist" || role === "manager";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100]">
      <div
        style={{
          background: "rgba(3, 3, 15, 0.92)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "8px 0 calc(8px + env(safe-area-inset-bottom, 0px))",
          boxShadow: "0 -8px 32px rgba(0,0,0,0.4)",
        }}
      >
        <div className="flex items-center justify-around max-w-[600px] mx-auto">
          {/* Studio button for artists */}
          {isArtist && (
            <button
              onClick={() => navigate("/studio")}
              className="flex flex-col items-center gap-1 min-w-[56px] border-none bg-transparent transition-all duration-200"
              style={{ padding: "6px 12px", borderRadius: "var(--radius-pill)" }}
            >
              <Disc3
                className="transition-all duration-200"
                style={{ width: 24, height: 24, color: "#FF6347", strokeWidth: 1.5 }}
              />
              <span className="font-body" style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#FF6347" }}>
                STUDIO
              </span>
            </button>
          )}
          {BASE_NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className="flex flex-col items-center gap-1 min-w-[56px] border-none bg-transparent transition-all duration-200"
                style={{
                  padding: "6px 12px",
                  borderRadius: "var(--radius-pill)",
                  background: isActive ? "rgba(255, 99, 71, 0.1)" : "transparent",
                }}
              >
                <item.icon
                  className="transition-all duration-200"
                  style={{
                    width: 24, height: 24,
                    color: isActive ? "#FF6347" : "var(--text-3)",
                    strokeWidth: isActive ? 2.2 : 1.5,
                    transform: isActive ? "scale(1.1)" : "scale(1)",
                  }}
                />
                <span className="font-body transition-all duration-200" style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
                  color: isActive ? "#00CFFF" : "var(--text-3)",
                }}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="w-1 h-1 rounded-full" style={{ background: "#00CFFF", boxShadow: "0 0 8px #00CFFF" }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
