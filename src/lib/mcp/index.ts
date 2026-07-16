import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listMyTracks from "./tools/list-my-tracks";
import getMyEarnings from "./tools/get-my-earnings";
import listLikedSongs from "./tools/list-liked-songs";
import searchTracks from "./tools/search-tracks";
import whoami from "./tools/whoami";

// The OAuth issuer must be the direct Supabase host (not the .lovable.cloud proxy).
// VITE_SUPABASE_PROJECT_ID is inlined at build time so this stays import-safe.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "tdz-mcp",
  title: "TDZ Distribution",
  version: "0.1.0",
  instructions:
    "Tools for the TDZ Distribution music platform. Use `whoami` to verify connectivity, `list_my_tracks` and `get_my_earnings` for the signed-in artist, `list_liked_songs` for the signed-in listener, and `search_tracks` to query the public catalog. All tools act as the connected user under row-level security.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [whoami, listMyTracks, getMyEarnings, listLikedSongs, searchTracks],
});
