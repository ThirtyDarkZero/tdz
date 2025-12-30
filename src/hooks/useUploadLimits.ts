import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription, SubscriptionPlan } from "@/hooks/useSubscription";

interface UploadLimits {
  maxTracks: number;
  maxAlbums: number;
  currentTracks: number;
  currentAlbums: number;
  canUploadTrack: boolean;
  canCreateAlbum: boolean;
  tracksRemaining: number;
  albumsRemaining: number;
}

const PLAN_LIMITS: Record<SubscriptionPlan, { maxTracks: number; maxAlbums: number; maxTracksPerAlbum: number }> = {
  free: { maxTracks: 3, maxAlbums: 1, maxTracksPerAlbum: 10 },
  starter: { maxTracks: 50, maxAlbums: 5, maxTracksPerAlbum: 25 },
  pro: { maxTracks: -1, maxAlbums: -1, maxTracksPerAlbum: 25 }, // unlimited tracks/albums
  enterprise: { maxTracks: -1, maxAlbums: -1, maxTracksPerAlbum: 25 }, // unlimited
  fan: { maxTracks: 0, maxAlbums: 0, maxTracksPerAlbum: 0 }, // fans can't upload
};

export function useUploadLimits() {
  const { user } = useAuth();
  const { getPlan, loading: subLoading } = useSubscription(user);
  const [currentTracks, setCurrentTracks] = useState(0);
  const [currentAlbums, setCurrentAlbums] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !subLoading) {
      loadCounts();
    }
  }, [user, subLoading]);

  const loadCounts = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Count user's tracks
      const { count: trackCount, error: trackError } = await supabase
        .from("tracks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (trackError) throw trackError;

      // Count user's albums
      const { count: albumCount, error: albumError } = await supabase
        .from("albums")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (albumError) throw albumError;

      setCurrentTracks(trackCount || 0);
      setCurrentAlbums(albumCount || 0);
    } catch (error) {
      console.error("Error loading upload counts:", error);
    } finally {
      setLoading(false);
    }
  };

  const plan = getPlan();
  const limits = PLAN_LIMITS[plan];
  const maxTracks = limits.maxTracks;
  const maxAlbums = limits.maxAlbums;
  const maxTracksPerAlbum = limits.maxTracksPerAlbum;

  // -1 means unlimited
  const canUploadTrack = maxTracks === -1 || currentTracks < maxTracks;
  const canCreateAlbum = maxAlbums === -1 || currentAlbums < maxAlbums;
  const tracksRemaining = maxTracks === -1 ? Infinity : Math.max(0, maxTracks - currentTracks);
  const albumsRemaining = maxAlbums === -1 ? Infinity : Math.max(0, maxAlbums - currentAlbums);

  return {
    loading: loading || subLoading,
    maxTracks,
    maxAlbums,
    maxTracksPerAlbum,
    currentTracks,
    currentAlbums,
    canUploadTrack,
    canCreateAlbum,
    tracksRemaining,
    albumsRemaining,
    plan,
    refetch: loadCounts,
  };
}
