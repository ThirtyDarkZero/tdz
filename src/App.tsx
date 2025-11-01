import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MusicPlayerProvider, useMusicPlayer } from "./contexts/MusicPlayerContext";
import { MusicPlayer } from "./components/MusicPlayer";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Studio from "./pages/Studio";
import RoleSelection from "./pages/RoleSelection";
import Discover from "./pages/Discover";
import ArtistProfile from "./pages/ArtistProfile";
import TrackDetail from "./pages/TrackDetail";
import ListenerProfile from "./pages/ListenerProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const MusicPlayerWrapper = () => {
  const { currentTrack, queue, nextTrack, previousTrack } = useMusicPlayer();
  
  if (!currentTrack) return null;
  
  return (
    <MusicPlayer
      currentTrack={currentTrack}
      queue={queue}
      onNext={nextTrack}
      onPrevious={previousTrack}
      onTrackEnd={nextTrack}
    />
  );
};

const AppContent = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/role-selection" element={<RoleSelection />} />
        <Route path="/studio" element={<Studio />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/artist/:artistId" element={<ArtistProfile />} />
        <Route path="/listener/:userId" element={<ListenerProfile />} />
        <Route path="/track/:trackId" element={<TrackDetail />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <MusicPlayerWrapper />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <h1 className="text-4xl font-bold">App Loading Test</h1>
      </div>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
