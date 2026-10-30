import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, Play, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { recordClick } from "@/lib/smartLinks";
import tdzLogo from "@/assets/tdz-logo.png";

interface LinkRow {
  short_code: string;
  title: string | null;
  description: string | null;
  artwork_url: string | null;
  platforms: Record<string, string> | null;
  target_type: string | null;
  target_id: string | null;
  user_id: string;
}

/** Public landing page for /link/:code and /s/:code. */
export default function SmartLinkPage() {
  const { code = "" } = useParams();
  const [link, setLink] = useState<LinkRow | null | undefined>(undefined);
  const [art, setArt] = useState<string | null>(null);
  const [artist, setArtist] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("smart_links")
        .select("short_code, title, description, artwork_url, platforms, target_type, target_id, user_id")
        .ilike("short_code", code).maybeSingle();
      const row = (data as unknown as LinkRow) ?? null;
      setLink(row);
      if (!row) return;
      recordClick(row.short_code, "view");
      document.title = `${row.title ?? "Listen"} | TDZ`;
      const { data: p } = await supabase.from("artist_profiles").select("artist_name").eq("user_id", row.user_id).maybeSingle();
      setArtist(p?.artist_name ?? null);
      if (row.artwork_url) { setArt(row.artwork_url); return; }
      if (row.target_type === "track" && row.target_id) {
        const { data: t } = await supabase.from("tracks").select("album_cover_path, album_cover_bucket").eq("id", row.target_id).maybeSingle();
        if (t?.album_cover_path) setArt(supabase.storage.from(t.album_cover_bucket || "album-covers").getPublicUrl(t.album_cover_path).data.publicUrl);
      } else if (row.target_type === "album" && row.target_id) {
        const { data: a } = await supabase.from("albums").select("cover_art_path").eq("id", row.target_id).maybeSingle();
        if (a?.cover_art_path) setArt(supabase.storage.from("album-covers").getPublicUrl(a.cover_art_path).data.publicUrl);
      }
    })();
  }, [code]);

  if (link === undefined) {
    return <main className="min-h-screen grid place-items-center bg-black"><Loader2 className="w-6 h-6 animate-spin text-white" aria-label="Loading" /></main>;
  }
  if (!link) {
    return (
      <main className="min-h-screen grid place-items-center bg-black text-white p-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold">This link doesn't exist</h1>
          <p className="mt-2 text-white/60">It may have been removed or mistyped.</p>
          <Link to="/discover" className="inline-block mt-6 underline">Browse music on TDZ</Link>
        </div>
      </main>
    );
  }

  const tdzPath = link.target_id && link.target_type ? `/${link.target_type}/${link.target_id}` : null;
  const platforms = Object.entries(link.platforms ?? {}).filter(([, url]) => /^https?:\/\//i.test(url));

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden">
      {art && <img src={art} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-40 scale-110" />}
      <div className="relative max-w-md mx-auto px-4 py-10 flex flex-col items-center">
        {art
          ? <img src={art} alt={`${link.title ?? "Release"} artwork`} className="w-64 h-64 rounded-2xl object-cover shadow-2xl" />
          : <div className="w-64 h-64 rounded-2xl bg-white/10" />}
        <h1 className="mt-6 text-2xl font-semibold text-center">{link.title ?? "Listen now"}</h1>
        {artist && <p className="text-white/70 mt-1">{artist}</p>}
        {link.description && <p className="text-white/60 text-sm mt-3 text-center">{link.description}</p>}

        <ul className="w-full mt-8 rounded-2xl bg-white/10 backdrop-blur divide-y divide-white/10">
          {tdzPath && (
            <li>
              <Link to={tdzPath} onClick={() => recordClick(link.short_code, "TDZ")}
                className="flex items-center justify-between px-5 py-4 hover:bg-white/5">
                <span className="flex items-center gap-3 font-medium"><img src={tdzLogo} alt="" className="w-7 h-7" />TDZ</span>
                <span className="flex items-center gap-1 text-sm rounded-full bg-[#ff6347] text-black px-4 py-1.5 font-semibold"><Play className="w-3.5 h-3.5" />Play</span>
              </Link>
            </li>
          )}
          {platforms.map(([name, url]) => (
            <li key={name}>
              <a href={url} target="_blank" rel="noopener noreferrer" onClick={() => recordClick(link.short_code, name)}
                className="flex items-center justify-between px-5 py-4 hover:bg-white/5">
                <span className="font-medium">{name}</span>
                <span className="flex items-center gap-1 text-sm rounded-full border border-white/40 px-4 py-1.5">Open<ExternalLink className="w-3.5 h-3.5" /></span>
              </a>
            </li>
          ))}
        </ul>
        <Link to="/" className="mt-10 text-xs text-white/50">Powered by TDZ Distribution</Link>
      </div>
    </main>
  );
}
