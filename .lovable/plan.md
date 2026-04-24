# Investor Page v2 — Re-pitched for VCs (and a GTM Hero)

The current `/investors` page reads like a product tour: 12 sections, walls of bullets, the words "Discovery" and "GTM" buried near the bottom. We're going to flip it — VC-grade narrative arc, design-led, and lead with **traction + market + the GTM competition series** before anyone sees a feature.

Working title for the show: **"LAST STAGE STANDING"** (alt: "The Final Verse"). Pitched below.

---

## Part 1 — Reframe the narrative (no more walls of text)

### New 9-section flow (down from 12, tighter, scannable in 30 seconds)

1. **Hero — One Line + One Number**
  "Independent artists earn $0.003 per stream. We pay $1.00 — **333× more.**"
   Sub: "TDZ is the streaming platform built for the 187,000 artists who already earn over $500/yr in royalties — and the fans who fund them."
   No nav clutter. One CTA: *See the traction →* (anchors to section 2).
2. **TRACTION FIRST** *(new — replaces the "crisis" section as the opener)*
  Big-number wall, design-led, no paragraphs:
  - **$X MRR** (pulled live from Stripe via existing `stripe-balance` fn — fall back to a static "Pre-launch" banner if 0)
  - **N artists onboarded** (live count from `profiles where role='artist'`)
  - **N intentional plays paid out** (live from `streams where eligible_for_payout=true`)
  - **$X paid to artists this month** (live from `artist_payouts`)
  - "Stripe-verified" badge + a tiny live-updating ticker
   This is the slide that keeps us out of the no-pile.
3. **THE CUSTOMER (sharpened)** *(replaces vague "music industry is broken")*
  "Our customer is the **187,000 working independent artist** earning $500–$50,000/yr in royalties — the missing middle that Spotify abandoned and major labels ignore."
   Three data points, each one stat + one sentence:
  - 187K artists earn >$500/yr on Spotify (Spotify Loud&Clear 2024)
  - Of those, only 11K earn >$10K — a 94% income cliff
  - Average indie artist needs **6.7M streams/yr** to make $20K. On TDZ: **20K plays.**
4. **MARKET — Why this is a venture-scale outcome** *(expanded, was 1 section, now the heaviest)*
  - **TAM:** $36.1B global recorded music (IFPI 2024)
  - **SAM:** $11.2B paid streaming (independent share)
  - **SOM:** $480M — capturing 1% of the 187K working-indie segment at our ARPS
  - One sentence: *"We don't need to beat Spotify. We need 0.3% of working indie artists to switch."*
  - Replace the existing TAM/SAM/SOM block which is good but buried — promote it.
5. **GTM HERO — "LAST STAGE STANDING"** *(brand new section, this is the moat story)*
  - **Logline:** *"American Idol meets Twitch, settled by the fans who pay the artists."*
  - **The format:** 12-week artist competition series. 32 indie artists compete. Fans vote **inside the TDZ app** by intentionally streaming, resonating, and tipping. Weekly elimination episodes drop exclusive tracks, behind-the-scenes content, and live Q&As only on TDZ.
  - **The prize:** **$250,000 grand prize + a TDZ distribution deal + a national tour.**
  - **Why it's the GTM:** Every vote requires an account. Every stream is monetized. Every fan who follows their artist becomes a paying participant. Production cost is recovered by sponsorship + new subscriber LTV.
  - **The unit economics box** (the slide that closes the round):
    - Conservative: 500K viewers → 12% conv → 60K paying fans @ $12/mo = **$720K MRR from one season**
    - Aggressive: 2M viewers → 8% → 160K subs = **$1.92M MRR**
    - Production budget: ~$1.8M. Payback: <90 days at conservative.
  - **Distribution:** YouTube + TikTok cutdowns drive funnel; full episodes are **TDZ-app exclusive** — replicating the Twitch/HQ Trivia "must-have-the-app" wedge.
  - Visual: hero card with prize money, bracket graphic, a "Vote on TDZ" phone mockup using the existing `StudioPhoneMockup` component.
6. **THE PRODUCT (compressed to ONE section, was 4)**
  Three columns, icons, one sentence each:
  - **Discovery** — Spotify-grade streaming with $1/intentional play
  - **Studio** — AI-powered release + analytics suite for artists
  - **Label HQ** — 6 AI agents that replace a $400K/yr label staff
   That's it. No feature dumps. Link out: *"Full product walkthrough →"*
7. **WHY NOW + UNFAIR ADVANTAGE**
  - 2024: Spotify changed payout rules, **demonetized 86M tracks** under 1K plays/yr (now public)
  - AI music ARR is exploding — investors recognize the pattern
  - We have **working tech, live payouts, and a TV-grade GTM** — most music-tech raises have one of three.
8. **THE ASK**
  - Raising **$10M Seed** at $66.7M post
  - 18-month runway → Season 1 of Last Stage Standing + 5K paying artists
  - Use of funds: 50% Series production, 25% engineering, 15% A&R/artist acquisition, 10% G&A
  - Lead investor benefits: board observer, prize-presentation rights on the season finale.
9. **CONTACT — Rob Hayes, CEO** + Calendly button + "Download deck (PDF)" + footer.

---

## Part 2 — Design execution (sell with design, not text)

- **Kill 80% of the bullet copy.** Every section: 1 headline, 1 stat, 1 visual. Max.
- **Live data wherever possible.** A traction slide with real numbers from Stripe + Supabase beats any deck. We already have `stripe-balance`, `system-diagnostics`, and the artist/stream tables — wire them in.
- **One color motif per section** (existing chrome silver for the asks, coral for traction, white-on-black for the show).
- **Replace the recharts-heavy "Financial Projections" wall** with **two** big number callouts + one chart, not five.
- **Sticky one-line nav** at top: *Traction · Market · The Show · The Ask*. Four words, clickable, anchors. That's the deck index a VC actually reads.
- **Add a "Generalist vs Music-Industry" toggle** at the very top — flips jargon ("derivative work" → "remix", "DSP" → "streaming app", "ARPS" → "$ per fan per month"). One state, persists in localStorage. This is the A/B test the user explicitly asked for.
- Add a **"30-Second Read"** sticky bottom bar that auto-summarizes the page in 4 sentences as the visitor scrolls past 60% — for the VC who bounces.

---

## Part 3 — Concrete file changes

- `src/pages/Investors.tsx` — rewrite section order; remove "crisis" hero, add "Traction" hero, add "Last Stage Standing" section, compress Product to one section, expand Market.
- `src/components/investor/LastStageStanding.tsx` *(new)* — the hero GTM section with prize card, format breakdown, unit-economics calculator (toggle between conservative/aggressive), and embedded phone mockup.
- `src/components/investor/LiveTraction.tsx` *(new)* — fetches MRR (`stripe-balance`), artist count, paid-stream count, payouts MTD. Skeleton loaders, fall-back static numbers if not yet live.
- `src/components/investor/JargonToggle.tsx` *(new)* — context provider + toggle pill; wraps Investor page only.
- `src/components/investor/ScrollSummaryBar.tsx` *(new)* — 30-second-read sticky bar.
- `src/components/investor/StickyDeckNav.tsx` *(new)* — 4-anchor top nav.
- Reuse: `StudioPhoneMockup`, `Reveal`, `ScreenPopReveal`, `chromeStyle` — keep the visual language.
- No DB or edge-function changes required (read-only consumption of existing endpoints).

---

## Part 4 — "LAST STAGE STANDING" — the pitch copy I'll drop in

> **LAST STAGE STANDING**
> *American Idol meets Twitch, settled by the fans who pay the artists.*
>
> 32 unsigned artists. 12 weeks. One $250,000 check.
>
> Every episode drops on the TDZ app first. Every vote is a stream that pays the artist $1. Every viewer who downloads to vote becomes a fan who funds the next song.
>
> No record-label gatekeepers. No label deals to sign away. Just the music, the fans, and the verdict of the only people whose opinion ever mattered: the audience.
>
> **Season 1 launches Q3 2026.** Lead investors get the seat next to the host on finale night.

---

## QA / Acceptance criteria

- A new visitor on `/investors` sees **Traction → Customer → Market → The Show** before any product feature.
- Page is **scannable in under 30 seconds** with sticky deck-nav + one stat per section.
- "Last Stage Standing" section renders the $250K prize, format, and unit economics on desktop + mobile.
- Jargon toggle flips at least 8 terms across the page.
- All existing routes and components unaffected.

---

**Sprint mode confirmed:** once approved, I'll execute Parts 1–3 end-to-end without stopping, then ping you with the live URL and a screenshot stack for QA.