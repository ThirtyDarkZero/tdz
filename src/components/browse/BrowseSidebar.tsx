import { Home, Disc3, Music, Users, ListMusic, Heart, Clock, Settings, Youtube, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';

type ContentType = 'albums' | 'tracks' | 'artists' | 'playlists';

interface BrowseSidebarProps {
  currentType: ContentType;
  onTypeChange: (type: ContentType) => void;
}

const mainNav = [
  { id: 'home', label: 'Home', icon: Home, path: '/discover' },
];

const browseNav = [
  { id: 'albums', label: 'Albums', icon: Disc3, count: null },
  { id: 'tracks', label: 'Tracks', icon: Music, count: null },
  { id: 'artists', label: 'Artists', icon: Users, count: null },
  { id: 'playlists', label: 'Playlists', icon: ListMusic, count: null },
];

const customNav = [
  { id: 'youtube', label: 'YouTube Music', icon: Youtube, path: '/discover?tab=youtube' },
];

const userNav = [
  { id: 'likes', label: 'Likes', icon: Heart, path: '/discover?tab=playlists' },
  { id: 'history', label: 'History', icon: Clock, path: '/discover' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/studio/settings' },
];

export function BrowseSidebar({ currentType, onTypeChange }: BrowseSidebarProps) {
  const navigate = useNavigate();

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl tracking-wider">TDZ</span>
        </div>

        {/* Main Nav */}
        <div className="space-y-1">
          <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Main
          </p>
          {mainNav.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
              onClick={() => navigate(item.path)}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </div>

        <Separator className="bg-border/50" />

        {/* Browse Nav */}
        <div className="space-y-1">
          <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Browse
          </p>
          {browseNav.map((item) => (
            <Button
              key={item.id}
              variant={currentType === item.id ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start gap-3",
                currentType === item.id 
                  ? "text-foreground bg-primary/10 border-l-2 border-primary rounded-l-none"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => onTypeChange(item.id as ContentType)}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </div>

        <Separator className="bg-border/50" />

        {/* Custom */}
        <div className="space-y-1">
          <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Custom
          </p>
          {customNav.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
              onClick={() => navigate(item.path)}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </div>

        <Separator className="bg-border/50" />

        {/* User */}
        <div className="space-y-1">
          <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Library
          </p>
          {userNav.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
              onClick={() => navigate(item.path)}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
