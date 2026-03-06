import { ReactNode } from "react";
import { SpaceBackground } from "./SpaceBackground";
import { CosmicPlayerBar } from "./CosmicPlayerBar";

interface PersistentLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showSearch: boolean;
  onToggleSearch: () => void;
}

export function PersistentLayout({
  children,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  showSearch,
  onToggleSearch,
}: PersistentLayoutProps) {
  return (
    <div className="min-h-screen relative" style={{ background: "#050510" }}>
      <SpaceBackground />
      {/* All content sits above the space background */}
      <div className="relative z-[1] min-h-screen pb-24">
        {children}
      </div>
      <CosmicPlayerBar />
    </div>
  );
}
