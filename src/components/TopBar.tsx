import { Button } from "@/components/ui/button";
import { LogOut, Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import tdzLogo from "@/assets/tdz-logo.png";
import { NotificationsPanel } from "./NotificationsPanel";

export const TopBar = ({ onUploadClick }: { onUploadClick?: () => void }) => {
  const { signOut } = useAuth();

  const handleUploadMusic = () => {
    if (onUploadClick) {
      onUploadClick();
    } else {
      toast.info("Upload music from the Library tab", {
        description: "Navigate to Library to upload your tracks"
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <header className="h-16 glass-card flex items-center justify-between px-3 md:px-6 border-b border-border/50 sticky top-0 z-40">
      <div className="flex items-center gap-2 md:gap-3">
        <img src={tdzLogo} alt="TDZ Distribution" className="h-8 md:h-10 w-auto" style={{ mixBlendMode: 'screen' }} />
        <div className="hidden sm:block">
          <h1 className="text-base md:text-lg font-bold glow-text">
            TDZ Distribution
          </h1>
          <p className="text-xs text-muted-foreground hidden md:block">Your Complete Record Label</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
        <NotificationsPanel />
        
        <Button
          onClick={handleUploadMusic}
          variant="outline"
          size="sm"
          className="hidden md:flex"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Music
        </Button>
        
        <Button
          onClick={handleUploadMusic}
          variant="outline"
          size="icon"
          className="md:hidden h-9 w-9"
        >
          <Upload className="w-4 h-4" />
        </Button>

        <Button
          onClick={handleSignOut}
          variant="ghost"
          size="icon"
          className="h-9 w-9"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};
