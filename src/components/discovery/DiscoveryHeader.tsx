import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, User, Mic2, Menu, LayoutDashboard } from "lucide-react";
import tdzLogo from "@/assets/tdz-logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { useAuth } from "@/hooks/useAuth";

interface DiscoveryHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isArtist: boolean;
  onMenuClick?: () => void;
}

export function DiscoveryHeader({ 
  searchQuery, 
  onSearchChange, 
  isArtist,
  onMenuClick 
}: DiscoveryHeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // CEO check
  const isCEO = user?.email === 'info@thirtydarkzero.com';

  return (
    <div className="max-w-full mx-auto px-3 sm:px-4 md:px-6 py-3">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Logo + Menu */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <img 
            src={tdzLogo} 
            alt="TDZ" 
            className="h-8 sm:h-10 w-auto flex-shrink-0 cursor-pointer" 
            onClick={() => navigate("/")}
          />
          <span className="font-display font-bold text-sm sm:text-base md:text-xl hidden sm:block truncate">
            TDZ STREAMING
          </span>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-xs sm:max-w-md lg:max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search songs, artists, albums..."
              className="pl-10 bg-background/80 backdrop-blur-sm h-10"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {user && <NotificationsPanel />}
          
          {isArtist && (
            <Button 
              variant="outline"
              onClick={() => navigate("/studio")}
              className="gap-2 h-9 sm:h-10 hidden sm:flex"
            >
              <Mic2 className="w-4 h-4" />
              <span className="hidden md:inline">Studio</span>
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="icon"
                className="h-9 w-9 sm:h-10 sm:w-10"
              >
                <User className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                My Profile
              </DropdownMenuItem>
              {isArtist && (
                <DropdownMenuItem onClick={() => navigate("/studio")}>
                  Artist Studio
                </DropdownMenuItem>
              )}
              {isCEO && (
                <DropdownMenuItem onClick={() => navigate("/ceo")} className="text-primary">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  CEO Dashboard
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => navigate("/auth")}>
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
