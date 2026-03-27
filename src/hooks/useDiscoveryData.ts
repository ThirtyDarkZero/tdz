import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useDiscoveryData() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [singles, setSingles] = useState<any[]>([]);
  const [albumTracksMap, setAlbumTracksMap] = useState<Map<string, any[]>>(new Map());
  const [artists, setArtists] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());
  const [likedTracksList, setLikedTracksList] = useState<any[]>([]);
  const [followedArtists, setFollowedArtists] = useState<Set<string>>(new Set());
  const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userLoaded, setUserLoaded] = useState(false);

  // Keep auth state in sync so Discovery/Studio gating never uses stale sessions.
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setUser(user);
      setUserLoaded(true);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setUserLoaded(true);

      // Clear user-scoped caches immediately on sign-out so UI can't "stick" as signed-in.
      if (!nextUser) {
        setLikedTracks(new Set());
        setLikedTracksList([]);
        setFollowedArtists(new Set());
        setPlaylists([]);
        setRecentlyPlayed([]);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // Load public data immediately, then load user-specific data when user is available
  useEffect(() => {
    if (userLoaded) {
      loadAllData();
    }
  }, [userLoaded, user]);

  const loadAllData = async () => {
    // Always load public data
    const publicDataPromises = [
      loadTracks(),
      loadArtists(),
      loadAlbums()
    ];

    // Load user-specific data only if logged in
    if (user) {
      publicDataPromises.push(
        loadPlaylists(),
        loadLikedTracks(),
        loadFollowedArtists(),
        loadRecentlyPlayed()
      );
    }

    await Promise.all(publicDataPromises);
    setLoading(false);
  };

  const loadTracks = async () => {
    const { data: tracksData, error: tracksError } = await supabase
      .from("tracks")
      .select("*, albums(*)")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(300);

    if (tracksError) {
      console.error("Error loading tracks:", tracksError);
      return;
    }

    const { data: artistsData } = await supabase
      .from("artist_profiles")
      .select("artist_name, user_id");

    const artistMap = new Map(
      (artistsData || []).map(artist => [artist.artist_name, artist.user_id])
    );

    const enhancedTracks = (tracksData || [])
      .filter(track => !track.albums || track.albums.is_published !== false)
      .map(track => ({
        ...track,
        artist_user_id: artistMap.get(track.artist_name),
        album_cover_path: track.album_cover_path || track.albums?.cover_art_path,
        album_cover_bucket: track.album_cover_bucket || 'album-covers',
        motion_cover_path: track.motion_cover_path || track.albums?.motion_cover_path,
        motion_cover_bucket: track.motion_cover_bucket || track.albums?.motion_cover_bucket || 'motion-covers',
      }));

    // Separate singles (no album) from album tracks
    const singles = enhancedTracks.filter(t => !t.album_id);
    const albumTracksMap = new Map<string, typeof enhancedTracks>();
    enhancedTracks.filter(t => t.album_id).forEach(t => {
      const list = albumTracksMap.get(t.album_id) || [];
      list.push(t);
      albumTracksMap.set(t.album_id, list);
    });

    setSingles(singles);
    setAlbumTracksMap(albumTracksMap);
    setTracks(enhancedTracks);
  };

  const loadArtists = async () => {
    const { data, error } = await supabase
      .from("artist_profiles")
      .select("*")
      .order("monthly_listeners", { ascending: false })
      .order("total_plays", { ascending: false })
      .limit(100);

    if (!error && data) {
      setArtists(data);
    }
  };

  const loadAlbums = async () => {
    const { data, error } = await supabase
      .from("albums")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setAlbums(data);
    }
  };

  const loadPlaylists = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("playlists")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (!error && data) {
      setPlaylists(data);
    }
  };

  const loadLikedTracks = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("track_likes")
      .select("track_id, tracks(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setLikedTracks(new Set(data.map(item => item.track_id)));
      setLikedTracksList(data.filter(item => item.tracks).map(item => item.tracks));
    }
  };

  const loadFollowedArtists = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("artist_follows")
      .select("artist_id")
      .eq("follower_id", user.id);

    if (!error && data) {
      setFollowedArtists(new Set(data.map(item => item.artist_id)));
    }
  };

  const loadRecentlyPlayed = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("listening_history")
      .select("*, tracks(*)")
      .eq("user_id", user.id)
      .order("played_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      const uniqueTracks = data
        .filter(item => item.tracks)
        .reduce((acc: any[], item) => {
          if (!acc.find(t => t.id === item.tracks.id)) {
            acc.push(item.tracks);
          }
          return acc;
        }, []);
      setRecentlyPlayed(uniqueTracks);
    }
  };

  const toggleLike = async (trackId: string) => {
    if (!user) {
      toast.error("Please sign in to like tracks");
      return;
    }

    const isLiked = likedTracks.has(trackId);

    if (isLiked) {
      await supabase
        .from("track_likes")
        .delete()
        .eq("user_id", user.id)
        .eq("track_id", trackId);

      setLikedTracks(prev => {
        const next = new Set(prev);
        next.delete(trackId);
        return next;
      });
      toast.success("Removed from liked songs");
    } else {
      await supabase
        .from("track_likes")
        .insert({ user_id: user.id, track_id: trackId });

      setLikedTracks(prev => new Set(prev).add(trackId));
      toast.success("Added to liked songs");
    }
  };

  const toggleFollow = async (artistUserId: string) => {
    if (!user) {
      toast.error("Please sign in to follow artists");
      return;
    }

    const isFollowing = followedArtists.has(artistUserId);

    if (isFollowing) {
      await supabase
        .from("artist_follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("artist_id", artistUserId);

      setFollowedArtists(prev => {
        const next = new Set(prev);
        next.delete(artistUserId);
        return next;
      });
      toast.success("Unfollowed artist");
    } else {
      await supabase
        .from("artist_follows")
        .insert({ follower_id: user.id, artist_id: artistUserId });

      setFollowedArtists(prev => new Set(prev).add(artistUserId));
      toast.success("Following artist");
    }
  };

  return {
    tracks,
    singles,
    albumTracksMap,
    artists,
    albums,
    playlists,
    likedTracks,
    likedTracksList,
    followedArtists,
    recentlyPlayed,
    loading,
    user,
    toggleLike,
    toggleFollow,
    refreshPlaylists: loadPlaylists,
    refreshLikedTracks: loadLikedTracks
  };
}
