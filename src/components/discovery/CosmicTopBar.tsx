import { Search, Bell, X } from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ArtistAvatar } from "./ArtistAvatar";
import { supabase } from "@/integrations/supabase/client";

interface CosmicTopBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  userProfile?: { profile_image_path?: string | null; display_name?: string } | null;
}

export function CosmicTopBar({ activeTab, onTabChange, searchQuery, onSearchChange, userProfile }: CosmicTopBarProps) {
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

  // Titles per tab
  const tabTitles: Record<string, string> = {
    discover: "Discover",
    trending: "Search",
    library: "Library",
    artists: "Profile",
  };

  return (
    <div
      className="sticky top-0 z-30"
      style={{
        background: "rgba(18,18,18,0.92)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-5 h-14">
        {/* Left: Title or search */}
        {searchOpen ? (
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                ref={inputRef}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search songs, artists..."
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-white/5 border border-white/8 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40 transition-colors"
              />
            </div>
            <button
              onClick={() => { setSearchOpen(false); onSearchChange(""); }}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-lg font-bold text-foreground">
              {tabTitles[activeTab] || "Discover"}
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={openSearch}
                className="p-2 rounded-full hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Search className="h-5 w-5" />
              </button>
              <button className="p-2 rounded-full hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
                <Bell className="h-5 w-5" />
              </button>
              <button
                onClick={() => user ? navigate("/profile") : navigate("/auth")}
                className="ml-1"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover border border-white/10" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">
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
