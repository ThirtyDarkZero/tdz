import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import tdzLogo from "@/assets/tdz-logo.png";

interface Campaign {
  campaign_name: string;
  description: string | null;
  release_date: string;
  cover_image_path: string | null;
  track_id: string | null;
  album_id: string | null;
  user_id: string;
}

const rpc = supabase.rpc.bind(supabase) as unknown as (
  fn: string, args: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message: string } | null }>;

/** Public page for /presave/:slug — fans leave an email to hear on release day. */
export default function PresavePage() {
  const { slug = "" } = useParams();
  const [c, setC] = useState<Campaign | null | undefined>(undefined);
  const [art, setArt] = useState<string | null>(null);
  const [artist, setArtist] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "joined" | "already">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("presave_campaigns")
        .select("campaign_name, description, release_date, cover_image_path, track_id, album_id, user_id")
        .ilike("slug", slug).eq("is_active", true).maybeSingle();
      const row = (data as Campaign) ?? null;
      setC(row);
      if (!row) return;
      document.title = `Pre-save ${row.campaign_name} | TDZ`;
      const { data: p } = await supabase.from("artist_profiles").select("artist_name").eq("user_id", row.user_id).maybeSingle();
      setArtist(p?.artist_name ?? null);
      if (row.cover_image_path) { setArt(supabase.storage.from("album-covers").getPublicUrl(row.cover_image_path).data.publicUrl); return; }
      if (row.album_id) {
        const { data: a } = await supabase.from("albums").select("cover_art_path").eq("id", row.album_id).maybeSingle();
        if (a?.cover_art_path) setArt(supabase.storage.from("album-covers").getPublicUrl(a.cover_art_path).data.publicUrl);
      } else if (row.track_id) {
        const { data: t } = await supabase.from("tracks").select("album_cover_path, album_cover_bucket").eq("id", row.track_id).maybeSingle();
        if (t?.album_cover_path) setArt(supabase.storage.from(t.album_cover_bucket || "album-covers").getPublicUrl(t.album_cover_path).data.publicUrl);
      }
    })();
  }, [slug]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("busy");
    setError(null);
    const { data, error } = await rpc("presave_signup", { p_slug: slug, p_email: email });
    if (error) { setError(error.message); setState("idle"); return; }
    setState(data === "already" ? "already" : "joined");
  };

  if (c === undefined) return <main className="min-h-screen grid place-items-center bg-black"><Loader2 className="w-6 h-6 animate-spin text-white" aria-label="Loading" /></main>;
  if (!c) {
    return (
      <main className="min-h-screen grid place-items-center bg-black text-white p-6 text-center">
        <div><h1 className="text-2xl font-semibold">This pre-save isn't available</h1>
          <Link to="/discover" className="inline-block mt-6 underline">Browse music on TDZ</Link></div>
      </main>
    );
  }
  const released = new Date(c.release_date + "T12:00:00") <= new Date();

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden">
      {art && <img src={art} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-40 scale-110" />}
      <div className="relative max-w-md mx-auto px-4 py-10 flex flex-col items-center text-center">
        {art ? <img src={art} alt={`${c.campaign_name} artwork`} className="w-64 h-64 rounded-2xl object-cover shadow-2xl" />
          : <div className="w-64 h-64 rounded-2xl bg-white/10" />}
        <h1 className="mt-6 text-2xl font-semibold">{c.campaign_name}</h1>
        {artist && <p className="text-white/70 mt-1">{artist}</p>}
        <p className="mt-3 text-sm text-white/80">
          {released ? "Out now on TDZ" : `Out ${format(new Date(c.release_date + "T12:00:00"), "MMMM d, yyyy")}`}
        </p>
        {c.description && <p className="text-white/60 text-sm mt-3">{c.description}</p>}

        {released ? (
          <Link to={c.album_id ? `/album/${c.album_id}` : c.track_id ? `/track/${c.track_id}` : "/discover"}
            className="mt-8 rounded-full bg-[#ff6347] text-black font-semibold px-8 py-3">Listen now</Link>
        ) : state === "joined" || state === "already" ? (
          <p role="status" className="mt-8 rounded-2xl bg-white/10 px-5 py-4">
            {state === "joined" ? "You're in. We'll email you the day it drops." : "You're already on the list for this one."}
          </p>
        ) : (
          <form onSubmit={submit} className="mt-8 w-full grid gap-3">
            <label htmlFor="presave-email" className="text-sm text-left">Get it the day it drops</label>
            <input id="presave-email" type="email" required autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
              className="h-12 rounded-full px-5 bg-white text-black" />
            <button type="submit" disabled={state === "busy"} className="h-12 rounded-full bg-[#ff6347] text-black font-semibold">
              {state === "busy" ? "Saving…" : "Pre-save"}
            </button>
            {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
            <p className="text-xs text-white/50">
              You'll get release news from {artist ?? "this artist"} through TDZ. Unsubscribe any time.
            </p>
          </form>
        )}
        <Link to="/" className="mt-10 text-xs text-white/50">Powered by TDZ Distribution</Link>
      </div>
    </main>
  );
}
