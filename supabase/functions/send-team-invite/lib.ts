// Pure helpers for team/roster invites (tested in lib_test.ts).

export const COLLABORATOR_PERMISSIONS = [
  "view_tracks", "edit_tracks", "upload_tracks", "delete_tracks", "view_analytics", "manage_albums",
] as const;

export type InviteKind = "collaborator" | "roster";

export interface InviteRequest {
  email: string;
  kind: InviteKind;
  permissions: unknown;
  message: string | null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Validate and normalise an invite request. Returns an error message or the clean request. */
export function parseInvite(body: unknown, inviterEmail?: string): { error: string } | { value: InviteRequest } {
  const b = (body ?? {}) as Record<string, unknown>;
  const email = String(b.email ?? "").trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) return { error: "Enter a valid email address." };
  if (inviterEmail && email === inviterEmail.toLowerCase()) return { error: "You can't invite yourself." };

  const kind: InviteKind = b.kind === "roster" ? "roster" : "collaborator";
  const message = typeof b.message === "string" && b.message.trim() ? b.message.trim().slice(0, 500) : null;

  if (kind === "roster") {
    return { value: { email, kind, permissions: { manager: true, upload: true, analytics: true }, message } };
  }
  const perms = Array.isArray(b.permissions) ? b.permissions.map(String) : [];
  const clean = [...new Set(perms.filter((p) => (COLLABORATOR_PERMISSIONS as readonly string[]).includes(p)))];
  if (!clean.length) return { error: "Choose at least one permission." };
  // Anyone who can do something with tracks can at least see them.
  if (!clean.includes("view_tracks")) clean.unshift("view_tracks");
  return { value: { email, kind, permissions: clean, message } };
}

export function inviteUrl(siteUrl: string, token: string): string {
  return `${siteUrl.replace(/\/$/, "")}/invite/${token}`;
}
