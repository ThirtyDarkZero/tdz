import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Plus, Music, BarChart3, Megaphone, GraduationCap, 
  Settings, Home, Compass, HelpCircle, ChevronLeft, ChevronRight
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
  { id: "home", icon: Home, label: "Home" },
  { id: "music", icon: Music, label: "Music" },
  { id: "insights", icon: BarChart3, label: "Insights" },
  { id: "promote", icon: Megaphone, label: "Promote" },
  { id: "learn", icon: GraduationCap, label: "Learn" },
  { id: "settings", icon: Settings, label: "Settings" },
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

  return (
    <div 
      className={cn(
        "fixed left-0 top-0 h-screen bg-card/50 backdrop-blur-xl border-r border-border/50 z-50 flex flex-col transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[240px]"
      )}
    >
      {/* Logo/Brand */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center font-black text-primary-foreground text-lg">
            III
          </div>
          {!collapsed && (
            <span className="font-display text-lg font-bold tracking-tight">TDZ STUDIO</span>
          )}
        </div>
      </div>

      {/* Profile */}
      <div className={cn("p-4 border-b border-border/50", collapsed && "flex justify-center")}>
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <Avatar className="w-10 h-10 border-2 border-primary/50">
            <AvatarImage src={profileImage} />
            <AvatarFallback className="bg-primary/20 text-primary">
              {artistName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{artistName}</p>
              <p className="text-xs text-muted-foreground">Artist</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Button */}
      <div className="p-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              onClick={onUploadClick}
              className={cn(
                "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all",
                collapsed ? "w-10 h-10 p-0" : "w-full gap-2"
              )}
            >
              <Plus className="w-5 h-5" />
              {!collapsed && <span>New Release</span>}
            </Button>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">New Release</TooltipContent>}
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
                  "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                  activeSection === item.id 
                    ? "bg-primary text-primary-foreground shadow-glow" 
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  collapsed && "justify-center px-0"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
          </Tooltip>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-2 space-y-1 border-t border-border/50">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => navigate("/discover")}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all",
                collapsed && "justify-center px-0"
              )}
            >
              <Compass className="w-5 h-5" />
              {!collapsed && <span className="font-medium">Discover</span>}
            </button>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">Discover</TooltipContent>}
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => navigate("/support")}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all",
                collapsed && "justify-center px-0"
              )}
            >
              <HelpCircle className="w-5 h-5" />
              {!collapsed && <span className="font-medium">Help</span>}
            </button>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">Help</TooltipContent>}
        </Tooltip>

        {/* Collapse Toggle */}
        <button
          onClick={() => onCollapsedChange(!collapsed)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all",
            collapsed && "justify-center px-0"
          )}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!collapsed && <span className="font-medium">Collapse</span>}
        </button>
      </div>
    </div>
  );
};
