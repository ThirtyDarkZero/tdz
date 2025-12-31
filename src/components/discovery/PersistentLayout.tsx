import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Menu, Search, User, X, Home, Flame, Library, TrendingUp, 
  Users, ListMusic, ShoppingBag, Mic2, Settings, Heart,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  { id: "library", label: "Library", icon: Library },
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
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.debug("[PersistentLayout] render", {
      activeTab,
      collapsed,
      mobileOpen,
      userId: user?.id ?? null,
      role,
    });
  }, [activeTab, collapsed, mobileOpen, user?.id, role]);

  const isArtist = role === "artist" || role === "verified_artist" || role === "manager";

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Desktop Sidebar */}
      <aside className={`
        hidden lg:flex flex-col fixed top-0 left-0 h-full z-40
        bg-[#0a0a0a] border-r border-white/5
        transition-all duration-300
        ${collapsed ? 'w-20' : 'w-64'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
          {!collapsed && (
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <img src={tdzLogo} alt="TDZ" className="h-8 w-auto" />
              <span className="font-bold text-white">TDZ</span>
            </div>
          )}
          {collapsed && (
            <img 
              src={tdzLogo} 
              alt="TDZ" 
              className="h-8 w-auto mx-auto cursor-pointer" 
              onClick={() => navigate("/")}
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-white/50 hover:text-white hover:bg-white/5"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors
                  ${activeTab === item.id 
                    ? 'bg-cyan-500/10 text-cyan-400' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-white/5" />

          {/* User Section */}
          <div className="space-y-1">
            <button
              onClick={() => navigate("/profile")}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                text-white/60 hover:text-white hover:bg-white/5 transition-colors
                ${collapsed ? 'justify-center' : ''}
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
                  text-white/60 hover:text-white hover:bg-white/5 transition-colors
                  ${collapsed ? 'justify-center' : ''}
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
        <div className="p-2 border-t border-white/5">
          <button
            onClick={() => navigate("/profile")}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              text-white/60 hover:text-white hover:bg-white/5 transition-colors
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            <Settings className="w-5 h-5" />
            {!collapsed && <span>Settings</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center justify-between h-14 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            className="text-white/70 hover:text-white hover:bg-white/5"
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
            className="text-white/70 hover:text-white hover:bg-white/5"
          >
            {showSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <>
          <div 
            className="lg:hidden fixed inset-0 bg-black/60 z-50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed top-0 left-0 bottom-0 w-72 bg-[#0a0a0a] border-r border-white/5 z-50 animate-slide-in-right">
            <div className="h-14 flex items-center justify-between px-4 border-b border-white/5">
              <span className="font-bold text-white">Menu</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                className="text-white/70 hover:text-white hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <nav className="py-4 px-2">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setMobileOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-colors
                    ${activeTab === item.id 
                      ? 'bg-cyan-500/10 text-cyan-400' 
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className={`
        flex-1 min-h-screen
        lg:ml-64 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}
        pt-14 lg:pt-0 pb-28
        transition-all duration-300
      `}>
        {children}
      </main>
    </div>
  );
}
