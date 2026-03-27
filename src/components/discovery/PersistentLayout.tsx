import { ReactNode } from "react";
import { BottomNavBar } from "./BottomNavBar";
import { SpaceBackground } from "./SpaceBackground";

interface PersistentLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showSearch: boolean;
  onToggleSearch: () => void;
}

export function PersistentLayout({ children, activeTab, onTabChange }: PersistentLayoutProps) {
  return (
    <div className="min-h-screen relative" style={{ background: "#03030F" }}>
      <SpaceBackground />
      <div className="relative z-[1] min-h-screen pb-28">
        {children}
      </div>
      <BottomNavBar activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
