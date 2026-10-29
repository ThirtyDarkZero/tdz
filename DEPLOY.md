# Deploying TDZ outside Lovable

One codebase builds two things: the website and the iOS app. App code is unchanged.

## 1. Website (Vercel)

1. vercel.com → **Add New Project** → import `ThirtyDarkZero/tdz`.
2. Framework: **Vite** (auto-detected; `vercel.json` sets build + SPA routing).
3. **Environment Variables**: add these three from `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
4. Deploy. Every push to `main` redeploys automatically.
5. **Settings → Domains**: add your domain and update DNS as Vercel shows.

## 2. iOS app (on your Mac)

One-time setup:

```bash
xcode-select --install          # if not already installed; also install Xcode from the App Store
git clone https://github.com/ThirtyDarkZero/tdz.git && cd tdz
git checkout ios-and-selfhost
npm install
npm run ios                     # builds the web app, syncs it into ios/, opens Xcode
```

In Xcode:

1. Select the **App** target → **Signing & Capabilities** → choose your Apple Developer team.
2. Pick an iPhone simulator and press **Run** to test.
3. Add your app icon: **App → Assets → AppIcon** (1024×1024 PNG).
4. To ship: **Product → Archive → Distribute App → App Store Connect**.
5. In appstoreconnect.apple.com create the app with bundle ID `com.thirtydarkzero.tdz`, fill in listing details, and submit for review.

After any web change: `npm run ios` again, then archive a new build.

## Package installs

Use **npm** (`package-lock.json`). The bun lockfiles were removed because they pointed at Lovable's private package mirror, which fails outside Lovable.

## 3. Still tied to Lovable

These keep working, but run on Lovable's infrastructure:

- **Backend (Lovable Cloud)**: database, auth and 75 edge functions live in Lovable's Supabase project.
- **Google / Apple sign-in** goes through Lovable's OAuth broker (`src/integrations/lovable`). Test it on your own domain and in the iOS app; email sign-in uses Supabase directly.
- **AI features**: 25 edge functions call Lovable's AI gateway (`LOVABLE_API_KEY`).

Fully leaving Lovable means moving these to your own Supabase project and AI provider keys. That's a separate step.

## App Review tip

Apple rejects apps that are only a website in a wrapper (Guideline 4.2). Adding native features (push notifications, haptics, native share) improves approval odds.
