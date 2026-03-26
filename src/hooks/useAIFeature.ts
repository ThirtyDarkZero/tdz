import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIFeatureResult<T> {
  result: T | null;
  loading: boolean;
  error: string | null;
  invoke: (data: any) => Promise<T | null>;
}

export function useAIFeature<T = any>(type: string): AIFeatureResult<T> {
  const [result, setResult] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invoke = async (data: any): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke('ai-music-features', {
        body: { type, data }
      });

      if (fnError) throw fnError;
      if (fnData?.error) throw new Error(fnData.error);

      const parsed = fnData?.result;
      setResult(parsed);
      return parsed;
    } catch (err: any) {
      const msg = err.message || "AI feature failed";
      setError(msg);
      if (msg.includes("Rate limited")) {
        toast.error("AI rate limited — please wait a moment and try again.");
      } else if (msg.includes("credits")) {
        toast.error("AI credits exhausted. Please add funds in Settings → Workspace → Usage.");
      } else {
        toast.error(msg);
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { result, loading, error, invoke };
}
