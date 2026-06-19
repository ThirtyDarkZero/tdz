import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useMoodCast() {
  const [loading, setLoading] = useState(false);

  const cast = useCallback(async (prompt: string): Promise<any[] | null> => {
    if (!prompt || prompt.trim().length < 3) return null;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-mood-mix", {
        body: { prompt: prompt.trim(), limit: 15 },
      });
      if (error) throw error;
      const tracks: any[] = data?.tracks ?? data?.results ?? [];
      if (!tracks.length) {
        toast.error("No matches for that vibe — try another mood");
        return null;
      }
      toast.success(`Mood mix ready · ${tracks.length} tracks`);
      return tracks;
    } catch (e: any) {
      toast.error(e?.message || "Mood Mix unavailable. Sign in to try again.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { cast, loading };
}
