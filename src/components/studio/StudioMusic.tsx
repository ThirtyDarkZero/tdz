import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MusicLibrary } from "@/components/MusicLibrary";
import { ReleaseManager } from "@/components/ReleaseManager";
import { ArtistGalleryManager } from "@/components/ArtistGalleryManager";
import { TerritoryRightsHub } from "@/components/TerritoryRightsHub";
import { FeatureGate } from "@/components/FeatureGate";
import { LyricsSyncEditor } from "@/components/studio/LyricsSyncEditor";

interface Track {
  id: string;
  title: string;
  artist_name: string;
  duration: number;
  file_path: string;
  play_count: number;
  album?: {
    title: string;
    cover_art_path?: string;
  };
}

interface StudioMusicProps {
  onPlayTrack: (track: Track, queue: Track[]) => void;
}

export const StudioMusic = ({ onPlayTrack }: StudioMusicProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em", fontSize: "2rem" }}>Music</h1>
        <p className="text-muted-foreground">Manage your releases, tracks, and media</p>
      </div>

      <Tabs defaultValue="releases" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 flex-wrap h-auto">
          <TabsTrigger value="releases" className="data-[state=active]:bg-background">
            Releases
          </TabsTrigger>
          <TabsTrigger value="library" className="data-[state=active]:bg-background">
            Library
          </TabsTrigger>
          <TabsTrigger value="rights" className="data-[state=active]:bg-background">
            Rights & Territories
          </TabsTrigger>
          <TabsTrigger value="gallery" className="data-[state=active]:bg-background">
            Gallery
          </TabsTrigger>
          <TabsTrigger value="lyrics-sync" className="data-[state=active]:bg-background">
            Lyrics Sync
          </TabsTrigger>
        </TabsList>

        <TabsContent value="releases" className="mt-0">
          <ReleaseManager />
        </TabsContent>

        <TabsContent value="library" className="mt-0">
          <MusicLibrary onPlayTrack={onPlayTrack} />
        </TabsContent>

        <TabsContent value="rights" className="mt-0">
          <FeatureGate feature="territoryRights">
            <TerritoryRightsHub />
          </FeatureGate>
        </TabsContent>

        <TabsContent value="gallery" className="mt-0">
          <ArtistGalleryManager />
        </TabsContent>

        <TabsContent value="lyrics-sync" className="mt-0">
          <LyricsSyncEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
};
