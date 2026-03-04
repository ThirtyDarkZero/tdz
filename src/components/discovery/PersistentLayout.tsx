import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Menu, Search, X, Flame, TrendingUp, 
  Users, ListMusic, ShoppingBag, Settings, Heart,
  ChevronLeft, Globe, Sparkles, Compass, Mic2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import tdzLogo from "@/assets/tdz-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { CosmicBackground } from "./CosmicBackground";

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
  { id: "ai-mix", label: "AI Mix", icon: Sparkles },
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
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setCollapsed(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isArtist = role === "artist" || role === "verified_artist" || role === "manager";
  const sidebarWidth = collapsed ? 'lg:ml-16' : 'lg:ml-56';

  const navBtnClass = (id: string) => `
    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
    transition-all duration-200
    ${activeTab === id ? 'text-[#00CFFF]' : 'text-[#777] hover:text-white'}
    ${collapsed ? 'justify-center px-2' : ''}
  `;

  const navBtnActiveBg = (id: string) => activeTab === id 
    ? { background: "rgba(0,207,255,0.08)", boxShadow: "0 0 15px rgba(0,207,255,0.1)" } 
    : {};

  return (
    <CosmicBackground className="min-h-screen" intensity="medium">
      <div className="flex w-full" style={{ fontFamily: "'Raleway', sans-serif" }}>
        {/* Desktop Sidebar - Cosmic glass */}
        <aside className={`
          hidden lg:flex flex-col fixed top-0 left-0 h-full z-40
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-16' : 'w-56'}
        `} style={{ 
          background: "rgba(5,5,15,0.85)", 
          backdropFilter: "blur(20px) saturate(150%)",
          borderRight: "1px solid rgba(139,92,246,0.15)" 
        }}>
          {/* Logo */}
          <div className="h-14 flex items-center justify-between px-3" style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
            {!collapsed && (
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
                <img src={tdzLogo} alt="TDZ" className="h-7 w-auto" />
                <span style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 22, color: "#fff", letterSpacing: "0.06em" }}>TDZ</span>
              </div>
            )}
            {collapsed && (
              <img src={tdzLogo} alt="TDZ" className="h-7 w-auto mx-auto cursor-pointer" onClick={() => navigate("/")} />
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-[#555] hover:text-white h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-all"
            >
              <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-3 px-2 overflow-y-auto">
            <div className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={navBtnClass(item.id)}
                  style={{ ...navBtnActiveBg(item.id), fontFamily: "'Raleway', sans-serif", letterSpacing: "0.05em" }}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              ))}
            </div>

            <div className="my-3" style={{ borderTop: "1px solid rgba(139,92,246,0.1)" }} />

            <div className="space-y-1">
              <button
                onClick={() => navigate("/liked-songs")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#777] hover:text-white transition-all duration-200 ${collapsed ? 'justify-center px-2' : ''}`}
                title={collapsed ? "Liked Songs" : undefined}
              >
                <Heart className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>Liked Songs</span>}
              </button>

              {isArtist && (
                <button
                  onClick={() => navigate("/studio")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#777] hover:text-white transition-all duration-200 ${collapsed ? 'justify-center px-2' : ''}`}
                  title={collapsed ? "Studio" : undefined}
                >
                  <Mic2 className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>Studio</span>}
                </button>
              )}
            </div>
          </nav>

          <div className="p-2" style={{ borderTop: "1px solid rgba(139,92,246,0.1)" }}>
            <button
              onClick={() => navigate("/profile")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#777] hover:text-white transition-all duration-200 ${collapsed ? 'justify-center px-2' : ''}`}
              title={collapsed ? "Settings" : undefined}
            >
              <Settings className="w-5 h-5" />
              {!collapsed && <span>Settings</span>}
            </button>
          </div>
        </aside>

        {/* Mobile Header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-50" style={{ 
          background: "rgba(3,3,8,0.9)", 
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(139,92,246,0.15)" 
        }}>
          <div className="flex items-center justify-between h-14 px-4 max-w-screen-sm mx-auto">
            <button onClick={() => setMobileOpen(true)} className="text-[#777] hover:text-white h-9 w-9 flex items-center justify-center">
              <Menu className="w-5 h-5" />
            </button>
            <img src={tdzLogo} alt="TDZ" className="h-7 w-auto cursor-pointer" onClick={() => navigate("/")} />
            <button onClick={onToggleSearch} className="text-[#777] hover:text-white h-9 w-9 flex items-center justify-center">
              {showSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>
          </div>
          {showSearch && (
            <div className="px-4 pb-3 max-w-screen-sm mx-auto">
              <Input
                type="search"
                placeholder="Search tracks, artists..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full border-[#222] text-white placeholder:text-[#555]"
                style={{ background: "rgba(10,10,20,0.8)" }}
              />
            </div>
          )}
        </header>

        {/* Mobile Sidebar Overlay */}
        {mobileOpen && (
          <>
            <div className="lg:hidden fixed inset-0 bg-black/60 z-50" onClick={() => setMobileOpen(false)} />
            <aside className="lg:hidden fixed top-0 left-0 bottom-0 w-64 z-50 animate-in slide-in-from-left duration-300" style={{ 
              background: "rgba(5,5,15,0.95)", 
              backdropFilter: "blur(20px)",
              borderRight: "1px solid rgba(139,92,246,0.15)" 
            }}>
              <div className="h-14 flex items-center justify-between px-4" style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
                <div className="flex items-center gap-2">
                  <img src={tdzLogo} alt="TDZ" className="h-7 w-auto" />
                  <span style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 22, color: "#fff", letterSpacing: "0.06em" }}>TDZ</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="text-[#555] hover:text-white h-9 w-9 flex items-center justify-center">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="py-3 px-2 overflow-y-auto max-h-[calc(100vh-3.5rem)]">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { onTabChange(item.id); setMobileOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === item.id ? 'text-[#00CFFF]' : 'text-[#777] hover:text-white'}`}
                    style={activeTab === item.id ? { background: "rgba(0,207,255,0.08)" } : {}}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                ))}
                <div className="my-3" style={{ borderTop: "1px solid rgba(139,92,246,0.1)" }} />
                <button onClick={() => { navigate("/liked-songs"); setMobileOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-[#777] hover:text-white transition-all">
                  <Heart className="w-5 h-5" /><span>Liked Songs</span>
                </button>
                {isArtist && (
                  <button onClick={() => { navigate("/studio"); setMobileOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-[#777] hover:text-white transition-all">
                    <Mic2 className="w-5 h-5" /><span>Studio</span>
                  </button>
                )}
                <div className="my-3" style={{ borderTop: "1px solid rgba(139,92,246,0.1)" }} />
                <button onClick={() => { navigate("/profile"); setMobileOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-[#777] hover:text-white transition-all">
                  <Settings className="w-5 h-5" /><span>Settings</span>
                </button>
              </nav>
            </aside>
          </>
        )}

        {/* Main Content */}
        <main className={`flex-1 min-h-screen w-full ${sidebarWidth} pt-14 lg:pt-0 pb-24 sm:pb-28 transition-all duration-300 ease-in-out`}>
          <div className="w-full max-w-full overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
    </CosmicBackground>
  );
}
