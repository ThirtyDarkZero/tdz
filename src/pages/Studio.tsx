import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music, LayoutDashboard, Library, TrendingUp } from "lucide-react";
import { MusicPlayer } from "@/components/MusicPlayer";
import { MusicLibrary } from "@/components/MusicLibrary";
import { ArtistDashboard } from "@/components/ArtistDashboard";
import { TopBar } from "@/components/TopBar";
import { useAuth } from "@/hooks/useAuth";

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

const Studio = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handlePlayTrack = (track: Track, trackQueue: Track[]) => {
    setCurrentTrack(track);
    setQueue(trackQueue);
    const index = trackQueue.findIndex(t => t.id === track.id);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < queue.length - 1) {
      const nextTrack = queue[currentIndex + 1];
      setCurrentTrack(nextTrack);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevTrack = queue[currentIndex - 1];
      setCurrentTrack(prevTrack);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleTrackEnd = () => {
    handleNext();
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopBar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
            TDZ Distribution
          </h1>
          <p className="text-xl text-muted-foreground">
            Next-Gen Music Distribution & Streaming
          </p>
        </div>

        <Tabs defaultValue="library" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="library" className="gap-2">
              <Library className="h-4 w-4" />
              Library
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="discover" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Discover
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library">
            <MusicLibrary onPlayTrack={handlePlayTrack} />
          </TabsContent>

          <TabsContent value="dashboard">
            <ArtistDashboard />
          </TabsContent>

          <TabsContent value="discover">
            <div className="text-center py-12">
              <Music className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-2xl font-bold mb-2">AI-Powered Discovery</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Quantum algorithms analyze your listening patterns to discover music you'll love.
                Upload more tracks to unlock personalized recommendations.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <MusicPlayer
        currentTrack={currentTrack}
        queue={queue}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onTrackEnd={handleTrackEnd}
      />
    </div>
  );
};

export default Studio;