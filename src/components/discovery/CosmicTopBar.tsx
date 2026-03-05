import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

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
  return (
    <div className="sticky top-0 z-30 px-4 py-3" style={{
      background: "rgba(3,3,8,0.7)",
      backdropFilter: "blur(20px) saturate(150%)",
      borderBottom: "1px solid rgba(139,92,246,0.1)",
    }}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Navigation tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="px-4 py-2 text-xs font-semibold tracking-widest uppercase whitespace-nowrap transition-all duration-200"
              style={{
                fontFamily: "'Raleway', sans-serif",
                color: activeTab === tab.id ? "#fff" : "#666",
                borderBottom: activeTab === tab.id ? "2px solid #00CFFF" : "2px solid transparent",
                letterSpacing: "0.15em",
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Search */}
        <div className="relative hidden sm:block w-48 md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#555" }} />
          <Input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-8 text-xs border-0 rounded-full"
            style={{
              background: "rgba(139,92,246,0.06)",
              color: "#fff",
              fontFamily: "'Raleway', sans-serif",
            }}
          />
        </div>
      </div>
    </div>
  );
}
