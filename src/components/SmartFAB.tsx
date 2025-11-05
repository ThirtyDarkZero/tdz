import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Command,
  Home,
  Music,
  ArrowLeft,
  Upload,
  Plus,
  Play,
  Share2,
  Heart,
  Edit2,
  TrendingUp,
  Settings,
  Search,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function SmartFAB() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  // Determine context-based actions
  const getContextActions = () => {
    const path = location.pathname;

    if (path === "/studio") {
      return [
        { icon: Upload, label: "Upload Track", action: () => {} },
        { icon: Plus, label: "New Album", action: () => {} },
        { icon: Play, label: "Preview", action: () => {} },
      ];
    }

    if (path.startsWith("/album/")) {
      return [
        { icon: Play, label: "Play All", action: () => {} },
        { icon: Share2, label: "Share Album", action: () => {} },
        { icon: Heart, label: "Like Album", action: () => {} },
      ];
    }

    if (path.startsWith("/track/")) {
      return [
        { icon: Play, label: "Play Track", action: () => {} },
        { icon: Share2, label: "Share Track", action: () => {} },
        { icon: Heart, label: "Like Track", action: () => {} },
      ];
    }

    if (path === "/discover") {
      return [
        { icon: Search, label: "Search", action: () => {} },
        { icon: TrendingUp, label: "Trending", action: () => {} },
        { icon: Music, label: "Studio", action: () => navigate("/studio") },
      ];
    }

    // Default actions
    return [
      { icon: Home, label: "Home", action: () => navigate("/discover") },
      { icon: Music, label: "Studio", action: () => navigate("/studio") },
      { icon: Search, label: "Discover", action: () => navigate("/discover") },
    ];
  };

  const contextActions = getContextActions();
  const canGoBack = location.key !== "default";

  return (
    <>
      {/* Command Palette Trigger */}
      <Button
        onClick={() => {
          const event = new KeyboardEvent("keydown", {
            key: "k",
            metaKey: true,
            bubbles: true,
          });
          document.dispatchEvent(event);
        }}
        className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-glow z-50 hover:scale-110 transition-all"
        size="icon"
      >
        <Command className="h-6 w-6" />
      </Button>

      {/* Context Actions Menu */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-glow-lg z-50 hover:scale-110 transition-all bg-gradient-to-br from-primary to-primary-glow"
            size="icon"
          >
            <Plus className={`h-7 w-7 transition-transform ${isOpen ? "rotate-45" : ""}`} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 glass-card-premium animate-scale-in"
          sideOffset={8}
        >
          {canGoBack && (
            <>
              <DropdownMenuItem onClick={() => navigate(-1)} className="cursor-pointer">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {contextActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <DropdownMenuItem
                key={index}
                onClick={action.action}
                className="cursor-pointer"
              >
                <Icon className="mr-2 h-4 w-4" />
                {action.label}
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => navigate("/discover")}
            className="cursor-pointer"
          >
            <Home className="mr-2 h-4 w-4" />
            Home
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate("/studio")}
            className="cursor-pointer"
          >
            <Music className="mr-2 h-4 w-4" />
            Studio
          </DropdownMenuItem>

          {user && (
            <DropdownMenuItem
              onClick={() => navigate(`/artist/${user.id}`)}
              className="cursor-pointer"
            >
              <Settings className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
