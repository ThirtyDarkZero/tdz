// Shared JWT auth helper for edge functions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export interface AuthResult {
  user: { id: string; email?: string } | null;
  error: string | null;
  status: number;
}

export async function requireUser(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return { user: null, error: "Unauthorized", status: 401 };
  }
  const token = authHeader.slice(7).trim();
  if (!token) return { user: null, error: "Unauthorized", status: 401 };

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) {
    return { user: null, error: "Unauthorized", status: 401 };
  }
  return { user: { id: data.user.id, email: data.user.email ?? undefined }, error: null, status: 200 };
}

// Consistent error shape across all endpoints:
//   { error: string, code: string, request_id: string }
function errorBody(message: string, code: string) {
  return JSON.stringify({
    error: message,
    code,
    request_id: crypto.randomUUID(),
  });
}

export function unauthorized(corsHeaders: Record<string, string>, message = "Unauthorized") {
  return new Response(errorBody(message, "unauthorized"), {
    status: 401,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "WWW-Authenticate": 'Bearer realm="tdz", error="invalid_token"',
      "Cache-Control": "no-store",
    },
  });
}

export function forbidden(corsHeaders: Record<string, string>, message = "Forbidden") {
  return new Response(errorBody(message, "forbidden"), {
    status: 403,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export function methodNotAllowed(corsHeaders: Record<string, string>, allow: string[]) {
  return new Response(errorBody("Method Not Allowed", "method_not_allowed"), {
    status: 405,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Allow": allow.join(", "),
      "Cache-Control": "no-store",
    },
  });
}

// Enforce that the request uses one of the allowed methods.
// Returns a 405 Response when it doesn't, otherwise null.
export function enforceMethod(
  req: Request,
  allow: string[],
  corsHeaders: Record<string, string>,
): Response | null {
  const method = req.method.toUpperCase();
  const allowed = allow.map((m) => m.toUpperCase());
  if (allowed.includes(method)) return null;
  return methodNotAllowed(corsHeaders, allow);
}

// Verify a shared cron secret for scheduler-only endpoints
export function requireCronSecret(req: Request): boolean {
  const expected = Deno.env.get("CRON_SECRET");
  if (!expected) return false;
  const provided = req.headers.get("x-cron-secret") || req.headers.get("X-Cron-Secret");
  return !!provided && provided === expected;
}

// Allow either a valid CRON secret OR an authenticated admin/ceo user
export async function requireAdminOrCron(req: Request): Promise<{ ok: boolean; status: number; error?: string }> {
  if (requireCronSecret(req)) return { ok: true, status: 200 };
  // pg_cron jobs authenticate with the service-role key stored in vault.
  const bearer = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (bearer && serviceRole && bearer === serviceRole) return { ok: true, status: 200 };
  const auth = await requireUser(req);
  if (!auth.user) return { ok: false, status: 401, error: "Unauthorized" };
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const admin = createClient(supabaseUrl, serviceKey);
  const { data } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", auth.user.id)
    .in("role", ["ceo", "admin"]);
  if (!data || data.length === 0) return { ok: false, status: 403, error: "Forbidden" };
  return { ok: true, status: 200 };
}
