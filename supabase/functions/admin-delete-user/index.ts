import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// One-time admin utility: deletes a user and all their storage files. CEO/admin only.
Deno.serve(async (req) => {
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer /i, "");
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return new Response("unauthorized", { status: 401 });
  const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id).in("role", ["ceo", "admin"]);
  if (!roles?.length) return new Response("forbidden", { status: 403 });
  const { user_id } = await req.json();
  const result: Record<string, unknown> = {};
  const buckets = ["artist-images","track-files","audio-files","album-covers","artist-gallery","listener-images","post-media","fan-banners","generated-videos","motion-covers","characters","ai-twins"];
  for (const b of buckets) {
    const paths: string[] = [];
    const walk = async (prefix: string) => {
      const { data } = await admin.storage.from(b).list(prefix, { limit: 1000 });
      for (const f of data ?? []) {
        const p = `${prefix}/${f.name}`;
        if (f.id) paths.push(p); else await walk(p);
      }
    };
    await walk(user_id);
    if (paths.length) {
      const { error } = await admin.storage.from(b).remove(paths);
      result[b] = error ? error.message : paths.length;
    }
  }
  const { error } = await admin.auth.admin.deleteUser(user_id);
  result.user_deleted = error ? error.message : true;
  return Response.json(result);
});
