import { ReactNode, useState } from "react";
import { MinimalHeader } from "./MinimalHeader";
import { MinimalSidebar } from "./MinimalSidebar";

interface MinimalLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function MinimalLayout({ 
  children, 
  activeTab, 
  onTabChange,
  searchQuery,
  onSearchChange
}: MinimalLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <MinimalHeader 
        onMenuClick={() => setSidebarOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
      />

      {/* Sidebar */}
      <MinimalSidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        onTabChange={(tab) => {
          onTabChange(tab);
          setSidebarOpen(false);
        }}
      />

      {/* Main Content */}
      <main className="pt-16 pb-28 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
