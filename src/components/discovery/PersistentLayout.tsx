import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Menu, Search, X, Flame, Library, TrendingUp, 
  Users, ListMusic, ShoppingBag, Mic2, Settings, Heart,
  ChevronLeft, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import tdzLogo from "@/assets/tdz-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

interface PersistentLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showSearch: boolean;
  onToggleSearch: () => void;
}

const NAV_ITEMS = [
  { id: "discover", label: "Discover", icon: Flame },
  { id: "trending", label: "Trending", icon: TrendingUp },
  { id: "library", label: "Global Library", icon: Globe },
  { id: "artists", label: "Artists", icon: Users },
  { id: "playlists", label: "Playlists", icon: ListMusic },
  { id: "merch", label: "Merch", icon: ShoppingBag },
];

export function PersistentLayout({
  children,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  showSearch,
  onToggleSearch
}: PersistentLayoutProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role } = useUserRole(user);
  const [collapsed, setCollapsed] = useState(true); // Default collapsed on mobile
  const [mobileOpen, setMobileOpen] = useState(false);

  // Collapse sidebar by default on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isArtist = role === "artist" || role === "verified_artist" || role === "manager";

  // Calculate main content margin based on sidebar state
  const sidebarWidth = collapsed ? 'lg:ml-16' : 'lg:ml-56';

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Desktop Sidebar */}
      <aside className={`
        hidden lg:flex flex-col fixed top-0 left-0 h-full z-40
        bg-background border-r border-border/50
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-56'}
      `}>
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-3 border-b border-border/50">
          {!collapsed && (
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <img src={tdzLogo} alt="TDZ" className="h-7 w-auto" />
              <span className="font-bold text-sm">TDZ</span>
            </div>
          )}
          {collapsed && (
            <img 
              src={tdzLogo} 
              alt="TDZ" 
              className="h-7 w-auto mx-auto cursor-pointer" 
              onClick={() => navigate("/")}
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 h-8 w-8"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${activeTab === item.id 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }
                  ${collapsed ? 'justify-center px-2' : ''}
                `}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="my-3 border-t border-border/50" />

          {/* User Section */}
          <div className="space-y-1">
            <button
              onClick={() => navigate("/liked-songs")}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200
                ${collapsed ? 'justify-center px-2' : ''}
              `}
              title={collapsed ? "Liked Songs" : undefined}
            >
              <Heart className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>Liked Songs</span>}
            </button>

            {isArtist && (
              <button
                onClick={() => navigate("/studio")}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200
                  ${collapsed ? 'justify-center px-2' : ''}
                `}
                title={collapsed ? "Studio" : undefined}
              >
                <Mic2 className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>Studio</span>}
              </button>
            )}
          </div>
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t border-border/50">
          <button
            onClick={() => navigate("/profile")}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200
              ${collapsed ? 'justify-center px-2' : ''}
            `}
            title={collapsed ? "Settings" : undefined}
          >
            <Settings className="w-5 h-5" />
            {!collapsed && <span>Settings</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between h-14 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 h-9 w-9"
          >
            <Menu className="w-5 h-5" />
          </Button>

          <img 
            src={tdzLogo} 
            alt="TDZ" 
            className="h-7 w-auto cursor-pointer" 
            onClick={() => navigate("/")}
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSearch}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 h-9 w-9"
          >
            {showSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Search Bar */}
        {showSearch && (
          <div className="px-4 pb-3">
            <Input
              type="search"
              placeholder="Search tracks, artists..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-muted/50 border-border/50"
            />
          </div>
        )}
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <>
          <div 
            className="lg:hidden fixed inset-0 bg-black/60 z-50 transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed top-0 left-0 bottom-0 w-64 bg-background border-r border-border/50 z-50 animate-in slide-in-from-left duration-300">
            <div className="h-14 flex items-center justify-between px-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <img src={tdzLogo} alt="TDZ" className="h-7 w-auto" />
                <span className="font-bold">TDZ</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                className="text-muted-foreground hover:text-foreground hover:bg-muted/50 h-9 w-9"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <nav className="py-3 px-2 overflow-y-auto max-h-[calc(100vh-3.5rem)]">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setMobileOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium
                    transition-all duration-200
                    ${activeTab === item.id 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}

              <div className="my-3 border-t border-border/50" />

              <button
                onClick={() => {
                  navigate("/liked-songs");
                  setMobileOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
              >
                <Heart className="w-5 h-5" />
                <span>Liked Songs</span>
              </button>

              {isArtist && (
                <button
                  onClick={() => {
                    navigate("/studio");
                    setMobileOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                >
                  <Mic2 className="w-5 h-5" />
                  <span>Studio</span>
                </button>
              )}

              <div className="my-3 border-t border-border/50" />

              <button
                onClick={() => {
                  navigate("/profile");
                  setMobileOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>
            </nav>
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className={`
        flex-1 min-h-screen w-full
        ${sidebarWidth}
        pt-14 lg:pt-0 pb-24 sm:pb-28
        transition-all duration-300 ease-in-out
      `}>
        <div className="w-full max-w-full overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
