import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import tdzLogo from "@/assets/tdz-logo.png";
import { 
  Plus, 
  Sparkles,
  BarChart3,
  Megaphone,
  GraduationCap,
  Settings2,
  Compass,
  LifeBuoy,
  Crown,
  Music4
} from "lucide-react";

interface StudioSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onUploadClick: () => void;
  artistName: string;
  profileImage?: string;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

const navItems = [
  { id: "home", icon: Sparkles, label: "Dashboard" },
  { id: "music", icon: Music4, label: "Music" },
  { id: "insights", icon: BarChart3, label: "Insights" },
  { id: "promote", icon: Megaphone, label: "Promote" },
  { id: "learn", icon: GraduationCap, label: "Academy" },
  { id: "settings", icon: Settings2, label: "Settings" },
];

export const StudioSidebar = ({ 
  activeSection, 
  onSectionChange, 
  onUploadClick,
  artistName,
  profileImage,
  collapsed,
  onCollapsedChange
}: StudioSidebarProps) => {
  const navigate = useNavigate();
  const [isHovering, setIsHovering] = useState(false);
  const [isCEO, setIsCEO] = useState(false);

  useEffect(() => {
    const checkCEOStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email === "info@thirtydarkzero.com") {
        setIsCEO(true);
      }
    };
    checkCEOStatus();
  }, []);

  const shouldExpand = !collapsed || isHovering;

  return (
    <div 
      className={cn(
        "fixed left-0 top-0 h-screen bg-card/80 backdrop-blur-xl border-r border-border/50 z-50 flex flex-col transition-all duration-300 ease-out",
        shouldExpand ? "w-[240px]" : "w-[72px]"
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Logo/Brand */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <img 
            src={tdzLogo} 
            alt="TDZ" 
            className="w-10 h-10 rounded-xl object-contain"
          />
          <span className={cn(
            "font-display text-lg font-bold tracking-tight transition-all duration-300",
            shouldExpand ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 absolute"
          )}>
            TDZ STUDIO
          </span>
        </div>
      </div>

      {/* Profile */}
      <div className={cn("p-4 border-b border-border/50", !shouldExpand && "flex justify-center")}>
        <div className={cn("flex items-center gap-3", !shouldExpand && "justify-center")}>
          <Avatar className="w-10 h-10 border-2 border-primary/50 ring-2 ring-primary/20">
            <AvatarImage src={profileImage} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-bold">
              {artistName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className={cn(
            "flex-1 min-w-0 transition-all duration-300",
            shouldExpand ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 hidden"
          )}>
            <p className="font-semibold truncate">{artistName}</p>
            <p className="text-xs text-muted-foreground">Artist</p>
          </div>
        </div>
      </div>

      {/* Upload Button */}
      <div className="p-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              onClick={onUploadClick}
              className={cn(
                "bg-gradient-to-r from-primary via-violet-500 to-fuchsia-500 hover:shadow-glow text-primary-foreground font-semibold transition-all",
                shouldExpand ? "w-full gap-2" : "w-10 h-10 p-0"
              )}
            >
              <Plus className="w-5 h-5" />
              <span className={cn(
                "transition-all duration-300",
                shouldExpand ? "opacity-100" : "opacity-0 hidden"
              )}>
                New Release
              </span>
            </Button>
          </TooltipTrigger>
          {!shouldExpand && <TooltipContent side="right">New Release</TooltipContent>}
        </Tooltip>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group",
                  activeSection === item.id 
                    ? "bg-gradient-to-r from-primary/20 to-secondary/20 text-primary shadow-lg border border-primary/30" 
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  !shouldExpand && "justify-center px-0"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 flex-shrink-0 transition-transform duration-200",
                  activeSection === item.id && "scale-110",
                  "group-hover:scale-110"
                )} />
                <span className={cn(
                  "font-medium transition-all duration-300",
                  shouldExpand ? "opacity-100" : "opacity-0 hidden"
                )}>
                  {item.label}
                </span>
              </button>
            </TooltipTrigger>
            {!shouldExpand && <TooltipContent side="right">{item.label}</TooltipContent>}
          </Tooltip>
        ))}

        {/* CEO Dashboard - Only visible to CEO */}
        {isCEO && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => navigate("/ceo")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group mt-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 text-amber-500 hover:from-amber-500/20 hover:to-orange-500/20",
                  !shouldExpand && "justify-center px-0"
                )}
              >
                <Crown className={cn(
                  "w-5 h-5 flex-shrink-0 transition-transform duration-200",
                  "group-hover:scale-110"
                )} />
                <span className={cn(
                  "font-medium transition-all duration-300",
                  shouldExpand ? "opacity-100" : "opacity-0 hidden"
                )}>
                  CEO Dashboard
                </span>
              </button>
            </TooltipTrigger>
            {!shouldExpand && <TooltipContent side="right">CEO Dashboard</TooltipContent>}
          </Tooltip>
        )}
      </nav>

      {/* Bottom Actions */}
      <div className="p-2 space-y-1 border-t border-border/50">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => navigate("/discover")}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all group",
                !shouldExpand && "justify-center px-0"
              )}
            >
              <Compass className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className={cn(
                "font-medium transition-all duration-300",
                shouldExpand ? "opacity-100" : "opacity-0 hidden"
              )}>
                Discover
              </span>
            </button>
          </TooltipTrigger>
          {!shouldExpand && <TooltipContent side="right">Discover</TooltipContent>}
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => navigate("/support")}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all group",
                !shouldExpand && "justify-center px-0"
              )}
            >
              <LifeBuoy className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className={cn(
                "font-medium transition-all duration-300",
                shouldExpand ? "opacity-100" : "opacity-0 hidden"
              )}>
                Support
              </span>
            </button>
          </TooltipTrigger>
          {!shouldExpand && <TooltipContent side="right">Support</TooltipContent>}
        </Tooltip>
      </div>
    </div>
  );
};