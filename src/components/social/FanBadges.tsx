import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  Trophy, 
  Sparkles, 
  Music, 
  Users, 
  Heart,
  MessageCircle,
  ListMusic,
  Compass
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FanBadgesProps {
  badges: string[];
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

const badgeConfig: Record<string, {
  icon: React.ComponentType<any>;
  label: string;
  description: string;
  color: string;
  bgColor: string;
}> = {
  early_adopter: {
    icon: Star,
    label: 'Early Adopter',
    description: 'Joined TDZ in the first wave',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/20'
  },
  curator: {
    icon: ListMusic,
    label: 'Curator',
    description: 'Created 5+ public playlists',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/20'
  },
  tastemaker: {
    icon: Sparkles,
    label: 'Tastemaker',
    description: 'Playlists with 100+ followers',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/20'
  },
  collector: {
    icon: Heart,
    label: 'Collector',
    description: 'Liked 100+ tracks',
    color: 'text-red-500',
    bgColor: 'bg-red-500/20'
  },
  top_commenter: {
    icon: MessageCircle,
    label: 'Top Commenter',
    description: 'Left 50+ thoughtful comments',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/20'
  },
  playlist_master: {
    icon: Trophy,
    label: 'Playlist Master',
    description: 'Created viral playlists',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/20'
  },
  social_butterfly: {
    icon: Users,
    label: 'Social Butterfly',
    description: '50+ followers gained',
    color: 'text-green-500',
    bgColor: 'bg-green-500/20'
  },
  music_explorer: {
    icon: Compass,
    label: 'Music Explorer',
    description: 'Listened to 10+ genres',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/20'
  },
  super_fan: {
    icon: Music,
    label: 'Super Fan',
    description: 'Top 1% listener on TDZ',
    color: 'text-primary',
    bgColor: 'bg-primary/20'
  }
};

export function FanBadges({ badges, size = 'md', showLabels = false, className }: FanBadgesProps) {
  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const badgeSize = {
    sm: 'h-5 px-1.5 text-[10px]',
    md: 'h-6 px-2 text-xs',
    lg: 'h-7 px-2.5 text-sm'
  };

  return (
    <TooltipProvider>
      <div className={cn("flex flex-wrap gap-1", className)}>
        {badges.map((badge) => {
          const config = badgeConfig[badge];
          if (!config) return null;

          const Icon = config.icon;

          return (
            <Tooltip key={badge}>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline"
                  className={cn(
                    "gap-1 cursor-help transition-all hover:scale-105",
                    badgeSize[size],
                    config.bgColor,
                    config.color
                  )}
                >
                  <Icon className={iconSize[size]} />
                  {showLabels && <span>{config.label}</span>}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px]">
                <div className="space-y-1">
                  <p className="font-semibold">{config.label}</p>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

export function FanLevel({ level, xp }: { level: number; xp: number }) {
  const getNextLevelXP = (currentLevel: number) => currentLevel * 100;
  const currentLevelXP = level > 1 ? (level - 1) * 100 : 0;
  const nextLevelXP = getNextLevelXP(level);
  const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

  const getLevelColor = () => {
    if (level >= 20) return 'from-yellow-500 to-amber-500';
    if (level >= 15) return 'from-purple-500 to-pink-500';
    if (level >= 10) return 'from-blue-500 to-cyan-500';
    if (level >= 5) return 'from-green-500 to-emerald-500';
    return 'from-primary to-primary/70';
  };

  return (
    <div className="flex items-center gap-3">
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-br",
        getLevelColor()
      )}>
        {level}
      </div>
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="font-medium">Level {level}</span>
          <span className="text-muted-foreground">{xp} / {nextLevelXP} XP</span>
        </div>
        <div className="h-2 bg-accent rounded-full overflow-hidden">
          <div 
            className={cn("h-full bg-gradient-to-r transition-all", getLevelColor())}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
