import { useRef, useCallback, useState } from 'react';

interface CrossfadeOptions {
  duration: number; // in seconds
  onCrossfadeStart?: () => void;
  onCrossfadeEnd?: () => void;
}

export function useCrossfade(options: CrossfadeOptions = { duration: 3 }) {
  const { duration = 3 } = options;
  const [isCrossfading, setIsCrossfading] = useState(false);
  const fadeIntervalRef = useRef<number | null>(null);
  const crossfadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fade out the current player volume over the crossfade duration
  const startCrossfade = useCallback((
    currentPlayer: any,
    onFadeComplete: () => void
  ) => {
    if (!currentPlayer || isCrossfading) return;
    
    setIsCrossfading(true);
    options.onCrossfadeStart?.();
    
    const startVolume = currentPlayer.getVolume?.() || 100;
    const steps = duration * 20; // 20 updates per second for smooth fade
    const volumeStep = startVolume / steps;
    let currentStep = 0;
    
    // Clear any existing fade
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }
    
    fadeIntervalRef.current = window.setInterval(() => {
      currentStep++;
      const newVolume = Math.max(0, startVolume - (volumeStep * currentStep));
      
      try {
        currentPlayer.setVolume?.(newVolume);
      } catch (e) {
        // Player might be destroyed
      }
      
      if (currentStep >= steps) {
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
        setIsCrossfading(false);
        options.onCrossfadeEnd?.();
        onFadeComplete();
      }
    }, 1000 / 20); // 50ms intervals
    
  }, [duration, isCrossfading, options]);

  // Calculate when to start crossfade based on track duration and current time
  const shouldStartCrossfade = useCallback((
    currentTime: number,
    trackDuration: number
  ): boolean => {
    if (trackDuration <= 0 || isCrossfading) return false;
    const timeRemaining = trackDuration - currentTime;
    return timeRemaining <= duration && timeRemaining > 0;
  }, [duration, isCrossfading]);

  // Fade in a new player
  const fadeInPlayer = useCallback((
    player: any,
    targetVolume: number = 100
  ) => {
    if (!player) return;
    
    // Start at 0 and fade up
    try {
      player.setVolume?.(0);
    } catch (e) {}
    
    const steps = duration * 20;
    const volumeStep = targetVolume / steps;
    let currentStep = 0;
    
    const fadeIn = window.setInterval(() => {
      currentStep++;
      const newVolume = Math.min(targetVolume, volumeStep * currentStep);
      
      try {
        player.setVolume?.(newVolume);
      } catch (e) {}
      
      if (currentStep >= steps) {
        clearInterval(fadeIn);
      }
    }, 1000 / 20);
  }, [duration]);

  // Cleanup
  const cleanup = useCallback(() => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
    if (crossfadeTimeoutRef.current) {
      clearTimeout(crossfadeTimeoutRef.current);
      crossfadeTimeoutRef.current = null;
    }
    setIsCrossfading(false);
  }, []);

  return {
    isCrossfading,
    startCrossfade,
    shouldStartCrossfade,
    fadeInPlayer,
    cleanup,
    crossfadeDuration: duration,
  };
}
