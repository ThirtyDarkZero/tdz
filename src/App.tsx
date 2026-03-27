import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppErrorFallback } from "@/components/AppErrorFallback";
import { GlobalErrorTrap } from "@/components/GlobalErrorTrap";
import { CommandPalette } from "@/components/CommandPalette";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { MoodProvider } from "@/contexts/MoodContext";
import { GlobalMusicPlayer } from "@/components/GlobalMusicPlayer";

// Eagerly loaded lightweight pages
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy-loaded heavy pages for code splitting
const Studio = lazy(() => import("./pages/Studio"));
const Discover = lazy(() => import("./pages/Discover"));
const RoleSelection = lazy(() => import("./pages/RoleSelection"));
const ArtistProfile = lazy(() => import("./pages/ArtistProfile"));
const UnifiedArtistProfile = lazy(() => import("./pages/UnifiedArtistProfile"));
const ListenerProfile = lazy(() => import("./pages/ListenerProfile"));
const LikedSongs = lazy(() => import("./pages/LikedSongs"));
const TrackDetail = lazy(() => import("./pages/TrackDetail"));
const AlbumDetail = lazy(() => import("./pages/AlbumDetail"));
const PlaylistDetail = lazy(() => import("./pages/PlaylistDetail"));
const Investors = lazy(() => import("./pages/Investors"));
const CEODashboard = lazy(() => import("./pages/CEODashboard"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Support = lazy(() => import("./pages/Support"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Checkout = lazy(() => import("./pages/Checkout"));
const SubscriptionSuccess = lazy(() => import("./pages/SubscriptionSuccess"));
const SquareOAuthCallback = lazy(() => import("./pages/SquareOAuthCallback"));
const EventbriteOAuthCallback = lazy(() => import("./pages/EventbriteOAuthCallback"));
const Browse = lazy(() => import("./pages/Browse"));
const FanSettings = lazy(() => import("./pages/FanSettings"));

const queryClient = new QueryClient();

// Minimal loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <MoodProvider>
        <TooltipProvider>
          <PlayerProvider>
            <Toaster />
            <Sonner />
            <GlobalErrorTrap />
            <BrowserRouter>
              <CommandPalette />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/role-selection" element={<RoleSelection />} />
                  <Route
                    path="/studio"
                    element={
                      <ErrorBoundary fallback={<AppErrorFallback title="Studio failed to load" />}>
                        <Studio />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="/discover"
                    element={
                      <ErrorBoundary fallback={<AppErrorFallback title="Discover failed to load" />}>
                        <Discover />
                      </ErrorBoundary>
                    }
                  />
                  <Route path="/browse" element={<Browse />} />
                  <Route path="/artist/:artistId" element={<ArtistProfile />} />
                  <Route path="/artist/youtube/:artistId" element={<UnifiedArtistProfile />} />
                  <Route path="/profile" element={<ListenerProfile />} />
                  <Route path="/liked-songs" element={<LikedSongs />} />
                  <Route path="/fan/:fanId" element={<ListenerProfile />} />
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
                  <Route path="/subscription-success" element={<SubscriptionSuccess />} />
                  <Route path="/square-callback" element={<SquareOAuthCallback />} />
                  <Route path="/eventbrite-callback" element={<EventbriteOAuthCallback />} />
                  <Route path="/settings" element={<FanSettings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <GlobalMusicPlayer />
            </BrowserRouter>
          </PlayerProvider>
        </TooltipProvider>
      </MoodProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
