import { ReactNode } from "react";

interface DiscoveryLayoutProps {
  leftColumn: ReactNode;
  centerColumn: ReactNode;
  rightColumn: ReactNode;
  header: ReactNode;
  player: ReactNode;
  isAuthenticated?: boolean;
}

export function DiscoveryLayout({ 
  leftColumn, 
  centerColumn, 
  rightColumn, 
  header, 
  player,
  isAuthenticated = true
}: DiscoveryLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-[1200px] h-[1200px] bg-primary/15 rounded-full blur-[200px] animate-pulse animated-gradient" />
        <div className="absolute top-1/4 right-0 w-[900px] h-[900px] bg-secondary/10 rounded-full blur-[180px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-0 left-1/3 w-[800px] h-[800px] bg-accent/10 rounded-full blur-[160px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-glow/5 rounded-full blur-[140px]" />
      </div>

      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-card-premium border-b neon-border-strong shadow-glow-lg">
        {header}
      </header>

      {/* Main Content Area - Below header, above player */}
      <div className="flex-1 pt-16 pb-24 relative z-10">
        <div className="h-full flex">
          {/* Left Column - Album Art & Artist Info */}
          <aside className={`hidden lg:block w-80 xl:w-96 flex-shrink-0 overflow-y-auto scrollbar-hide ${
            !isAuthenticated 
              ? 'border-r-2 border-primary/40 shadow-[2px_0_8px_-2px_rgba(var(--primary)/0.3)]' 
              : 'border-r border-border/30'
          }`}>
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
          <aside className={`hidden xl:block w-80 flex-shrink-0 overflow-y-auto scrollbar-hide ${
            !isAuthenticated 
              ? 'border-l-2 border-primary/40 shadow-[-2px_0_8px_-2px_rgba(var(--primary)/0.3)]' 
              : 'border-l border-border/30'
          }`}>
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