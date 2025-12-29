import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CommandPalette } from "@/components/CommandPalette";
import { SmartFAB } from "@/components/SmartFAB";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { GlobalMusicPlayer } from "@/components/GlobalMusicPlayer";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Studio from "./pages/Studio";
import RoleSelection from "./pages/RoleSelection";
import Discover from "./pages/Discover";
import ArtistProfile from "./pages/ArtistProfile";
import ListenerProfile from "./pages/ListenerProfile";
import TrackDetail from "./pages/TrackDetail";
import AlbumDetail from "./pages/AlbumDetail";
import PlaylistDetail from "./pages/PlaylistDetail";
import Investors from "./pages/Investors";
import CEODashboard from "./pages/CEODashboard";
import FAQ from "./pages/FAQ";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Support from "./pages/Support";
import Pricing from "./pages/Pricing";
import Checkout from "./pages/Checkout";
import SquareOAuthCallback from "./pages/SquareOAuthCallback";
import Browse from "./pages/Browse";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PlayerProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <CommandPalette />
          <SmartFAB />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/role-selection" element={<RoleSelection />} />
            <Route path="/studio" element={<Studio />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/artist/:artistId" element={<ArtistProfile />} />
            <Route path="/profile" element={<ListenerProfile />} />
            <Route path="/track/:trackId" element={<TrackDetail />} />
            <Route path="/album/:albumId" element={<AlbumDetail />} />
            <Route path="/playlist/:playlistId" element={<PlaylistDetail />} />
            <Route path="/investors" element={<Investors />} />
            <Route path="/ceo" element={<CEODashboard />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/support" element={<Support />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/square-callback" element={<SquareOAuthCallback />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          {/* Global persistent music player */}
          <GlobalMusicPlayer />
        </BrowserRouter>
      </PlayerProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
