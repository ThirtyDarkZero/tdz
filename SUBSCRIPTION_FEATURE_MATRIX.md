# TDZ Distribution - Subscription Feature Matrix

## Overview

TDZ has TWO types of subscription tiers:
1. **Artist Tiers** (Starter, Pro, Enterprise) - For artists, managers, and record labels
2. **Fan Tier** (Fan) - For listeners/fans

Users also have **Roles** (artist, manager, listener, verified_artist, admin) which determine their PRIMARY interface.

---

## Role → Interface Mapping

| Role | Primary Interface | Can Access Studio | Can Access Discovery |
|------|------------------|-------------------|---------------------|
| artist | Studio | ✅ Yes | ✅ Yes |
| verified_artist | Studio | ✅ Yes | ✅ Yes |
| manager | Studio (Manager Tab) | ✅ Yes | ✅ Yes |
| listener | Discovery | ❌ No | ✅ Yes |
| admin | All | ✅ Yes | ✅ Yes |

---

## Artist/Manager Subscription Tiers

### Free (Trial/Default)
**Price:** $0/month

| Feature | Available | Notes |
|---------|-----------|-------|
| Upload Music | ✅ Limited | Max 3 tracks, 1 album |
| Basic Analytics | ✅ Yes | Stream counts, basic stats |
| Advanced Analytics | ❌ No | |
| Fan Engagement Hub | ❌ No | |
| Download Sales | ❌ No | |
| AI Video Generation | ❌ No | 0 videos/month |
| Pre-save Campaigns | ❌ No | |
| Collaboration Tools | ❌ No | |
| Multi-Artist Management | ❌ No | |
| Custom Branding | ❌ No | |
| API Access | ❌ No | |
| Priority Support | ❌ No | |
| Dedicated Manager | ❌ No | |

**Studio Tabs Accessible:**
- ✅ Staff (basic)
- ✅ Release (limited)
- ✅ Library
- ✅ Gallery
- ✅ Dashboard (basic)
- ✅ Profile
- ✅ Merch
- ❌ Analytics (advanced)
- ❌ Fans
- ❌ Story
- ❌ Momentum
- ❌ Canvas
- ❌ Quantum
- ❌ Collaborators

---

### Starter ($9.99/month)
**For:** Independent artists just starting out

| Feature | Available | Notes |
|---------|-----------|-------|
| Upload Music | ✅ Yes | Max 50 tracks, 5 albums |
| Basic Analytics | ✅ Yes | |
| Advanced Analytics | ❌ No | |
| Fan Engagement Hub | ✅ Yes | |
| Download Sales | ✅ Yes | |
| AI Video Generation | ❌ No | 0 videos/month |
| Pre-save Campaigns | ❌ No | |
| Collaboration Tools | ❌ No | |
| Multi-Artist Management | ❌ No | |
| Custom Branding | ❌ No | |
| API Access | ❌ No | |
| Priority Support | ❌ No | |
| Dedicated Manager | ❌ No | |
| Playlists (Studio) | ✅ Yes | |
| Social Features | ✅ Yes | |

**Studio Tabs Accessible:**
- ✅ Staff
- ✅ Release
- ✅ Library
- ✅ Gallery
- ✅ Dashboard
- ✅ Fans
- ✅ Profile
- ✅ Merch
- ❌ Analytics (advanced) - Shows basic view
- ❌ Story (presave campaigns)
- ❌ Momentum
- ❌ Canvas
- ❌ Quantum
- ❌ Collaborators

---

### Pro ($19.99/month)
**For:** Growing artists who need advanced tools

| Feature | Available | Notes |
|---------|-----------|-------|
| Upload Music | ✅ Unlimited | |
| Basic Analytics | ✅ Yes | |
| Advanced Analytics | ✅ Yes | Full analytics suite |
| Fan Engagement Hub | ✅ Yes | |
| Download Sales | ✅ Yes | |
| AI Video Generation | ✅ Yes | 10 videos/month |
| Pre-save Campaigns | ✅ Yes | |
| Collaboration Tools | ✅ Yes | |
| Multi-Artist Management | ❌ No | |
| Custom Branding | ❌ No | |
| API Access | ❌ No | |
| Priority Support | ✅ Yes | |
| Dedicated Manager | ❌ No | |
| Playlists (Studio) | ✅ Yes | |
| Social Features | ✅ Yes | |

**Studio Tabs Accessible:**
- ✅ Staff
- ✅ Release
- ✅ Analytics (full)
- ✅ Library
- ✅ Gallery
- ✅ Dashboard
- ✅ Fans
- ✅ Story
- ✅ Momentum
- ✅ Canvas
- ✅ Profile
- ✅ Merch
- ✅ Quantum
- ✅ Collaborators
- ❌ Manager (role-specific)

---

### Enterprise ($49.99/month)
**For:** Record labels and professional managers

| Feature | Available | Notes |
|---------|-----------|-------|
| Upload Music | ✅ Unlimited | |
| Basic Analytics | ✅ Yes | |
| Advanced Analytics | ✅ Yes | |
| Fan Engagement Hub | ✅ Yes | |
| Download Sales | ✅ Yes | |
| AI Video Generation | ✅ Unlimited | |
| Pre-save Campaigns | ✅ Yes | |
| Collaboration Tools | ✅ Yes | |
| Multi-Artist Management | ✅ Yes | |
| Custom Branding | ✅ Yes | |
| API Access | ✅ Yes | |
| Priority Support | ✅ Yes | |
| Dedicated Manager | ✅ Yes | |
| Playlists (Studio) | ✅ Yes | |
| Social Features | ✅ Yes | |

**Studio Tabs Accessible:** ALL TABS

---

## Fan Subscription Tier

### Fan ($12/month)
**For:** Music listeners who want full streaming access

| Feature | Available | Notes |
|---------|-----------|-------|
| Unlimited Streaming | ✅ Yes | No 30-second preview limits |
| Create Playlists | ✅ Yes | |
| Social Features | ✅ Yes | Comments, follows, shares |
| Ad-Free Experience | ✅ Yes | |
| Offline Downloads | ❌ Future | |

**Discovery Features:**
- ✅ Full track playback (no preview limits)
- ✅ Create unlimited playlists
- ✅ Social interactions
- ✅ Follow artists and fans
- ✅ Like and share tracks

---

## Non-Subscriber (Free Fan)

| Feature | Available | Notes |
|---------|-----------|-------|
| Stream Music | ⚠️ Limited | 30-second previews only |
| Create Playlists | ❌ No | |
| Social Features | ❌ No | |
| Library Access | ❌ No | Must sign in |

---

## Technical Implementation

### Files Involved:
- `src/hooks/useSubscription.ts` - Feature definitions and plan checks
- `src/hooks/useUserRole.tsx` - Role management
- `src/components/FeatureGate.tsx` - Visual feature gating with upgrade prompts
- `src/components/FeatureGatedContent.tsx` - Inline feature gating
- `src/components/SubscriptionBadge.tsx` - Display current plan
- `src/pages/Studio.tsx` - Artist/manager interface with feature gates
- `src/pages/Discover.tsx` - Fan interface with subscription checks

### Database Tables:
- `user_roles` - Stores user role assignments
- `user_subscriptions` - Stores subscription plan and status

### Key Functions:
- `hasFeature(feature)` - Check if current plan has a feature
- `getPlan()` - Get current subscription plan
- `isArtistPlan()` - Check if on artist tier (starter/pro/enterprise)
- `isFanPlan()` - Check if on fan tier
- `isPaidPlan()` - Check if on any paid plan

---

## Testing Checklist

### Indie Artist (Starter Plan)
- [ ] Can access Studio
- [ ] Can upload tracks (up to 50)
- [ ] Can see basic analytics
- [ ] Cannot access advanced analytics
- [ ] Can use fan engagement tools
- [ ] Cannot invite collaborators
- [ ] Cannot use AI video generation

### Manager (Pro Plan)
- [ ] Can access Studio with Manager tab
- [ ] Can manage multiple artists
- [ ] Can access advanced analytics
- [ ] Can invite collaborators
- [ ] Can use AI video generation (10/month)

### Record Label (Enterprise Plan)
- [ ] Full access to all Studio features
- [ ] Unlimited AI video generation
- [ ] API access available
- [ ] Custom branding options
- [ ] Dedicated account manager

### Fan (Fan Plan)
- [ ] Cannot access Studio
- [ ] Full streaming access
- [ ] Can create playlists
- [ ] Can follow artists and fans
- [ ] Can comment and share

### Non-Subscriber
- [ ] 30-second preview limit
- [ ] Prompted to subscribe after preview ends
- [ ] Cannot create playlists
- [ ] Can browse Discovery
