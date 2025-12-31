import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface GlobalTrack {
  id: string;
  title: string;
  artist_name: string;
  youtubeId?: string;
  thumbnail?: string;
  source: 'youtube' | 'discogs' | 'musicbrainz' | 'theaudiodb' | 'billboard' | 'tdz';
  album_title?: string;
  duration?: number;
}

export function useGlobalLibrary() {
  const { user } = useAuth();
  const [likedGlobalTracks, setLikedGlobalTracks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Load user's liked global tracks
  const loadLikedGlobalTracks = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('liked_youtube_tracks')
        .select('track_id')
        .eq('user_id', user.id);
      
      if (data) {
        setLikedGlobalTracks(new Set(data.map(t => t.track_id)));
      }
    } catch (error) {
      console.error('Error loading liked global tracks:', error);
    }
  }, [user]);

  // Toggle like for a global track
  const toggleGlobalLike = useCallback(async (track: GlobalTrack) => {
    if (!user) {
      toast.error('Please sign in to like tracks');
      return;
    }

    const trackId = track.youtubeId ? `yt:${track.youtubeId}` : track.id;
    const isLiked = likedGlobalTracks.has(trackId);

    try {
      if (isLiked) {
        await supabase
          .from('liked_youtube_tracks')
          .delete()
          .eq('user_id', user.id)
          .eq('track_id', trackId);
        
        setLikedGlobalTracks(prev => {
          const next = new Set(prev);
          next.delete(trackId);
          return next;
        });
        toast.success('Removed from liked songs');
      } else {
        await supabase
          .from('liked_youtube_tracks')
          .insert({
            user_id: user.id,
            track_id: trackId,
            title: track.title,
            artist_name: track.artist_name,
            youtube_id: track.youtubeId,
            thumbnail: track.thumbnail,
            source: track.source,
          });
        
        setLikedGlobalTracks(prev => new Set(prev).add(trackId));
        toast.success('Added to liked songs');
      }
    } catch (error) {
      console.error('Error toggling global like:', error);
      toast.error('Failed to update');
    }
  }, [user, likedGlobalTracks]);

  // Check if a track is liked
  const isGlobalTrackLiked = useCallback((track: GlobalTrack) => {
    const trackId = track.youtubeId ? `yt:${track.youtubeId}` : track.id;
    return likedGlobalTracks.has(trackId);
  }, [likedGlobalTracks]);

  // Add global track to a playlist (via virtual_tracks)
  const addGlobalTrackToPlaylist = useCallback(async (
    playlistId: string,
    track: GlobalTrack
  ) => {
    if (!user) {
      toast.error('Please sign in');
      return false;
    }

    try {
      const virtualId = track.youtubeId ? `youtube:${track.youtubeId}` : `global:${track.id}`;

      // Upsert into virtual_tracks
      await supabase
        .from('virtual_tracks')
        .upsert({
          id: virtualId,
          title: track.title,
          artist_name: track.artist_name,
          youtube_id: track.youtubeId,
          thumbnail: track.thumbnail,
          source: track.source,
          album_title: track.album_title,
        }, { onConflict: 'id' });

      // Get max position in playlist
      const { data: posData } = await supabase
        .from('playlist_tracks')
        .select('position')
        .eq('playlist_id', playlistId)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = (posData?.[0]?.position || 0) + 1;

      // Check if already exists
      const { data: existing } = await supabase
        .from('playlist_tracks')
        .select('id')
        .eq('playlist_id', playlistId)
        .eq('track_id', virtualId)
        .maybeSingle();

      if (existing) {
        toast.info('Track already in playlist');
        return true;
      }

      // Add to playlist
      await supabase
        .from('playlist_tracks')
        .insert({
          playlist_id: playlistId,
          track_id: virtualId,
          position: nextPosition,
          added_by: user.id,
        });

      toast.success(`Added "${track.title}" to playlist`);
      return true;
    } catch (error) {
      console.error('Error adding to playlist:', error);
      toast.error('Failed to add to playlist');
      return false;
    }
  }, [user]);

  // Search global library with unified engine
  const searchGlobalLibrary = useCallback(async (
    query: string,
    options?: { limit?: number; sources?: string[] }
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('unified-music-search', {
        body: {
          query,
          limit: options?.limit || 20,
          sources: options?.sources || ['billboard', 'theaudiodb', 'discogs', 'musicbrainz'],
          includeAcoustic: true,
        }
      });

      if (error) throw error;
      return data?.results || [];
    } catch (error) {
      console.error('Global library search error:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get trending from global library
  const getTrendingGlobal = useCallback(async (limit = 20) => {
    try {
      const { data } = await supabase.functions.invoke('unified-music-search', {
        body: {
          query: 'Billboard Hot 100',
          limit,
          sources: ['billboard', 'theaudiodb'],
          includeAcoustic: true,
        }
      });
      return data?.results || [];
    } catch (error) {
      console.error('Error getting trending:', error);
      return [];
    }
  }, []);

  return {
    likedGlobalTracks,
    loading,
    loadLikedGlobalTracks,
    toggleGlobalLike,
    isGlobalTrackLiked,
    addGlobalTrackToPlaylist,
    searchGlobalLibrary,
    getTrendingGlobal,
  };
}
