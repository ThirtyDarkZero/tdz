import { Search, X, AudioLines } from "lucide-react";
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

  return (
    <div className="sticky top-0 z-30" style={{
      height: 56,
      background: "rgba(5,5,16,0.6)",
      backdropFilter: "blur(20px)",
    }}>
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-5">
        {/* Left: User avatar */}
        <div
          className="cursor-pointer"
          onClick={() => navigate(user ? "/profile" : "/auth")}
        >
          <ArtistAvatar
            src={avatarUrl}
            name={user?.email?.charAt(0) || userProfile?.display_name?.charAt(0) || "U"}
            size={36}
          />
        </div>

        {/* Center: Search (expandable) */}
        {searchOpen ? (
          <div className="flex-1 mx-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
            <input
              ref={inputRef}
              type="search"
              placeholder="Search artists, tracks, albums..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
              className="w-full outline-none"
              style={{
                height: 36,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(0,207,255,0.2)",
                borderRadius: 999,
                padding: "0 36px 0 36px",
                fontFamily: "'Raleway', sans-serif",
                fontSize: 13,
                color: "#FFFFFF",
              }}
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => { onSearchChange(""); setSearchOpen(false); }}>
              <X className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.4)" }} />
            </button>
          </div>
        ) : (
          <button onClick={openSearch} className="p-2 rounded-full hover:bg-white/5 transition-colors">
            <Search className="w-5 h-5" style={{ color: "rgba(255,255,255,0.5)" }} />
          </button>
        )}

        {/* Right: Hi-Fi badge */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(0,207,255,0.15)",
            backdropFilter: "blur(8px)",
          }}
        >
          <AudioLines className="w-3.5 h-3.5" style={{ color: "#00CFFF" }} />
          <span style={{
            fontFamily: "'Raleway', sans-serif",
            fontSize: 11,
            fontWeight: 700,
            color: "#FFFFFF",
            letterSpacing: "0.08em",
          }}>
            Hi-Fi
          </span>
        </div>
      </div>
    </div>
  );
}
