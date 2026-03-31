import { Search, X, Globe, Loader2 } from "lucide-react";
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import tdzLogo from "@/assets/tdz-logo.png";

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
  const [globalResults, setGlobalResults] = useState<any[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

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

  // Global music library search (debounced)
  const searchGlobal = useCallback(async (q: string) => {
    if (q.length < 3) { setGlobalResults([]); return; }
    setGlobalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("unified-music-search", {
        body: { query: q, limit: 8, sources: ["spotify", "musicbrainz"] },
      });
      if (!error && data?.results) {
        setGlobalResults(data.results.slice(0, 8));
      }
    } catch {
      // Silent fail — global search is supplementary
    } finally {
      setGlobalLoading(false);
    }
  }, []);

  const handleSearchChange = (q: string) => {
    onSearchChange(q);
    // Debounce global search
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length >= 3) {
      debounceRef.current = setTimeout(() => searchGlobal(q.trim()), 600);
    } else {
      setGlobalResults([]);
    }
  };

  // Clear global results when search closes
  useEffect(() => {
    if (!searchOpen) setGlobalResults([]);
  }, [searchOpen]);

  const currentTitle = TAB_TITLES[activeTab] || "DISCOVERY";

  return (
    <div
      className="sticky top-0 z-30"
      style={{
        background: "rgba(3,3,15,0.92)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "calc(env(safe-area-inset-top, 12px) + 10px) 20px 14px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      {searchOpen ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-3)" }} />
            <input
              ref={inputRef}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search TDZ + global music library..."
              className="w-full h-10 pl-10 pr-10 text-sm outline-none font-body"
              style={{
                background: "var(--glass-1)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-pill)",
                color: "var(--text-1)",
                backdropFilter: "blur(12px)",
              }}
            />
            {globalLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin" style={{ color: "#00CFFF" }} />
            )}
          </div>
          <button
            onClick={() => { setSearchOpen(false); onSearchChange(""); setGlobalResults([]); }}
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
            <div className="flex items-center gap-2.5" style={{ marginTop: 2 }}>
              {activeTab === "discover" && (
                <img src={tdzLogo} alt="TDZ logo" className="h-8 w-auto object-contain" />
              )}
              <h1 style={{ fontSize: 28, color: "var(--text-1)", lineHeight: 1.1 }}>
                {currentTitle}
              </h1>
            </div>
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

// Export global results hook for parent to consume
export function useGlobalSearchResults() {
  return { globalResults: [], globalLoading: false };
}
