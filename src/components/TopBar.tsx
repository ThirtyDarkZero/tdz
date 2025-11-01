import { Button } from "@/components/ui/button";
import { Music, LogOut, Upload, Headphones } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import tdzLogo from "@/assets/tdz-logo.png";

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

  const handleGoToPlayer = () => {
    // Scroll to the music player at bottom
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    toast.info("Music Player", {
      description: "Player controls are at the bottom of the page"
    });
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <header className="h-16 glass-card flex items-center justify-between px-6 border-b border-border/50 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <img src={tdzLogo} alt="TDZ Distribution" className="h-10 w-auto" style={{ mixBlendMode: 'screen' }} />
        <div>
          <h1 className="text-lg font-bold glow-text">
            TDZ Distribution
          </h1>
          <p className="text-xs text-muted-foreground">Your Complete Record Label</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <Button
          onClick={handleUploadMusic}
          variant="outline"
          size="sm"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Music
        </Button>

        <Button
          onClick={handleGoToPlayer}
          className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:shadow-glow transition-all"
        >
          <Headphones className="w-4 h-4 mr-2" />
          Go to Music Player
        </Button>

        <Button
          onClick={handleSignOut}
          variant="ghost"
          size="icon"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};
