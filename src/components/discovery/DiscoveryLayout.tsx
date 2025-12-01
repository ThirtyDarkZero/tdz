import { ReactNode } from "react";

interface DiscoveryLayoutProps {
  leftColumn: ReactNode;
  centerColumn: ReactNode;
  rightColumn: ReactNode;
  header: ReactNode;
  player: ReactNode;
}

export function DiscoveryLayout({ 
  leftColumn, 
  centerColumn, 
  rightColumn, 
  header, 
  player 
}: DiscoveryLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-card-premium border-b neon-border-strong shadow-glow-lg">
        {header}
      </header>

      {/* Main Content Area - Below header, above player */}
      <div className="flex-1 pt-16 pb-24">
        <div className="h-full flex">
          {/* Left Column - Album Art & Artist Info */}
          <aside className="hidden lg:block w-80 xl:w-96 flex-shrink-0 border-r border-border/30 overflow-y-auto scrollbar-hide">
            <div className="p-4 space-y-4">
              {leftColumn}
            </div>
          </aside>

          {/* Center Column - Main Content */}
          <main className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="max-w-5xl mx-auto p-4 md:p-6">
              {centerColumn}
            </div>
          </main>

          {/* Right Column - Library */}
          <aside className="hidden xl:block w-80 flex-shrink-0 border-l border-border/30 overflow-y-auto scrollbar-hide">
            <div className="p-4 space-y-4">
              {rightColumn}
            </div>
          </aside>
        </div>
      </div>

      {/* Fixed Player */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {player}
      </div>
    </div>
  );
}
