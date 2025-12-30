import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Database, Disc3, Sparkles } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DiscogsLibrary } from "./DiscogsLibrary";
import { MusicBrainzLibrary } from "./MusicBrainzLibrary";
import { UnifiedMusicEngine } from "./UnifiedMusicEngine";

interface UnifiedLibraryProps {
  onPlayYouTube: (videoId: string, title: string, artist: string, thumbnail: string) => void;
}

export function UnifiedLibrary({ onPlayYouTube }: UnifiedLibraryProps) {
  const [activeSource, setActiveSource] = useState<"unified" | "discogs" | "musicbrainz">("unified");

  return (
    <div className="space-y-6">
      {/* Source selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">
            <span className="text-gradient-aurora">Global Music Library</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Browse millions of releases from multiple databases
          </p>
        </div>
      </div>

      <Tabs value={activeSource} onValueChange={(v) => setActiveSource(v as typeof activeSource)}>
        <TabsList className="bg-muted/30 backdrop-blur-sm border border-border/50">
          <TabsTrigger 
            value="unified"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-cyan-400 gap-2"
          >
            <Sparkles className="w-4 h-4" />
            AI Engine
          </TabsTrigger>
          <TabsTrigger 
            value="discogs"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2"
          >
            <Database className="w-4 h-4" />
            Discogs
          </TabsTrigger>
          <TabsTrigger 
            value="musicbrainz"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2"
          >
            <Disc3 className="w-4 h-4" />
            MusicBrainz
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unified" className="mt-6">
          <ErrorBoundary fallback={<div className="h-40 bg-muted/20 rounded-lg flex items-center justify-center text-muted-foreground">AI Engine unavailable</div>}>
            <UnifiedMusicEngine onPlayYouTube={onPlayYouTube} />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="discogs" className="mt-6">
          <ErrorBoundary fallback={<div className="h-40 bg-muted/20 rounded-lg flex items-center justify-center text-muted-foreground">Discogs unavailable</div>}>
            <DiscogsLibrary onPlayYouTube={onPlayYouTube} />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="musicbrainz" className="mt-6">
          <ErrorBoundary fallback={<div className="h-40 bg-muted/20 rounded-lg flex items-center justify-center text-muted-foreground">MusicBrainz unavailable</div>}>
            <MusicBrainzLibrary onPlayYouTube={onPlayYouTube} />
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
}
