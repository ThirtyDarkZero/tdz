import { Search, Bell, X } from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface CosmicTopBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  userProfile?: { profile_image_path?: string | null; display_name?: string } | null;
}

export function CosmicTopBar({ activeTab, searchQuery, onSearchChange, userProfile }: CosmicTopBarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const avatarUrl = (() => {
    const raw = userProfile?.profile_image_path;
    if (!raw) return null;
    if (raw.startsWith("http")) return raw;
    return supabase.storage.from("listener-images").getPublicUrl(raw).data.publicUrl;
  })();

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const TAB_TITLES: Record<string, string> = {
    discover: "Discover",
    trending: "Search",
    library: "Your Library",
    artists: "Profile",
  };

  return (
    <div
      className="sticky top-0 z-30"
      style={{
        background: "rgba(13,13,13,0.88)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      <div className="flex items-center justify-between px-5 h-[56px] max-w-7xl mx-auto">
        {searchOpen ? (
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "rgba(255,255,255,0.3)" }} />
              <input
                ref={inputRef}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search songs, artists..."
                className="w-full h-10 pl-10 pr-4 rounded-xl text-sm outline-none transition-colors"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#fff",
                }}
              />
            </div>
            <button
              onClick={() => { setSearchOpen(false); onSearchChange(""); }}
              className="p-2 transition-colors"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>
              {TAB_TITLES[activeTab] || "Discover"}
            </h1>
            <div className="flex items-center gap-1">
              <button
                onClick={openSearch}
                className="p-2.5 rounded-full transition-colors"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                <Search className="h-5 w-5" />
              </button>
              <button
                className="p-2.5 rounded-full transition-colors"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                <Bell className="h-5 w-5" />
              </button>
              <button
                onClick={() => user ? navigate("/profile") : navigate("/auth")}
                className="ml-1"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" style={{ border: "2px solid rgba(255,255,255,0.1)" }} />
                ) : (
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center"
                    style={{ background: "hsl(var(--primary) / 0.15)", border: "2px solid hsl(var(--primary) / 0.3)" }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: "hsl(var(--primary))" }}>
                      {user?.email?.[0]?.toUpperCase() || "?"}
                    </span>
                  </div>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
