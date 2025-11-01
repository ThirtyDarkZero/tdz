import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Studio from "./pages/Studio";
import RoleSelection from "./pages/RoleSelection";
import Discover from "./pages/Discover";
import ArtistProfile from "./pages/ArtistProfile";
import TrackDetail from "./pages/TrackDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/role-selection" element={<RoleSelection />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/artist/:artistId" element={<ArtistProfile />} />
          <Route path="/track/:trackId" element={<TrackDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
