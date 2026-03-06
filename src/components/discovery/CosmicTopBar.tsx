import { Search, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import tdzLogo from "@/assets/tdz-logo.png";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ArtistAvatar } from "./ArtistAvatar";

interface CosmicTopBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const TABS = [
  { id: "discover", label: "HOME" },
  { id: "trending", label: "EXPLORE" },
  { id: "library", label: "LIBRARY" },
  { id: "playlists", label: "RADIO" },
  { id: "artists", label: "ARTISTS" },
];

export function CosmicTopBar({ activeTab, onTabChange, searchQuery, onSearchChange }: CosmicTopBarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchFocused, setSearchFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="sticky top-0 z-30" style={{
      height: 64,
      background: "rgba(5,5,16,0.75)",
      backdropFilter: "blur(24px)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 sm:px-8">
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer flex-shrink-0"
          onClick={() => navigate("/")}
        >
          <img src={tdzLogo} alt="TDZ" className="h-8 w-auto" />
        </div>

        {/* Navigation tabs */}
        <nav className="hidden md:flex items-center gap-1 ml-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="px-4 py-2 text-xs font-semibold tracking-widest uppercase whitespace-nowrap transition-all"
              style={{
                fontFamily: "'Raleway', sans-serif",
                color: activeTab === tab.id ? "#FFFFFF" : "rgba(255,255,255,0.65)",
                borderBottom: activeTab === tab.id ? "2px solid #00CFFF" : "2px solid transparent",
                letterSpacing: "0.1em",
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Right side: Search + Avatar */}
        <div className="flex items-center gap-4">
          {/* Search bar */}
          <div className="relative hidden sm:block">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: "rgba(255,255,255,0.35)" }}
            />
            {searchQuery && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => onSearchChange("")}
              >
                <X className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.4)" }} />
              </button>
            )}
            <input
              ref={inputRef}
              type="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="outline-none transition-all"
              style={{
                width: searchFocused ? 300 : 220,
                height: 36,
                background: "rgba(255,255,255,0.06)",
                border: `1px solid ${searchFocused ? "#00CFFF" : "rgba(255,255,255,0.1)"}`,
                borderRadius: 999,
                padding: "0 36px 0 38px",
                fontFamily: "'Raleway', sans-serif",
                fontSize: 13,
                color: "#FFFFFF",
              }}
            />
          </div>

          {/* User avatar */}
          <div
            className="cursor-pointer"
            onClick={() => navigate(user ? "/profile" : "/auth")}
          >
            <ArtistAvatar
              src={null}
              name={user?.email?.charAt(0) || "U"}
              size={32}
            />
          </div>
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="md:hidden flex items-center gap-1 px-4 overflow-x-auto scrollbar-hide" style={{
        background: "rgba(5,5,16,0.9)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="px-3 py-2 text-[10px] font-semibold tracking-widest uppercase whitespace-nowrap"
            style={{
              fontFamily: "'Raleway', sans-serif",
              color: activeTab === tab.id ? "#FFFFFF" : "rgba(255,255,255,0.5)",
              borderBottom: activeTab === tab.id ? "2px solid #00CFFF" : "2px solid transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
