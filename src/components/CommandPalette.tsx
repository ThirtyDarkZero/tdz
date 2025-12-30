import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Home,
  Music,
  User,
  Settings,
  Search,
  Play,
  Upload,
  Album,
  Radio,
  TrendingUp,
  Users,
  Calendar,
  FileText,
  Heart,
  Share2,
  Edit2,
  Plus,
  LogOut,
  Moon,
  Sun,
  UserPlus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { hardSignOut } from "@/lib/auth";
import { toast } from "sonner";

interface Command {
  id: string;
  label: string;
  icon: any;
  action: () => void;
  category: string;
  keywords?: string[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Listen for Cmd+K / Ctrl+K
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => {
      subscription.unsubscribe();
      document.removeEventListener("keydown", down);
    };
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const commands: Command[] = [
    // Navigation
    {
      id: "home",
      label: "Go to Home",
      icon: Home,
      action: () => {
        navigate("/");
        toast.success("Navigating to Home");
      },
      category: "Navigation",
      keywords: ["home", "landing", "start"],
    },
    {
      id: "discover",
      label: "Discover Music",
      icon: Search,
      action: () => {
        navigate("/discover");
        toast.success("Navigating to Discover");
      },
      category: "Navigation",
      keywords: ["discover", "explore", "browse", "find"],
    },
    {
      id: "studio",
      label: "Go to Studio",
      icon: Music,
      action: () => {
        if (user) {
          navigate("/studio");
          toast.success("Navigating to Studio");
        } else {
          toast.error("Please sign in first");
          navigate("/auth");
        }
      },
      category: "Navigation",
      keywords: ["studio", "create", "upload", "my music"],
    },
    {
      id: "profile",
      label: "My Profile",
      icon: User,
      action: () => {
        if (user) {
          navigate(`/artist/${user.id}`);
          toast.success("Navigating to Profile");
        } else {
          toast.error("Please sign in first");
          navigate("/auth");
        }
      },
      category: "Navigation",
      keywords: ["profile", "me", "account"],
    },
    {
      id: "pricing",
      label: "View Pricing",
      icon: TrendingUp,
      action: () => {
        navigate("/pricing");
        toast.success("Navigating to Pricing");
      },
      category: "Navigation",
      keywords: ["pricing", "plans", "subscription"],
    },

    // Quick Actions
    {
      id: "upload",
      label: "Upload Track",
      icon: Upload,
      action: () => {
        if (user) {
          navigate("/studio");
          toast.success("Go to Music tab to upload");
        } else {
          toast.error("Please sign in to upload tracks");
          navigate("/auth");
        }
      },
      category: "Quick Actions",
      keywords: ["upload", "add", "new track", "create"],
    },
    {
      id: "create-album",
      label: "Create Album",
      icon: Album,
      action: () => {
        if (user) {
          navigate("/studio");
          toast.success("Go to Music tab to create album");
        } else {
          toast.error("Please sign in to create albums");
          navigate("/auth");
        }
      },
      category: "Quick Actions",
      keywords: ["album", "create", "new"],
    },
    {
      id: "invite-collaborator",
      label: "Invite Collaborator",
      icon: UserPlus,
      action: () => {
        if (user) {
          navigate("/studio");
          toast.success("Go to Settings to invite collaborators");
        } else {
          toast.error("Please sign in to invite collaborators");
          navigate("/auth");
        }
      },
      category: "Quick Actions",
      keywords: ["invite", "collaborator", "team", "share"],
    },
    {
      id: "liked-songs",
      label: "View Liked Songs",
      icon: Heart,
      action: () => {
        navigate("/discover");
        toast.success("Liked songs in your library");
      },
      category: "Quick Actions",
      keywords: ["liked", "favorites", "saved"],
    },

    // Account
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      action: () => {
        if (user) {
          navigate("/studio");
          toast.success("Opening Settings in Studio");
        } else {
          toast.error("Please sign in first");
          navigate("/auth");
        }
      },
      category: "Account",
      keywords: ["settings", "preferences", "config"],
    },
    {
      id: "login",
      label: user ? "Switch Account" : "Sign In",
      icon: User,
      action: () => {
        navigate("/auth");
        toast.success(user ? "Switch to another account" : "Opening Sign In");
      },
      category: "Account",
      keywords: ["login", "sign in", "account", "switch"],
    },
    {
      id: "logout",
      label: "Sign Out",
      icon: LogOut,
      action: async () => {
        if (!user) {
          toast.error("You're not signed in");
          return;
        }
        const { error } = await hardSignOut();
        setUser(null);

        if (error) {
          toast.error("Failed to sign out. Please try again.");
          return;
        }

        toast.success("Signed out successfully");
        navigate("/");
      },
      category: "Account",
      keywords: ["logout", "sign out", "exit"],
    },

    // View Options
    {
      id: "toggle-theme",
      label: "Toggle Dark Mode",
      icon: Moon,
      action: () => {
        const isDark = document.documentElement.classList.contains("dark");
        document.documentElement.classList.toggle("dark");
        localStorage.setItem("theme", isDark ? "light" : "dark");
        toast.success(isDark ? "Light mode enabled" : "Dark mode enabled");
      },
      category: "View",
      keywords: ["theme", "dark", "light", "mode"],
    },
  ];

  const runCommand = (command: Command) => {
    setOpen(false);
    command.action();
  };

  const categories = Array.from(new Set(commands.map((c) => c.category)));

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {categories.map((category) => (
          <div key={category}>
            <CommandGroup heading={category}>
              {commands
                .filter((c) => c.category === category)
                .map((command) => {
                  const Icon = command.icon;
                  return (
                    <CommandItem
                      key={command.id}
                      onSelect={() => runCommand(command)}
                      className="cursor-pointer"
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <span>{command.label}</span>
                    </CommandItem>
                  );
                })}
            </CommandGroup>
            <CommandSeparator />
          </div>
        ))}
      </CommandList>
      <div className="border-t p-2 text-xs text-muted-foreground text-center">
        Press{" "}
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>{" "}
        to toggle
      </div>
    </CommandDialog>
  );
}
