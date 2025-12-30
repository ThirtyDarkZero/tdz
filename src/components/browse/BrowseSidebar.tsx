import { Home, Disc3, Music, Users, ListMusic, Heart, Clock, Settings, Youtube, Sparkles, ChevronUp, DollarSign, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNavigate, useLocation } from 'react-router-dom';
import tdzLogo from "@/assets/tdz-logo.png";

type ContentType = 'albums' | 'tracks' | 'artists' | 'playlists';

interface BrowseSidebarProps {
  currentType: ContentType;
  onTypeChange: (type: ContentType) => void;
}

// RKHM-style navigation structure
const rkhmnav = [
  { id: 'home', label: 'Home', icon: Home, path: '/discover' },
  { id: 'home-2', label: 'Home - 2', icon: Home, path: '/discover?tab=trending' },
  { id: 'home-3', label: 'Home - 3', icon: Home, path: '/discover?tab=genres' },
];

const customNav = [
  { id: 'browse', label: 'Browse page', icon: Disc3, path: '/browse' },
  { id: 'big-slider', label: 'Big slider #1', icon: Sparkles, path: '/discover?tab=featured' },
  { id: 'vertical-slider', label: 'Vertical Slider', icon: Music, path: '/discover?tab=new' },
];

const userNav = [
  { id: 'upgrade', label: 'Upgrade', icon: ChevronUp, path: '/pricing' },
  { id: 'add-funds', label: 'Add funds', icon: DollarSign, path: '/checkout' },
  { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
  { id: 'playlists', label: 'Playlists', icon: ListMusic, path: '/discover?tab=playlists' },
  { id: 'likes', label: 'Likes', icon: Heart, path: '/discover?tab=playlists' },
  { id: 'history', label: 'History', icon: Clock, path: '/discover' },
  { id: 'settings', label: 'Setting', icon: Settings, path: '/studio/settings' },
];

const browseNav = [
  { id: 'albums', label: 'Albums', icon: Disc3 },
  { id: 'tracks', label: 'Tracks', icon: Music },
  { id: 'artists', label: 'Artists', icon: Users },
  { id: 'playlists', label: 'Playlists', icon: ListMusic },
];

export function BrowseSidebar({ currentType, onTypeChange }: BrowseSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isBrowsePage = location.pathname === '/browse';

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {/* Logo - RKHM Style */}
        <div className="flex items-center gap-3 px-2 py-2">
          <img 
            src={tdzLogo}
            alt="TDZ"
            className="w-8 h-8 rounded cursor-pointer"
            onClick={() => navigate('/')}
          />
          <span className="font-display text-lg font-bold tracking-wider">TDZ</span>
        </div>

        {/* RKHM Section */}
        <div className="space-y-1">
          <p className="px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
            TDZ
          </p>
          {rkhmnav.map((item) => {
            const isActive = location.pathname === item.path || 
              (location.pathname + location.search) === item.path;
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-10",
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                onClick={() => navigate(item.path)}
              >
                <item.icon className="h-4 w-4" />
                <span className="text-sm">{item.label}</span>
              </Button>
            );
          })}
        </div>

        <Separator className="bg-border/30" />

        {/* Custom Section */}
        <div className="space-y-1">
          <p className="px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
            CUSTOM
          </p>
          {customNav.map((item) => {
            const isActive = location.pathname === item.path || 
              (location.pathname + location.search) === item.path;
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-10",
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                onClick={() => navigate(item.path)}
              >
                <item.icon className="h-4 w-4" />
                <span className="text-sm">{item.label}</span>
              </Button>
            );
          })}
        </div>

        <Separator className="bg-border/30" />

        {/* User Section */}
        <div className="space-y-1">
          <p className="px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
            USER
          </p>
          {userNav.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-10",
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                onClick={() => navigate(item.path)}
              >
                <item.icon className="h-4 w-4" />
                <span className="text-sm">{item.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Browse Content Types - Only show on browse page */}
        {isBrowsePage && (
          <>
            <Separator className="bg-border/30" />
            <div className="space-y-1">
              <p className="px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                BROWSE
              </p>
              {browseNav.map((item) => (
                <Button
                  key={item.id}
                  variant={currentType === item.id ? 'secondary' : 'ghost'}
                  className={cn(
                    "w-full justify-start gap-3 h-10",
                    currentType === item.id 
                      ? "text-foreground bg-primary/20 border-l-2 border-primary rounded-l-none"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                  onClick={() => onTypeChange(item.id as ContentType)}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="text-sm">{item.label}</span>
                </Button>
              ))}
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  );
}
