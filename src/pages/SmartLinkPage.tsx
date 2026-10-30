import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { recordClick } from "@/lib/smartLinks";
import { ReleaseCard, ReleaseCardPage } from "@/components/promote/ReleaseCard";

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
  const links = Object.entries(link.platforms ?? {})
    .filter(([, url]) => /^https?:\/\//i.test(url))
    .map(([name, url]) => ({ name, href: url, onClick: () => recordClick(link.short_code, name) }));

  return (
    <ReleaseCardPage art={art}>
      <ReleaseCard
        art={art}
        title={link.title ?? "Listen now"}
        artist={artist}
        description={link.description}
        tdz={tdzPath ? { name: "TDZ", href: tdzPath, internal: true, onClick: () => recordClick(link.short_code, "TDZ") } : null}
        links={links}
      />
    </ReleaseCardPage>
  );
}
