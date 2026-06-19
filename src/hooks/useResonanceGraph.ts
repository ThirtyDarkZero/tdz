import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ResonanceNode {
  id: string;
  label: string;
  kind: "origin" | "share" | "like" | "follow";
  at: string;
}
export interface ResonanceEdge {
  from: string;
  to: string;
}

export function useResonanceGraph(trackId?: string | null) {
  const [nodes, setNodes] = useState<ResonanceNode[]>([]);
  const [edges, setEdges] = useState<ResonanceEdge[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!trackId) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        // Public signals only.
        const [sharesRes, likesRes] = await Promise.all([
          (supabase as any)
            .from("user_shares")
            .select("id, user_id, created_at, share_type, content_id")
            .eq("content_id", trackId)
            .order("created_at", { ascending: true })
            .limit(40),
          (supabase as any)
            .from("track_likes")
            .select("id, user_id, created_at")
            .eq("track_id", trackId)
            .order("created_at", { ascending: true })
            .limit(40),
        ]);

        if (cancelled) return;

        const origin: ResonanceNode = {
          id: "origin",
          label: "Origin · Track Released",
          kind: "origin",
          at: new Date().toISOString(),
        };
        const ns: ResonanceNode[] = [origin];
        const es: ResonanceEdge[] = [];

        (sharesRes.data ?? []).forEach((s: any, i: number) => {
          const id = `s-${s.id}`;
          ns.push({
            id,
            label: `Resonated · ${s.share_type ?? "share"}`,
            kind: "share",
            at: s.created_at,
          });
          // Chain shares to previous share (propagation), first to origin.
          es.push({
            from: i === 0 ? "origin" : `s-${(sharesRes.data as any[])[i - 1].id}`,
            to: id,
          });
        });

        (likesRes.data ?? []).forEach((l: any) => {
          const id = `l-${l.id}`;
          ns.push({
            id,
            label: "Resonated · ❤",
            kind: "like",
            at: l.created_at,
          });
          es.push({ from: "origin", to: id });
        });

        setNodes(ns);
        setEdges(es);
      } catch {
        setNodes([]);
        setEdges([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [trackId]);

  return { nodes, edges, loading };
}
