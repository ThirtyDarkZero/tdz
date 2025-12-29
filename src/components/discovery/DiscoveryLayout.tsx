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
      {/* Multi-layer animated background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Base mesh gradient */}
        <div className="absolute inset-0 mesh-bg opacity-40" />
        
        {/* Primary aurora orb */}
        <div 
          className="absolute -top-[400px] -left-[200px] w-[1000px] h-[1000px] rounded-full animate-breathe"
          style={{
            background: 'radial-gradient(circle, hsl(127 100% 60% / 0.15) 0%, transparent 70%)',
            filter: 'blur(60px)'
          }}
        />
        
        {/* Secondary orb */}
        <div 
          className="absolute top-[20%] -right-[300px] w-[800px] h-[800px] rounded-full animate-breathe"
          style={{
            background: 'radial-gradient(circle, hsl(280 100% 65% / 0.12) 0%, transparent 70%)',
            filter: 'blur(80px)',
            animationDelay: '-2s'
          }}
        />
        
        {/* Accent orb */}
        <div 
          className="absolute -bottom-[200px] left-[30%] w-[700px] h-[700px] rounded-full animate-breathe"
          style={{
            background: 'radial-gradient(circle, hsl(200 100% 60% / 0.1) 0%, transparent 70%)',
            filter: 'blur(100px)',
            animationDelay: '-4s'
          }}
        />
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(127 100% 60% / 0.3) 1px, transparent 1px),
              linear-gradient(90deg, hsl(127 100% 60% / 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px'
          }}
        />
        
        {/* Top gradient vignette */}
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-background to-transparent" />
      </div>

      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="glass-ultra border-b border-white/5 shadow-3d">
          {header}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 pt-16 pb-28 relative z-10">
        <div className="h-full flex">
          {/* Left Column */}
          <aside className={`
            hidden lg:block w-80 xl:w-96 flex-shrink-0 overflow-y-auto scrollbar-premium
            ${!isAuthenticated 
              ? 'border-r border-primary/20' 
              : 'border-r border-white/5'
            }
          `}>
            <div className="p-4 space-y-4">
              {leftColumn}
            </div>
          </aside>

          {/* Center Column */}
          <main className="flex-1 overflow-y-auto scrollbar-premium">
            <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
              {centerColumn}
            </div>
          </main>

          {/* Right Column */}
          <aside className={`
            hidden xl:block w-80 flex-shrink-0 overflow-y-auto scrollbar-premium
            ${!isAuthenticated 
              ? 'border-l border-primary/20' 
              : 'border-l border-white/5'
            }
          `}>
            <div className="p-4 space-y-4">
              {rightColumn}
            </div>
          </aside>
        </div>
      </div>

      {/* Fixed Player - only render if player prop is provided (legacy support) */}
      {/* The global player is now rendered at App level */}
      {player && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="glass-ultra border-t border-white/5 shadow-3d-lg">
            {player}
          </div>
        </div>
      )}
    </div>
  );
}