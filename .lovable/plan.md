

## Comprehensive Update Plan: Landing Page Benefits, Discovery Cosmic Redesign, Investor Mockups, and Scroll Effects

This is a large, multi-file update touching the Landing page, Investor page, and the entire Discovery visual layer. The reference image shows a cosmic/space-themed Discovery interface with nebula backgrounds, 3D album carousels, hexagonal album art grids, orbital category navigation, and a gramophone icon. We will adapt this to TDZ branding (not Sonos Capture).

---

### Overview of Changes

**1. Landing Page — Add Back All Benefits & Feature Breakdowns**
- Add a new "WHY TDZ" section between Section 6 (Music Is More Than Data) and Section 7 (Artist Plans) that breaks down:
  - How $1/stream works (comparison with Spotify's $0.003)
  - Studio features (AI video, territory rights, collaboration, analytics)
  - AI Music Agents (Quantum Advisor, Mood Mix, Smart Promo)
  - Fan engagement tools (tipping, impact scores, story cards)
  - Full feature comparison table vs Spotify/Apple Music
- Add a "HOW PAYMENTS WORK" visual section with step-by-step flow
- Ensure all buttons are wired (already mostly done, verify Subscribe, Watch Demo, Open Studio/Discovery)

**2. Discovery — Cosmic Space Theme (from reference image)**
All Discovery pages get an immersive cosmic nebula background with animated stars/particles.

Files to update:
- `src/components/discovery/PersistentLayout.tsx` — Add animated cosmic background (CSS gradients + particle canvas or CSS stars), update sidebar to have translucent cosmic glass effect
- `src/components/discovery/PremiumHero.tsx` — Replace flat dark gradient with cosmic nebula background, animated aurora-like cosmic glow, gramophone-style featured album display
- `src/components/discovery/Premium3DCarousel.tsx` — Add cosmic background glow behind carousel, floating orbital category bubbles instead of flat pills
- `src/components/discovery/MinimalArtistGrid.tsx` & `MinimalArtistCard` — Circular artist avatars with orbital ring effects (matching reference "Artist Portals" section)
- `src/components/discovery/MinimalAlbumGrid.tsx` & `MinimalAlbumCard` — Hexagonal album art frames (matching reference "Your Cosmic Collection")
- `src/components/discovery/PremiumTrackList.tsx` — Cosmic glass-morphism track rows
- `src/pages/ArtistProfile.tsx` — Cosmic background header, nebula gradient behind artist banner
- `src/pages/AlbumDetail.tsx` — Cosmic background, glass-card track list
- `src/pages/ListenerProfile.tsx` — Cosmic themed user profile
- `src/pages/Discover.tsx` — Add cosmic background wrapper, update tab sections

New components:
- `src/components/discovery/CosmicBackground.tsx` — Reusable animated cosmic nebula background (CSS-only, no Three.js for performance: radial gradients + animated star dots + floating particles via CSS keyframes)
- `src/components/discovery/CosmicNav.tsx` — Orbital bubble navigation for category sections (Moodscapes, Genre Odysseys, Artist Portals) matching reference

**3. Investor Page — Updated Phone Mockups + Scroll Effects**
- Replace `StudioPhoneMockups`, `MusicPlayerPhoneMockups`, `DiscoveryPhoneMockups` components used on investor page with the same `PhoneFrame` + interactive demo mockups from Landing page (the 3-phone perspective layout)
- Update the Discovery mockup to show the new cosmic-themed UI
- Add parallax scroll effects: sections slide in with staggered reveals, counter animations on financial numbers, subtle background parallax on hero

**4. Landing Page — Update Discovery Preview Section**
- Section 9 (TDZ Discovery) mockup panel should reflect the new cosmic Discovery look — nebula background, cosmic nav elements, orbital categories

**5. Scroll Effects — New and Innovative**
- **Parallax depth layers**: Background elements scroll at different speeds
- **Counter animations**: Financial numbers count up when scrolled into view
- **Staggered card reveals**: Cards fly in from different directions (not just translateY)
- **Section wipe transitions**: Sections reveal with a wipe/clip-path animation
- **Floating elements**: Small decorative elements (stars, music notes) float with parallax
- Create a shared `src/hooks/useScrollEffects.ts` with: `useParallax`, `useCountUp`, `useStaggerReveal`, `useWipeReveal`

**6. Testing**
- Test Discovery page functionality (all tabs, carousel, track playback, search, artist/album navigation)
- Test Landing page buttons and navigation
- Test Investor page graphs and mockups

---

### Implementation Order

1. **Create `CosmicBackground.tsx`** — Pure CSS animated cosmic nebula (radial gradients with purple/blue/teal nebula colors, animated CSS star particles, floating glow orbs)

2. **Create `useScrollEffects.ts`** — Shared scroll animation hooks (parallax, count-up, stagger, wipe)

3. **Update `PersistentLayout.tsx`** — Wrap main content area with CosmicBackground, glass-morphism sidebar

4. **Update `PremiumHero.tsx`** — Cosmic hero with nebula gradient, orbital stats display

5. **Update `Premium3DCarousel.tsx`** — Cosmic glow behind carousel, orbital category bubbles

6. **Update `MinimalAlbumGrid.tsx` + `MinimalAlbumCard.tsx`** — Hexagonal album frames with cosmic borders

7. **Update `MinimalArtistGrid.tsx` + `MinimalArtistCard.tsx`** — Orbital ring artist avatars

8. **Update `PremiumTrackList.tsx`** — Cosmic glass track rows

9. **Update `ArtistProfile.tsx`** — Cosmic header background

10. **Update `AlbumDetail.tsx`** — Cosmic background + glass track list

11. **Update `Landing.tsx`** — Add WHY TDZ benefits section, update Section 9 Discovery preview to cosmic look, add scroll effects

12. **Update `Investors.tsx`** — Replace phone mockups with Landing-style interactive demos, add scroll effects (parallax, counters), update Discovery preview

13. **Functional testing** via browser tools

---

### Technical Details

**Cosmic Background (CSS-only for performance):**
```text
- Base: radial-gradient with #0a0020, #1a0040, #000820 stops
- Nebula clouds: 3-4 positioned radial-gradient overlays with purple/teal/blue
- Stars: CSS box-shadow technique (hundreds of 1px white dots)
- Animation: slow rotation/drift via @keyframes
- Particles: 20-30 absolutely positioned divs with float animation
```

**Hexagonal Album Cards:**
```text
- clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)
- Glow border via drop-shadow filter
- Hover: scale + increased glow
```

**Orbital Category Navigation:**
```text
- Circular arrangement using CSS transforms
- Each category is a glass-morphism circle with icon + label
- Connected by subtle SVG orbital lines
- Galaxy/spiral image in center
```

**Scroll Effects Hooks:**
```text
useParallax(speed): returns ref + transform style for parallax offset
useCountUp(target, duration): returns animated number value
useStaggerReveal(count): returns array of refs with staggered delays
useWipeReveal(): returns ref + clip-path animation state
```

**No database changes needed.** All updates are purely frontend visual/UX.

