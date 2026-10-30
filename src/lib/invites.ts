import { supabase } from "@/integrations/supabase/client";

export type InviteKind = "collaborator" | "roster";

export interface SendInviteResult {
  invite_id: string;
  invite_url: string;
  email_status: "queued" | "failed";
  error?: string;
}

/** Create (or re-send) an invite and email it. Throws with a readable message. */
export async function sendInvite(input: {
  email: string;
  kind?: InviteKind;
  permissions?: string[];
  message?: string;
}): Promise<SendInviteResult> {
  const { data, error } = await supabase.functions.invoke("send-team-invite", { body: input });
  if (error) {
    // supabase-js wraps non-2xx; the function's own message is in the response body.
    const ctx = (error as { context?: Response }).context;
    const body = ctx && typeof ctx.json === "function" ? await ctx.json().catch(() => null) : null;
    throw new Error(body?.error || error.message || "Couldn't send the invite.");
  }
  return data as SendInviteResult;
}

export interface InvitePreview {
  id: string;
  kind: InviteKind;
  inviter_name: string;
  invited_email: string;
  permissions: string[] | Record<string, boolean>;
  message: string | null;
  status: string;
  expires_at: string;
}

// The generated database types don't include these new functions yet.
const rpc = supabase.rpc.bind(supabase) as unknown as (
  fn: string,
  args: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message: string } | null }>;

export async function getInvite(token: string): Promise<InvitePreview | null> {
  const { data, error } = await rpc("get_invite_by_token", { p_token: token });
  if (error) throw new Error(error.message);
  return ((data as InvitePreview[] | null) ?? [])[0] ?? null;
}

export async function respondToInvite(token: string, accept: boolean): Promise<string> {
  const { data, error } = await rpc("respond_to_invite", { p_token: token, p_accept: accept });
  if (error) throw new Error(error.message);
  return String(data);
}

export const PERMISSION_LABELS: Record<string, string> = {
  view_tracks: "See tracks",
  edit_tracks: "Edit track details",
  upload_tracks: "Upload tracks",
  delete_tracks: "Delete tracks",
  view_analytics: "See analytics",
  manage_albums: "Manage albums",
};

/** Human-readable list of what an invite grants. */
export function describePermissions(kind: InviteKind, permissions: InvitePreview["permissions"]): string[] {
  if (kind === "roster") return ["Manage your releases", "Upload on your behalf", "See your analytics"];
  const list = Array.isArray(permissions) ? permissions : [];
  return list.map((p) => PERMISSION_LABELS[p] ?? p.replace(/_/g, " "));
}
