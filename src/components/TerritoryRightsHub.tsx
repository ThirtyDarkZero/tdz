import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, Music, Search, Shield, ChevronRight, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TerritoryRightsManager } from "./TerritoryRightsManager";
import { toast } from "sonner";

interface Track {
  id: string;
  title: string;
  artist_name: string;
  isrc: string | null;
  album?: {
    title: string;
    cover_art_path?: string;
  };
  territories_count?: number;
  rights_count?: number;
}

export const TerritoryRightsHub = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [showManager, setShowManager] = useState(false);

  useEffect(() => {
    if (user) {
      loadTracks();
    }
  }, [user]);

  const loadTracks = async () => {
    try {
      const { data, error } = await supabase
        .from("tracks")
        .select(`
          id,
          title,
          artist_name,
          isrc,
          album:albums(title, cover_art_path)
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get territory and rights counts for each track
      const tracksWithCounts = await Promise.all(
        (data || []).map(async (track) => {
          const [territoriesRes, rightsRes] = await Promise.all([
            supabase
              .from("track_territories")
              .select("id", { count: "exact", head: true })
              .eq("track_id", track.id),
            supabase
              .from("track_rights_splits")
              .select("id", { count: "exact", head: true })
              .eq("track_id", track.id),
          ]);

          return {
            ...track,
            album: Array.isArray(track.album) ? track.album[0] : track.album,
            territories_count: territoriesRes.count || 0,
            rights_count: rightsRes.count || 0,
          };
        })
      );

      setTracks(tracksWithCounts);
    } catch (error) {
      console.error("Error loading tracks:", error);
      toast.error("Failed to load tracks");
    } finally {
      setLoading(false);
    }
  };

  const filteredTracks = tracks.filter(
    (track) =>
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenManager = (track: Track) => {
    setSelectedTrack(track);
    setShowManager(true);
  };

  const handleCloseManager = () => {
    setShowManager(false);
    setSelectedTrack(null);
    loadTracks(); // Refresh data
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle>Territory & Rights Management</CardTitle>
              <CardDescription>
                Control where your music is available and manage rights splits
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-primary">{tracks.length}</div>
              <div className="text-sm text-muted-foreground">Total Tracks</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-green-500">
                {tracks.filter((t) => (t.territories_count || 0) > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">With Territories</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-secondary">
                {tracks.filter((t) => (t.rights_count || 0) > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">With Rights Defined</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search tracks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tracks List */}
      {filteredTracks.length === 0 ? (
        <Card className="glass-card p-8 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Tracks Found</h3>
          <p className="text-muted-foreground">
            {tracks.length === 0
              ? "Upload some tracks first to manage their territories and rights."
              : "No tracks match your search."}
          </p>
        </Card>
      ) : (
        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {filteredTracks.map((track) => (
              <Card
                key={track.id}
                className="glass-card hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleOpenManager(track)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Cover Art */}
                    <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      {track.album?.cover_art_path ? (
                        <img
                          src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/album-covers/${track.album.cover_art_path}`}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Music className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{track.title}</h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {track.artist_name}
                        {track.album?.title && ` • ${track.album.title}`}
                      </p>
                      {track.isrc && (
                        <p className="text-xs text-muted-foreground font-mono">
                          ISRC: {track.isrc}
                        </p>
                      )}
                    </div>

                    {/* Status Badges */}
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          (track.territories_count || 0) > 0 ? "default" : "secondary"
                        }
                        className="gap-1"
                      >
                        <Globe className="w-3 h-3" />
                        {track.territories_count || 0}
                      </Badge>
                      <Badge
                        variant={(track.rights_count || 0) > 0 ? "default" : "secondary"}
                        className="gap-1"
                      >
                        <Shield className="w-3 h-3" />
                        {track.rights_count || 0}
                      </Badge>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Manager Dialog */}
      <Dialog open={showManager} onOpenChange={setShowManager}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">Territory & Rights Manager</DialogTitle>
          </DialogHeader>
          {selectedTrack && (
            <TerritoryRightsManager
              trackId={selectedTrack.id}
              trackTitle={selectedTrack.title}
              onClose={handleCloseManager}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
