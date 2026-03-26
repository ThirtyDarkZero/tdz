import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import tdzLogo from "@/assets/tdz-logo.png";
import { 
  Plus, 
  Sparkles,
  BarChart3,
  Megaphone,
  Settings2,
  Compass,
  LifeBuoy,
  Crown,
  Music4,
  Users,
  Wallet,
  Moon,
  ChevronRight,
  TrendingUp,
  PlayCircle,
  DollarSign,
  Calendar,
  X,
  Menu,
  LogOut
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

interface RealStats {
  totalPlays: number;
  weeklyChange: number;
  earnings: number;
  followers: number;
}

// PHP Admin-style grouped navigation
const navGroups = [
  {
    id: "main",
    items: [
      { id: "home", icon: Sparkles, label: "Dashboard" },
      { id: "music", icon: Music4, label: "Content" },
    ]
  },
  {
    id: "analytics",
    items: [
      { id: "insights", icon: BarChart3, label: "Analytics" },
      { id: "promote", icon: Megaphone, label: "Promote" },
    ]
  },
  {
    id: "tools",
    items: [
      { id: "settings", icon: Settings2, label: "Settings" },
    ]
  },
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
  const [showHighlights, setShowHighlights] = useState(true);
  const [realStats, setRealStats] = useState<RealStats>({
    totalPlays: 0,
    weeklyChange: 0,
    earnings: 0,
    followers: 0
  });

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Check CEO status
      if (user.email === "info@thirtydarkzero.com") {
        setIsCEO(true);
      }

      // Load real stats from database
      try {
        // Get total plays from tracks
        const { data: tracks } = await supabase
          .from("tracks")
          .select("id, play_count")
          .eq("user_id", user.id);
        
        const totalPlays = tracks?.reduce((sum, t) => sum + (t.play_count || 0), 0) || 0;
        const trackIds = tracks?.map(t => t.id) || [];

        // Get followers count
        const { count: followersCount } = await supabase
          .from("artist_follows")
          .select("*", { count: 'exact', head: true })
          .eq("artist_id", user.id);

        // Get earnings
        const { data: earnings } = await supabase
          .from("artist_earnings")
          .select("total_earnings")
          .eq("artist_id", user.id);
        
        const totalEarnings = earnings?.reduce((sum, e) => sum + (e.total_earnings || 0), 0) || 0;

        // Calculate weekly change (simplified - compare to last week's streams)
        let weeklyChange = 0;
        if (trackIds.length > 0) {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          
          const { count: weeklyCount } = await supabase
            .from("listening_history")
            .select("*", { count: 'exact', head: true })
            .gte("played_at", oneWeekAgo.toISOString())
            .in("track_id", trackIds);

          weeklyChange = weeklyCount || 0;
        }

        setRealStats({
          totalPlays,
          weeklyChange,
          earnings: totalEarnings,
          followers: followersCount || 0
        });
      } catch (error) {
        console.error("Error loading stats:", error);
      }
    };

    loadData();
  }, []);

  const shouldExpand = !collapsed || isHovering;

  // Handle hover expansion
  const handleMouseEnter = () => {
    if (collapsed) {
      setIsHovering(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  // Manual close handler
  const handleClose = () => {
    setIsHovering(false);
    onCollapsedChange(true);
    setShowHighlights(false);
  };

  // Manual open handler (for mobile)
  const handleOpen = () => {
    onCollapsedChange(false);
    setShowHighlights(true);
  };

  return (
    <>
      {/* Mobile Menu Button - Only visible when sidebar is collapsed on mobile */}
      <button
        onClick={handleOpen}
        className={cn(
          "fixed top-4 left-4 z-[60] p-2 rounded-lg bg-card/95 backdrop-blur-xl border border-border/30 md:hidden transition-opacity",
          !collapsed && "opacity-0 pointer-events-none"
        )}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Backdrop */}
      {!collapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={handleClose}
        />
      )}

      {/* Main Sidebar — #111111 dark theme */}
      <div 
        className={cn(
          "fixed left-0 top-0 h-screen z-50 flex flex-col transition-all duration-300 ease-out",
          "backdrop-blur-xl border-r border-white/[0.06]",
          "w-[200px] md:w-[110px]",
          collapsed && !isHovering && "md:w-[72px]",
          collapsed ? "-translate-x-full" : "translate-x-0",
          "md:translate-x-0"
        )}
        style={{ background: "#111111" }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Logo + Close Button */}
        <div className="p-4 flex items-center justify-between">
          <img 
            src={tdzLogo} 
            alt="TDZ" 
            className="w-12 h-12 md:w-16 md:h-16 rounded-xl object-contain cursor-pointer hover:scale-105 transition-transform"
            onClick={() => navigate("/")}
          />
          {/* Close Button - Always visible when expanded */}
          <button
            onClick={handleClose}
            className={cn(
              "p-1.5 rounded-lg hover:bg-muted/50 transition-all text-muted-foreground hover:text-foreground",
              shouldExpand ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 py-6 flex flex-col items-center">
          {navGroups.map((group, groupIndex) => (
            <div key={group.id} className={cn(
              "w-full",
              groupIndex > 0 && "mt-6 pt-6 border-t border-border/20"
            )}>
              {group.items.map((item) => (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onSectionChange(item.id)}
                      className={cn(
                        "w-full flex flex-col items-center gap-2 py-4 transition-all duration-200 group",
                        activeSection === item.id 
                          ? "text-primary" 
                          : "text-muted-foreground/50 hover:text-foreground"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 flex items-center justify-center transition-all duration-200",
                        activeSection === item.id && "scale-110"
                      )}>
                        <item.icon className="w-6 h-6" />
                      </div>
                      <span className={cn(
                        "text-[10px] font-semibold uppercase tracking-wider transition-opacity",
                        shouldExpand ? "opacity-100" : "opacity-0"
                      )}>
                        {item.label}
                      </span>
                    </button>
                  </TooltipTrigger>
                  {!shouldExpand && <TooltipContent side="right">{item.label}</TooltipContent>}
                </Tooltip>
              ))}
            </div>
          ))}

          {/* CEO Dashboard - Only visible to CEO */}
          {isCEO && (
            <div className="w-full mt-6 pt-6 border-t border-amber-500/20">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => navigate("/ceo")}
                    className="w-full flex flex-col items-center gap-2 py-4 text-amber-500 hover:text-amber-400 transition-all group"
                  >
                    <div className="w-8 h-8 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Crown className="w-6 h-6" />
                    </div>
                    <span className={cn(
                      "text-[10px] font-semibold uppercase tracking-wider transition-opacity",
                      shouldExpand ? "opacity-100" : "opacity-0"
                    )}>
                      Admin
                    </span>
                  </button>
                </TooltipTrigger>
                {!shouldExpand && <TooltipContent side="right">CEO Dashboard</TooltipContent>}
              </Tooltip>
            </div>
          )}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 space-y-2 border-t border-border/20">
          {/* Highlights Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowHighlights(!showHighlights)}
                className={cn(
                  "w-full flex justify-center items-center p-2 rounded-xl transition-all",
                  showHighlights 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted/50"
                )}
              >
                <ChevronRight className={cn(
                  "w-5 h-5 transition-transform",
                  showHighlights && "rotate-180"
                )} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {showHighlights ? "Hide Panel" : "Show Panel"}
            </TooltipContent>
          </Tooltip>

          {/* Quick Nav */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => navigate("/discover")}
                className="w-full flex justify-center items-center p-2 rounded-xl text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-all"
              >
                <Compass className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Discover</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => navigate("/support")}
                className="w-full flex justify-center items-center p-2 rounded-xl text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-all"
              >
                <LifeBuoy className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Support</TooltipContent>
          </Tooltip>

          {/* Logout Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={async () => {
                  Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('tdz_draft_') || key.startsWith('tdz_')) {
                      localStorage.removeItem(key);
                    }
                  });
                  await supabase.auth.signOut();
                  navigate("/auth");
                }}
                className="w-full flex justify-center items-center p-2 rounded-xl text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Sign Out</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Highlights Panel — dark theme */}
      <div 
        className={cn(
          "fixed top-0 h-screen z-40 transition-all duration-300 ease-out",
          "backdrop-blur-xl border-r border-white/[0.04]",
          "hidden md:block",
          showHighlights && shouldExpand ? "left-[110px] w-[240px] opacity-100" : "left-[72px] w-0 opacity-0 overflow-hidden"
        )}
        style={{ background: "#0D0D0D" }}
      >
        <div className="p-6 h-full flex flex-col">
          {/* Profile Section */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="w-12 h-12 border-2 border-primary/50 ring-2 ring-primary/20">
                <AvatarImage src={profileImage} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-bold">
                  {artistName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{artistName}</p>
                <p className="text-xs text-muted-foreground">Artist Studio</p>
              </div>
            </div>

            {/* Upload Button */}
            <Button 
              onClick={onUploadClick}
              className="w-full bg-gradient-to-r from-primary via-violet-500 to-fuchsia-500 hover:shadow-glow text-primary-foreground font-semibold gap-2"
            >
              <Plus className="w-4 h-4" />
              New Release
            </Button>
          </div>

          {/* Quick Stats - PHP Admin Style - REAL DATA */}
          <div className="space-y-4 mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Quick Stats
            </h3>
            
            <div className="space-y-3">
              <QuickStat 
                icon={PlayCircle} 
                label="Total Plays" 
                value={formatNumber(realStats.totalPlays)}
                color="blue"
              />
              <QuickStat 
                icon={TrendingUp} 
                label="This Week" 
                value={`+${realStats.weeklyChange}`}
                color="green"
              />
              <QuickStat 
                icon={DollarSign} 
                label="Earnings" 
                value={`$${realStats.earnings.toFixed(0)}`}
                color="orange"
              />
              <QuickStat 
                icon={Users} 
                label="Followers" 
                value={formatNumber(realStats.followers)}
                color="purple"
              />
            </div>
          </div>

          {/* Quick Links - PHP Admin Style */}
          <div className="space-y-2 flex-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Quick Actions
            </h3>
            
            <QuickLink 
              icon={Calendar}
              label="Schedule Release"
              onClick={() => onSectionChange("music")}
            />
            <QuickLink 
              icon={BarChart3}
              label="View Analytics"
              onClick={() => onSectionChange("insights")}
            />
            <QuickLink 
              icon={Megaphone}
              label="Promote Track"
              onClick={() => onSectionChange("promote")}
            />
            <QuickLink 
              icon={Wallet}
              label="Payout Settings"
              onClick={() => onSectionChange("settings")}
            />
          </div>

          {/* Theme Toggle */}
          <div className="pt-4 border-t border-border/20">
            <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 transition-all">
              <span className="text-sm">Dark Mode</span>
              <Moon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Helper to format numbers like 1.2K, 12.4K, 1.2M
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Quick Stat Component - PHP Admin Style
interface QuickStatProps {
  icon: React.ElementType;
  label: string;
  value: string;
  color: "blue" | "green" | "orange" | "purple" | "red";
}

const colorClasses = {
  blue: "bg-blue-500/10 text-blue-500",
  green: "bg-green-500/10 text-green-500",
  orange: "bg-orange-500/10 text-orange-500",
  purple: "bg-purple-500/10 text-purple-500",
  red: "bg-red-500/10 text-red-500",
};

const QuickStat = ({ icon: Icon, label, value, color }: QuickStatProps) => (
  <div className="flex items-center gap-3">
    <div className={cn(
      "w-10 h-10 rounded-xl flex items-center justify-center",
      colorClasses[color]
    )}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  </div>
);

// Quick Link Component
interface QuickLinkProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  badge?: string;
}

const QuickLink = ({ icon: Icon, label, onClick, badge }: QuickLinkProps) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all group"
  >
    <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
    <span className="text-sm flex-1 text-left">{label}</span>
    {badge && (
      <Badge variant="secondary" className="text-[10px]">{badge}</Badge>
    )}
  </button>
);