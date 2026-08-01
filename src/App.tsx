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
import { ActingArtistProvider } from "@/contexts/ActingArtistContext";
import { MoodProvider } from "@/contexts/MoodContext";
import { GlobalMusicPlayer } from "@/components/GlobalMusicPlayer";
import { Seo } from "@/components/Seo";

// Eagerly loaded lightweight pages
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));


// Lazy-loaded heavy pages for code splitting
const Studio = lazy(() => import("./pages/Studio"));
const Discover = lazy(() => import("./pages/Discover"));
const RoleSelection = lazy(() => import("./pages/RoleSelection"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const ManagerHQ = lazy(() => import("./pages/ManagerHQ"));
const ArtistProfile = lazy(() => import("./pages/ArtistProfile"));
const UnifiedArtistProfile = lazy(() => import("./pages/UnifiedArtistProfile"));
const ListenerProfile = lazy(() => import("./pages/ListenerProfile"));
const LikedSongs = lazy(() => import("./pages/LikedSongs"));
const TrackDetail = lazy(() => import("./pages/TrackDetail"));
const AlbumDetail = lazy(() => import("./pages/AlbumDetail"));
const PlaylistDetail = lazy(() => import("./pages/PlaylistDetail"));
const Investors = lazy(() => import("./pages/Investors"));
const CapTable = lazy(() => import("./pages/CapTable"));
const CEODashboard = lazy(() => import("./pages/CEODashboard"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Support = lazy(() => import("./pages/Support"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Checkout = lazy(() => import("./pages/Checkout"));
const SubscriptionSuccess = lazy(() => import("./pages/SubscriptionSuccess"));

const EventbriteOAuthCallback = lazy(() => import("./pages/EventbriteOAuthCallback"));

const FanSettings = lazy(() => import("./pages/FanSettings"));
const GlobalArtistPage = lazy(() => import("./pages/GlobalArtistPage"));
const GlobalAlbumPage = lazy(() => import("./pages/GlobalAlbumPage"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent"));
const ConnectMcp = lazy(() => import("./pages/ConnectMcp"));

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
      <ActingArtistProvider>
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
                  <Route path="/" element={<Seo title="TDZ Distribution — $1 Per Stream Music Platform" description="TDZ is the creator-first streaming platform paying artists $1 per qualified stream. Upload, distribute, and monetize your music with built-in AI tools." path="/"><Landing /></Seo>} />
                  <Route path="/auth" element={<Seo title="Sign In or Create Account | TDZ" description="Sign in to TDZ Distribution to upload music, track $1-per-stream payouts, and grow your fanbase on a creator-first streaming platform." path="/auth"><Auth /></Seo>} />
                  <Route path="/oauth/consent" element={<Seo title="Authorize app · TDZ" description="Approve or deny an app that is requesting access to your TDZ account." path="/oauth/consent" noindex><OAuthConsent /></Seo>} />
                  <Route path="/.lovable/oauth/consent" element={<Seo title="Authorize app · TDZ" description="Approve or deny an app that is requesting access to your TDZ account." path="/.lovable/oauth/consent" noindex><OAuthConsent /></Seo>} />

                  <Route path="/forgot-password" element={<Seo title="Reset Your Password | TDZ" description="Recover access to your TDZ Distribution account. Request a secure password reset link delivered to your verified email address." path="/forgot-password" noindex><ForgotPassword /></Seo>} />
                  <Route path="/unsubscribe" element={<Unsubscribe />} />
                  <Route path="/unsubscribe" element={<Unsubscribe />} />
                  <Route path="/reset-password" element={<Seo title="Set a New Password | TDZ" description="Choose a new password for your TDZ Distribution account and securely return to your studio, fan profile, or artist dashboard." path="/reset-password" noindex><ResetPassword /></Seo>} />
                  <Route path="/role-selection" element={<Seo title="Choose Your Role | TDZ" description="Tell TDZ whether you are an artist, manager, or fan so we can route you to the right studio, dashboard, or discovery experience." path="/role-selection" noindex><RoleSelection /></Seo>} />
                  <Route path="/onboarding" element={<Seo title="Welcome to TDZ | Get Started" description="Set up your TDZ account in under a minute — pick a role, add basic info, and jump into your studio, manager HQ, or discovery." path="/onboarding" noindex><Onboarding /></Seo>} />
                  <Route path="/manager-hq" element={<ErrorBoundary fallback={<AppErrorFallback title="Manager HQ failed to load" />}><Seo title="Manager HQ | TDZ Enterprise" description="Enterprise roster management, aggregated analytics, white-label branding, and custom integrations for TDZ managers and labels." path="/manager-hq" noindex><ManagerHQ /></Seo></ErrorBoundary>} />
                  <Route
                    path="/studio"
                    element={
                      <ErrorBoundary fallback={<AppErrorFallback title="Studio failed to load" />}>
                        <Seo title="Artist Studio | TDZ Distribution" description="Manage releases, track earnings, run AI-powered campaigns, and grow your audience inside the TDZ Artist Studio." path="/studio" noindex>
                          <Studio />
                        </Seo>
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="/discover"
                    element={
                      <ErrorBoundary fallback={<AppErrorFallback title="Discover failed to load" />}>
                        <Seo title="Discover New Music | TDZ" description="Stream new artists, curated playlists, and trending releases on TDZ — the platform paying creators $1 per qualified stream." path="/discover">
                          <Discover />
                        </Seo>
                      </ErrorBoundary>
                    }
                  />
                  <Route path="/browse" element={<Seo title="Browse Music & Artists | TDZ" description="Browse genres, moods, and trending artists on TDZ Distribution and find your next favorite song on the creator-first streaming platform." path="/browse"><Discover /></Seo>} />
                  <Route path="/artist/:artistId" element={<ArtistProfile />} />
                  <Route path="/artist/youtube/:artistId" element={<UnifiedArtistProfile />} />
                  <Route path="/artist/global/:artistName" element={<GlobalArtistPage />} />
                  <Route path="/album/global/:albumId" element={<GlobalAlbumPage />} />
                  <Route path="/profile" element={<Seo title="Your Listener Profile | TDZ" description="View your TDZ listening history, liked songs, badges, and the artists you support most on the creator-first streaming platform." path="/profile" noindex><ListenerProfile /></Seo>} />
                  <Route path="/liked-songs" element={<Seo title="Liked Songs | TDZ" description="Replay every track you have liked on TDZ Distribution and revisit the artists you support on the creator-first streaming platform." path="/liked-songs" noindex><LikedSongs /></Seo>} />
                  <Route path="/fan/:fanId" element={<ListenerProfile />} />
                  <Route path="/track/:trackId" element={<TrackDetail />} />
                  <Route path="/album/:albumId" element={<AlbumDetail />} />
                  <Route path="/playlist/:playlistId" element={<PlaylistDetail />} />
                  <Route path="/investors" element={<Seo title="TDZ Investor Deck — $10M Series Seed at 15%" description="Review the TDZ Distribution investor deck: live traction, market positioning, founder bio, and the $10M raise at 15% to scale the $1-per-stream platform." path="/investors"><Investors /></Seo>} />
                  <Route path="/investors/cap-table" element={<Seo title="TDZ Cap Table | Investor Disclosures" description="Detailed TDZ Distribution cap table covering founder equity, employee pool, and the proposed $10M Series Seed allocation at a 15% dilution." path="/investors/cap-table"><CapTable /></Seo>} />
                  <Route path="/ceo" element={<Seo title="CEO Operations Dashboard | TDZ" description="Internal CEO dashboard for TDZ Distribution covering revenue, treasury, payouts, and platform health." path="/ceo" noindex><CEODashboard /></Seo>} />
                  <Route path="/faq" element={<Seo title="Frequently Asked Questions | TDZ Distribution" description="How TDZ pays artists $1 per qualified stream, subscription tiers, payout requirements, and answers to the most common questions about the platform." path="/faq"><FAQ /></Seo>} />
                  <Route path="/terms" element={<Seo title="Terms of Service | TDZ Distribution" description="Read the TDZ Distribution Terms of Service covering account use, content licensing, payouts, and the rules that govern the streaming platform." path="/terms"><Terms /></Seo>} />
                  <Route path="/privacy" element={<Seo title="Privacy Policy | TDZ Distribution" description="Learn how TDZ Distribution collects, anonymizes, and protects listener and artist data on the creator-first streaming platform." path="/privacy"><Privacy /></Seo>} />
                  <Route path="/support" element={<Seo title="Help & Support | TDZ Distribution" description="Get help with TDZ uploads, payouts, account issues, and platform features. Open a support ticket or browse common solutions." path="/support"><Support /></Seo>} />
                  <Route path="/pricing" element={<Seo title="Artist & Fan Pricing Plans | TDZ" description="Compare TDZ Distribution plans: Starter $10, Pro $20, Enterprise $50, and the $12 Fan subscription that unlocks $1-per-stream artist payouts." path="/pricing"><Pricing /></Seo>} />
                  <Route path="/checkout" element={<Seo title="Secure Checkout | TDZ" description="Complete your TDZ Distribution subscription securely with Stripe and unlock artist tools or the Fan plan that funds $1-per-stream payouts." path="/checkout" noindex><Checkout /></Seo>} />
                  <Route path="/subscription-success" element={<Seo title="Subscription Activated | TDZ" description="Your TDZ Distribution subscription is now active. Jump back into the studio or start streaming on the creator-first platform." path="/subscription-success" noindex><SubscriptionSuccess /></Seo>} />
                  
                  <Route path="/eventbrite-callback" element={<EventbriteOAuthCallback />} />
                  <Route path="/settings" element={<Seo title="Account Settings | TDZ" description="Update your TDZ Distribution profile, notifications, audio quality, and connected services from the unified settings dashboard." path="/settings" noindex><FanSettings /></Seo>} />
                  <Route path="/connect" element={<Seo title="Connect TDZ to ChatGPT or Claude" description="Connect TDZ to your AI assistant using MCP. Step-by-step setup for ChatGPT and Claude." path="/connect"><ConnectMcp /></Seo>} />
                  <Route path="*" element={<Seo title="Page Not Found | TDZ" description="The page you are looking for does not exist on TDZ Distribution. Head back to Discover or the homepage to keep exploring." path="/404" noindex><NotFound /></Seo>} />


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
      </ActingArtistProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
