import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import tdzLogo from "@/assets/tdz-logo.png";
import {
  Crown,
  LayoutDashboard,
  Users,
  Music,
  DollarSign,
  MessageCircle,
  Settings,
  Activity,
  ChevronLeft,
  ChevronRight,
  Database,
  Shield,
  BarChart3,
  Bot,
  Compass,
  FileText
} from "lucide-react";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const adminNavItems = [
  { id: "executive", icon: Bot, label: "Executive AI", badge: "AI" },
  { id: "overview", icon: LayoutDashboard, label: "Overview" },
  { id: "revenue", icon: DollarSign, label: "Revenue Pool" },
  { id: "users", icon: Users, label: "Users" },
  { id: "content", icon: Music, label: "Content" },
  { id: "messaging", icon: MessageCircle, label: "Messages" },
  { id: "health", icon: Activity, label: "System Health" },
];

export const AdminSidebar = ({ activeTab, onTabChange }: AdminSidebarProps) => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(true); // Default collapsed for mobile
  const [isHovering, setIsHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile and collapse sidebar
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const shouldExpand = isMobile ? !collapsed : (!collapsed || isHovering);

  return (
    <TooltipProvider>
      <div
        className={cn(
          "h-screen bg-card/95 backdrop-blur-xl border-r border-border/50 flex flex-col transition-all duration-300",
          shouldExpand ? "w-[220px]" : "w-[72px]"
        )}
        onMouseEnter={() => !isMobile && setIsHovering(true)}
        onMouseLeave={() => !isMobile && setIsHovering(false)}
      >
        {/* Header */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={tdzLogo} alt="TDZ" className="w-10 h-10 rounded-xl object-contain" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                <Crown className="w-2.5 h-2.5 text-black" />
              </div>
            </div>
            <div className={cn(
              "transition-all duration-300",
              shouldExpand ? "opacity-100" : "opacity-0 hidden"
            )}>
              <p className="font-display text-sm font-bold">TDZ ADMIN</p>
              <p className="text-xs text-amber-500">CEO Access</p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className={cn("p-3 border-b border-border/50", !shouldExpand && "flex justify-center")}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className={cn(
              "text-xs text-green-500 font-medium transition-all",
              shouldExpand ? "opacity-100" : "opacity-0 hidden"
            )}>
              Systems Online
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {adminNavItems.map((item) => (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                    activeTab === item.id
                      ? "bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-500 border border-amber-500/30"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    !shouldExpand && "justify-center px-0"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 flex-shrink-0 transition-transform",
                    activeTab === item.id && "scale-110"
                  )} />
                  <span className={cn(
                    "text-sm font-medium flex-1 text-left transition-all",
                    shouldExpand ? "opacity-100" : "opacity-0 hidden"
                  )}>
                    {item.label}
                  </span>
                  {item.badge && shouldExpand && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/50 text-amber-500">
                      {item.badge}
                    </Badge>
                  )}
                </button>
              </TooltipTrigger>
              {!shouldExpand && <TooltipContent side="right">{item.label}</TooltipContent>}
            </Tooltip>
          ))}
        </nav>

        {/* Quick Actions */}
        <div className="p-2 border-t border-border/50 space-y-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => navigate("/studio")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all",
                  !shouldExpand && "justify-center px-0"
                )}
              >
                <Compass className="w-5 h-5" />
                <span className={cn(
                  "text-sm font-medium transition-all",
                  shouldExpand ? "opacity-100" : "opacity-0 hidden"
                )}>
                  Back to Studio
                </span>
              </button>
            </TooltipTrigger>
            {!shouldExpand && <TooltipContent side="right">Back to Studio</TooltipContent>}
          </Tooltip>
        </div>

        {/* Collapse Toggle */}
        <div className="p-2 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={cn("w-full", !shouldExpand && "justify-center")}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            <span className={cn(
              "ml-2 text-sm transition-all",
              shouldExpand ? "opacity-100" : "opacity-0 hidden"
            )}>
              {collapsed ? "Expand" : "Collapse"}
            </span>
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
};
