import { useNavigate } from "react-router-dom";
import { 
  X, 
  Flame, 
  Library, 
  TrendingUp, 
  Users, 
  ListMusic, 
  ShoppingBag,
  Home,
  Mic2,
  Settings,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

interface MinimalSidebarProps {
  open: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const NAV_SECTIONS = [
  {
    title: "TDZ",
    items: [
      { id: "discover", label: "Discover", icon: Flame },
      { id: "trending", label: "Trending", icon: TrendingUp },
    ]
  },
  {
    title: "Browse",
    items: [
      { id: "library", label: "Library", icon: Library },
      { id: "artists", label: "Artists", icon: Users },
      { id: "playlists", label: "Playlists", icon: ListMusic },
      { id: "merch", label: "Merch", icon: ShoppingBag },
    ]
  },
  {
    title: "You",
    items: [
      { id: "liked", label: "Liked Songs", icon: Heart },
    ]
  }
];

export function MinimalSidebar({ open, onClose, activeTab, onTabChange }: MinimalSidebarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role } = useUserRole(user);
  const isArtist = role === 'artist' || role === 'verified_artist' || role === 'manager';

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-50 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Sidebar Panel */}
      <div className="fixed top-0 left-0 bottom-0 w-72 bg-[#0a0a0a] border-r border-white/5 z-50 animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <span className="font-bold text-lg text-white">Menu</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <div className="p-4 space-y-6">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2 px-3">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'liked') {
                        navigate('/profile');
                        onClose();
                      } else {
                        onTabChange(item.id);
                      }
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                      transition-colors
                      ${activeTab === item.id 
                        ? 'bg-cyan-500/10 text-cyan-400' 
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Artist Studio Link */}
          {isArtist && (
            <div>
              <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2 px-3">
                Creator
              </p>
              <button
                onClick={() => {
                  navigate('/studio');
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Mic2 className="w-5 h-5" />
                Artist Studio
              </button>
            </div>
          )}

          {/* Bottom Links */}
          <div className="pt-4 border-t border-white/5">
            <button
              onClick={() => {
                navigate('/');
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Home className="w-5 h-5" />
              Home
            </button>
            <button
              onClick={() => {
                navigate('/profile');
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Settings className="w-5 h-5" />
              Settings
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
