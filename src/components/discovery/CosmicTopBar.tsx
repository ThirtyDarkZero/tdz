import { Search, X } from "lucide-react";
import { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface CosmicTopBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  userProfile?: { profile_image_path?: string | null; display_name?: string; artist_name?: string } | null;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return "LATE NIGHT";
  if (h < 12) return "GOOD MORNING";
  if (h < 17) return "GOOD AFTERNOON";
  if (h < 21) return "GOOD EVENING";
  return "LATE NIGHT";
}

const TAB_TITLES: Record<string, string> = {
  discover: "DISCOVERY",
  explore: "EXPLORE",
  library: "YOUR COLLECTION",
  feed: "FEED",
  store: "STORE",
};

export function CosmicTopBar({ activeTab, searchQuery, onSearchChange, userProfile }: CosmicTopBarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const avatarUrl = useMemo(() => {
    const raw = userProfile?.profile_image_path;
    if (!raw) return null;
    if (raw.startsWith("http")) return raw;
    return supabase.storage.from("listener-images").getPublicUrl(raw).data.publicUrl;
  }, [userProfile]);

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div
      className="sticky top-0 z-30"
      style={{
        background: "rgba(3,3,15,0.7)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        padding: "calc(env(safe-area-inset-top, 12px) + 12px) 20px 16px",
      }}
    >
      {searchOpen ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-3)" }} />
            <input
              ref={inputRef}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search songs, artists..."
              className="w-full h-10 pl-10 pr-4 text-sm outline-none font-body"
              style={{
                background: "var(--glass-1)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-pill)",
                color: "var(--text-1)",
                backdropFilter: "blur(12px)",
              }}
            />
          </div>
          <button
            onClick={() => { setSearchOpen(false); onSearchChange(""); }}
            className="p-2"
            style={{ color: "var(--text-3)" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <p className="font-body" style={{ fontSize: 12, fontWeight: 500, color: "var(--text-3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {getGreeting()}
            </p>
            <h1 style={{ fontSize: 28, color: "var(--text-1)", lineHeight: 1.1 }}>
              {TAB_TITLES[activeTab] || "DISCOVERY"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Search button */}
            <button
              onClick={openSearch}
              className="flex items-center justify-center transition-colors"
              style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "var(--glass-1)",
                border: "1px solid var(--glass-border)",
                backdropFilter: "blur(12px)",
                color: "var(--text-2)",
              }}
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
