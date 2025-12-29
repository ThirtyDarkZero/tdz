import { useState, useCallback, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { usePlayer, Track } from "@/contexts/PlayerContext";

type RadioSeedType = 'track' | 'artist' | 'genre' | 'mood';

interface RadioStation {
  id: string;
  name: string;
  seedType: RadioSeedType;
  seedId: string;
  seedName: string;
  isActive: boolean;
}

interface UseRadioModeOptions {
  autoQueue?: boolean;
  queueSize?: number;
  avoidRecentTracks?: boolean;
  recentTrackWindow?: number; // in minutes
}

/**
 * Hook for radio/continuous play mode with auto-queue recommendations
 * Inspired by PHP platform's radio streaming patterns
 */
export function useRadioMode(options: UseRadioModeOptions = {}) {
  const { 
    autoQueue = true, 
    queueSize = 10,
    avoidRecentTracks = true,
    recentTrackWindow = 60,
  } = options;
  
  const { currentTrack, queue, addToQueue, playTrack } = usePlayer();
  
  const [isRadioMode, setIsRadioMode] = useState(false);
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Set<string>>(new Set());

  // Track recently played songs
  useEffect(() => {
    if (currentTrack) {
      setRecentlyPlayed(prev => {
        const updated = new Set(prev);
        updated.add(currentTrack.id);
        return updated;
      });
    }
  }, [currentTrack?.id]);

  // Clear old tracks from recently played
  useEffect(() => {
    if (!avoidRecentTracks) return;

    const interval = setInterval(() => {
      // Reset recently played after window expires
      const now = Date.now();
      // This is a simplified version - in production, store timestamps
    }, recentTrackWindow * 60 * 1000);

    return () => clearInterval(interval);
  }, [avoidRecentTracks, recentTrackWindow]);

  // Fetch similar tracks based on seed
  const fetchSimilarTracks = useCallback(async (
    seedType: RadioSeedType,
    seedId: string,
    limit: number = queueSize
  ): Promise<Track[]> => {
    setIsLoadingTracks(true);
    
    try {
      let query = supabase
        .from('tracks')
        .select(`
          id,
          title,
          artist_name,
          duration,
          file_path,
          play_count,
          album_cover_path,
          album_cover_bucket,
          motion_cover_path,
          motion_cover_bucket,
          user_id,
          album_id,
          genre,
          is_published
        `)
        .eq('is_published', true)
        .limit(limit * 2); // Fetch more to account for filtering

      // Filter by seed type
      switch (seedType) {
        case 'track':
          // Get the seed track's genre and artist for similarity
          const { data: seedTrack } = await supabase
            .from('tracks')
            .select('genre, artist_name')
            .eq('id', seedId)
            .single();
          
          if (seedTrack?.genre) {
            query = query.eq('genre', seedTrack.genre);
          }
          break;
          
        case 'artist':
          query = query.eq('user_id', seedId);
          break;
          
        case 'genre':
          query = query.eq('genre', seedId);
          break;
          
        case 'mood':
          // Mood-based filtering would use AI tags in production
          query = query.ilike('genre', `%${seedId}%`);
          break;
      }

      const { data: tracks, error } = await query;
      
      if (error) throw error;
      if (!tracks) return [];

      // Filter out recently played and current track
      let filtered = tracks.filter(t => {
        if (currentTrack && t.id === currentTrack.id) return false;
        if (avoidRecentTracks && recentlyPlayed.has(t.id)) return false;
        return true;
      });

      // Shuffle for variety
      filtered = filtered.sort(() => Math.random() - 0.5);

      // Take only what we need
      return filtered.slice(0, limit) as Track[];
      
    } catch (err) {
      console.error('Failed to fetch radio tracks:', err);
      return [];
    } finally {
      setIsLoadingTracks(false);
    }
  }, [currentTrack, recentlyPlayed, avoidRecentTracks, queueSize]);

  // Start radio from a seed
  const startRadio = useCallback(async (
    seedType: RadioSeedType,
    seedId: string,
    seedName: string
  ) => {
    const station: RadioStation = {
      id: `${seedType}-${seedId}`,
      name: `${seedName} Radio`,
      seedType,
      seedId,
      seedName,
      isActive: true,
    };

    setCurrentStation(station);
    setIsRadioMode(true);

    // Fetch initial tracks
    const tracks = await fetchSimilarTracks(seedType, seedId);
    
    if (tracks.length > 0) {
      // Play first track and queue the rest
      playTrack(tracks[0], tracks);
    }
  }, [fetchSimilarTracks, playTrack]);

  // Auto-queue more tracks when queue is low
  useEffect(() => {
    if (!isRadioMode || !autoQueue || !currentStation) return;

    const queueRemaining = queue.length - (queue.findIndex(t => t.id === currentTrack?.id) + 1);
    
    // Queue more tracks when we're running low
    if (queueRemaining < 3) {
      fetchSimilarTracks(currentStation.seedType, currentStation.seedId)
        .then(newTracks => {
          newTracks.forEach(track => addToQueue(track));
        });
    }
  }, [currentTrack?.id, queue.length, isRadioMode, autoQueue, currentStation, fetchSimilarTracks, addToQueue]);

  // Stop radio mode
  const stopRadio = useCallback(() => {
    setIsRadioMode(false);
    setCurrentStation(null);
  }, []);

  // Create station from current track
  const startRadioFromTrack = useCallback(async () => {
    if (!currentTrack) return;
    
    await startRadio('track', currentTrack.id, currentTrack.title);
  }, [currentTrack, startRadio]);

  // Create station from artist
  const startRadioFromArtist = useCallback(async (artistId: string, artistName: string) => {
    await startRadio('artist', artistId, artistName);
  }, [startRadio]);

  // Create station from genre
  const startRadioFromGenre = useCallback(async (genre: string) => {
    await startRadio('genre', genre, genre);
  }, [startRadio]);

  return {
    isRadioMode,
    currentStation,
    isLoadingTracks,
    startRadio,
    stopRadio,
    startRadioFromTrack,
    startRadioFromArtist,
    startRadioFromGenre,
  };
}
