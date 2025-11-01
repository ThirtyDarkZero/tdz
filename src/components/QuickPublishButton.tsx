import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Globe, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface QuickPublishButtonProps {
  trackId: string;
  isPublished: boolean;
  onPublishChange: () => void;
}

export const QuickPublishButton = ({ trackId, isPublished, onPublishChange }: QuickPublishButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleTogglePublish = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("tracks")
        .update({
          is_published: !isPublished,
          release_date: !isPublished ? new Date().toISOString().split('T')[0] : null
        })
        .eq("id", trackId);

      if (error) throw error;

      toast.success(isPublished ? "Track unpublished" : "Track published to Discovery!", {
        description: isPublished 
          ? "Track removed from public discovery" 
          : "Your track is now live for fans to discover"
      });
      onPublishChange();
    } catch (error: any) {
      toast.error("Failed to update track", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (isPublished) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Unpublish"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unpublish Track?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the track from public discovery and artist profiles. 
              You can republish it anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleTogglePublish}>
              Unpublish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="default" size="sm" disabled={isLoading} className="gap-2">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Globe className="w-4 h-4" />
              Publish Now
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Publish Track Now?</AlertDialogTitle>
          <AlertDialogDescription>
            This will immediately publish your track to Discovery where fans can find and play it. 
            The track will also appear on your artist profile.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleTogglePublish}>
            Publish Now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
