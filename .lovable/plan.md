## Goal
Let artists connect ChatGPT or Claude to TDZ from inside the Studio, reusing the same MCP setup already exposed at `/connect`.

## Changes

1. **New component** `src/components/studio/StudioConnectAI.tsx`
   - Renders the same content as the public `/connect` page (MCP server URL with copy button, ChatGPT + Claude setup steps, refresh steps), restyled to match Studio's dark chrome (`#141414` background, existing Studio card styles).
   - Artist-oriented copy: "Give ChatGPT or Claude access to your Studio to ask about your tracks, earnings, and fans."
   - MCP URL derived at runtime from `VITE_SUPABASE_PROJECT_ID` (never hardcoded).

2. **Studio sidebar** `src/components/studio/StudioSidebar.tsx`
   - Add a new item under the existing `ai` group: `{ id: "connect-ai", icon: Plug, label: "Connect AI" }` (Plug icon from lucide-react).

3. **Studio router** `src/pages/Studio.tsx`
   - Add a `case "connect-ai": return <StudioConnectAI />;` branch in the `renderContent` switch.

## Out of scope
- No changes to the existing `/connect` page, footer link, MCP server, or edge function.
- No new routes; this lives inside the Studio shell as a section.
