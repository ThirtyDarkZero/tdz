import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NowPlayingSidebar } from "./NowPlayingSidebar";
import { LibrarySidebar } from "./LibrarySidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music2, Library } from "lucide-react";

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTrack: any;
  artistInfo?: any;
  relatedTracks?: any[];
  onPlayTrack?: (track: any) => void;
  userId: string | null;
  likedTracksCount: number;
  onPlaylistSelect?: (playlistId: string) => void;
}

export function MobileSidebar({
  open,
  onOpenChange,
  currentTrack,
  artistInfo,
  relatedTracks,
  onPlayTrack,
  userId,
  likedTracksCount,
  onPlaylistSelect
}: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[85vw] max-w-md p-0">
        <SheetHeader className="p-4 border-b border-border/30">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        
        <Tabs defaultValue="playing" className="h-[calc(100%-60px)]">
          <TabsList className="w-full rounded-none border-b border-border/30 bg-transparent p-0 h-auto">
            <TabsTrigger 
              value="playing" 
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3"
            >
              <Music2 className="w-4 h-4 mr-2" />
              Now Playing
            </TabsTrigger>
            <TabsTrigger 
              value="library" 
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3"
            >
              <Library className="w-4 h-4 mr-2" />
              Library
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="playing" className="h-full overflow-y-auto p-4 mt-0">
            <NowPlayingSidebar
              currentTrack={currentTrack}
              artistInfo={artistInfo}
              relatedTracks={relatedTracks}
              onPlayTrack={(track) => {
                onPlayTrack?.(track);
                onOpenChange(false);
              }}
            />
          </TabsContent>
          
          <TabsContent value="library" className="h-full overflow-y-auto p-4 mt-0">
            <LibrarySidebar
              userId={userId}
              likedTracksCount={likedTracksCount}
              onPlaylistSelect={(playlistId) => {
                onPlaylistSelect?.(playlistId);
                onOpenChange(false);
              }}
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
