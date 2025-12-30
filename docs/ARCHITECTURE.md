# TDZ Streaming Platform - Architecture Documentation

## Overview

TDZ is a modern React/TypeScript music streaming platform with Supabase backend, designed to match and exceed the feature set of RKHM/BusyOwl PHP platform while adding proprietary features like $1/stream payouts, AI marketing, and motion covers.

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: React Router v6
- **Styling**: Tailwind CSS with custom design system
- **State Management**: 
  - React Query for server state
  - Context API for global state (Player, Project)
  - Zustand for complex local state
- **UI Components**: Shadcn/ui (Radix primitives)
- **3D/Visualizers**: React Three Fiber + Three.js
- **Forms**: React Hook Form + Zod validation

### Backend (Lovable Cloud / Supabase)
- **Database**: PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth (email, social login)
- **Storage**: Supabase Storage (audio, images, videos)
- **Edge Functions**: Deno-based serverless functions
- **Realtime**: PostgreSQL LISTEN/NOTIFY

### Payments
- **Provider**: Square Payments (production-ready)
- **Features**: Subscriptions, one-time purchases, artist payouts

---

## Core Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           TDZ Platform                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │   Landing (/)   │  │  Discovery      │  │    Studio       │          │
│  │                 │  │  (/discover)    │  │   (/studio)     │          │
│  │  - Hero        │  │  - Browse       │  │  - Dashboard    │          │
│  │  - Features    │  │  - Search       │  │  - Upload       │          │
│  │  - Pricing     │  │  - Player       │  │  - Analytics    │          │
│  │  - CTA         │  │  - Playlists    │  │  - Settings     │          │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘          │
│           │                    │                    │                    │
│           └────────────────────┼────────────────────┘                    │
│                                │                                         │
│  ┌─────────────────────────────┴─────────────────────────────┐          │
│  │                    Global Player Context                   │          │
│  │  - Persistent bottom bar player                           │          │
│  │  - Queue management                                       │          │
│  │  - YouTube + TDZ audio support                            │          │
│  └────────────────────────────────────────────────────────────┘          │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │                     Supabase Backend                         │        │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │        │
│  │  │   Auth   │ │ Database │ │ Storage  │ │  Edge    │        │        │
│  │  │          │ │  (RLS)   │ │  (CDN)   │ │Functions │        │        │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Feature Comparison: RKHM vs TDZ

| Feature | RKHM (BusyOwl) | TDZ | Status |
|---------|----------------|-----|--------|
| **PWA** | ✅ Service Worker, Offline | 🔴 Not implemented | NEEDED |
| **Persistent Player** | ✅ Bottom bar | ✅ GlobalMusicPlayer | ✅ DONE |
| **Page Builder** | ✅ Widget system | 🔴 Not implemented | NOT NEEDED* |
| **Admin Panel** | ✅ Full CRUD, stats | ✅ CEODashboard, Studio | ✅ DONE |
| **Music Content** | ✅ Artist/Album/Track | ✅ Full support | ✅ DONE |
| **Genres & Tags** | ✅ Multiple per item | ✅ Genre system | ✅ DONE |
| **Artist Verification** | ✅ Document upload | ✅ verified_artist role | ✅ DONE |
| **YouTube Integration** | ✅ Embed API | ✅ Full search + player | ✅ DONE |
| **Lyrics** | ✅ Multi-language | ✅ LyricsPanel | ✅ DONE |
| **Store/Sales** | ✅ Premium content | ✅ Subscriptions | ✅ DONE |
| **Royalty Fee** | ✅ Per-stream | ✅ $1/stream payout | ✅ BETTER |
| **Subscriptions** | ✅ Tiers | ✅ Starter/Pro/Enterprise | ✅ DONE |
| **Playlists** | ✅ User playlists | ✅ Full system | ✅ DONE |
| **User Profiles** | ✅ Public pages | ✅ Artist + Listener | ✅ DONE |
| **Social Login** | ✅ OAuth | ⚠️ Email only | OPTIONAL |
| **Push Notifications** | ✅ Web Push | 🔴 Not implemented | NEEDED |
| **Browse Pages** | ✅ Filter/browse | ✅ /browse page | ✅ DONE |
| **Analytics** | ✅ amCharts | ✅ Recharts | ✅ DONE |
| **Storage/CDN** | ✅ AWS/FTP/Bunny | ✅ Supabase Storage | ✅ DONE |
| **SEO** | ✅ Meta tags | ⚠️ Partial | NEEDED |
| **Podcast/Radio** | ✅ Plugins | 🔴 Not implemented | NOT NEEDED |
| **AI Features** | ⚠️ ChatGPT translate | ✅ AI Marketing, Video Gen | ✅ BETTER |
| **Motion Covers** | 🔴 None | ✅ AI-generated videos | ✅ EXCLUSIVE |
| **$1/Stream Payout** | 🔴 Basic royalty | ✅ Full system | ✅ EXCLUSIVE |
| **Fraud Detection** | 🔴 None | ✅ Focus-based validation | ✅ EXCLUSIVE |

*Page Builder not needed - React component architecture is more powerful

---

## Data Models

### Core Tables

```sql
-- Users (managed by Supabase Auth)
auth.users

-- Artist Profiles
artist_profiles (
  id, user_id, artist_name, bio, 
  profile_image_path, banner_image_path,
  verified, monthly_listeners, total_plays,
  social_links
)

-- Listener Profiles  
listener_profiles (
  id, user_id, display_name, bio,
  profile_image_path, favorite_genres,
  follower_count, following_count
)

-- Albums
albums (
  id, user_id, artist_name, title,
  cover_art_path, genre, description,
  is_published, release_date, play_count
)

-- Tracks
tracks (
  id, user_id, album_id, title, artist_name,
  file_path, file_bucket, duration,
  genre, lyrics, is_published, play_count,
  motion_cover_path
)

-- Playlists
playlists (
  id, user_id, name, description,
  cover_image_path, is_public,
  is_collaborative, play_count
)

-- Playlist Tracks (junction)
playlist_tracks (
  id, playlist_id, track_id, position, added_by
)
```

### Social/Engagement Tables

```sql
-- Track Likes
track_likes (id, user_id, track_id)

-- Artist Follows
artist_follows (id, follower_id, artist_id)

-- Fan Follows (fan-to-fan)
fan_follows (id, follower_id, following_id)

-- Comments
comments (
  id, user_id, content, parent_type,
  track_id, album_id, playlist_id, post_id,
  like_count, reply_count
)

-- Activity Log
activity_log (
  id, user_id, activity_type,
  target_type, target_id, metadata
)

-- Notifications
notifications (
  id, user_id, notification_type,
  actor_id, target_type, target_id,
  message, is_read
)
```

### Monetization Tables

```sql
-- User Subscriptions
user_subscriptions (
  id, user_id, plan, status,
  current_period_start, current_period_end,
  square_subscription_id
)

-- Artist Earnings
artist_earnings (
  id, artist_id, period_start, period_end,
  total_streams, streaming_revenue,
  total_downloads, download_revenue,
  payout_status
)

-- Artist Payouts
artist_payouts (
  id, artist_id, amount, status,
  square_payout_id, completed_at
)

-- Download Purchases
download_purchases (
  id, buyer_id, track_id, artist_id,
  price, artist_revenue, payment_status
)
```

### Analytics Tables

```sql
-- Listening History
listening_history (
  id, user_id, track_id, played_at,
  play_duration, completion_percentage,
  device_type
)

-- Listener Demographics
listener_demographics (
  id, artist_id, track_id, listener_id,
  country, city, device_type, browser
)

-- Momentum Scores (artist growth tracking)
momentum_scores (
  id, user_id, score, streak_days,
  fan_growth, engagement_rate
)
```

---

## API Endpoints (Edge Functions)

### Authentication & Users
- `POST /auth/signup` - User registration
- `POST /auth/signin` - User login
- `POST /auth/signout` - User logout

### Music Content
- `GET /tracks` - List tracks (with filters)
- `GET /tracks/:id` - Get track details
- `POST /validate-track-upload` - Validate before upload
- `POST /create-upload-session` - Get presigned URL

### Streaming
- `POST /record-stream` - Record stream with fraud detection
- `GET /get-recommendations` - AI recommendations

### Analytics
- `POST /track-listener-demographics` - Track demographics
- `GET /export-analytics` - Export artist analytics

### Payments
- `POST /create-square-subscription` - Create subscription
- `POST /process-download-purchase` - Process download
- `POST /process-artist-payout` - Process payout

### AI Features
- `POST /generate-video` - Generate motion cover
- `POST /analyze-lyrics` - AI lyrics analysis
- `POST /exec-agent-chat` - AI executive agent

---

## Route Structure

```
/ - Landing page
/auth - Authentication
/role-selection - Role picker (artist/fan)

# Discovery (Fan-facing)
/discover - Main discovery feed
/browse - Advanced browse with filters
/track/:id - Track detail
/album/:id - Album detail
/playlist/:id - Playlist detail
/artist/:id - Artist profile
/profile - User's own profile

# Studio (Artist-facing)
/studio - Artist dashboard
  - /studio/home - Overview
  - /studio/music - Track management
  - /studio/insights - Analytics
  - /studio/promote - Marketing tools
  - /studio/settings - Account settings

# Admin (CEO-only)
/ceo - CEO Dashboard

# Static
/pricing - Subscription plans
/checkout - Payment flow
/investors - Investor page
/faq, /terms, /privacy, /support
```

---

## Gaps to Address

### Critical (RKHM Parity)
1. **PWA Support** - Service worker for offline capability
2. **Push Notifications** - Web Push API integration
3. **SEO Meta Tags** - Dynamic meta for each page

### Important (Enhancement)
4. **Social Login** - OAuth providers (Google, Apple)
5. **Station/Radio Mode** - Auto-queue related tracks
6. **Browse Filters** - More advanced filtering

### Nice to Have
7. **Language Editor** - i18n support
8. **Menu Builder** - Dynamic navigation
9. **Theme Manager** - Multiple themes

---

## Security Architecture

### Row Level Security (RLS)
All tables have RLS enabled with policies for:
- User-owned data (own tracks, playlists, etc.)
- Public data (published tracks, public playlists)
- Admin access (CEO dashboard)

### Authentication Flow
1. User signs up/in via Supabase Auth
2. JWT token stored in localStorage
3. Token included in all API requests
4. RLS policies validate access

### Stream Validation
- Focus-based fraud detection
- Device fingerprinting
- IP tracking
- Rate limiting

---

## Deployment

### Frontend
- Deployed via Lovable
- Automatic builds on push
- CDN-backed static hosting

### Backend
- Supabase managed PostgreSQL
- Edge Functions auto-deployed
- Storage with CDN

### Environment Variables
```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID
SQUARE_APPLICATION_ID
SQUARE_ACCESS_TOKEN
```

---

## TDZ Exclusive Features

### $1/Stream Payout System
- Every valid stream = $1 to artist
- Focus-based validation prevents fraud
- Revenue pool funded by subscriptions

### AI Marketing Suite
- Exec Agent for strategy advice
- Label Staff AI assistants
- Quantum Advisor for career guidance

### Motion Covers
- AI-generated video album art
- Multiple video providers (Kling, Runway, Sora, Veo)
- Lyrics-synced visualizations

### Social Engagement
- Comments on tracks/albums/playlists
- Fan badges and XP system
- Activity feed
- Direct messaging

---

*Last Updated: 2025-12-30*
