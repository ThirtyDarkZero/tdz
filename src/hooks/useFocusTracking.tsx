import { useState, useEffect, useCallback } from 'react';

interface FocusState {
  isFocused: boolean;
  focusedDuration: number;
  totalDuration: number;
  focusPercentage: number;
  lastFocusChange: Date;
}

/**
 * Hook to track browser tab focus for accurate stream counting
 * Based on RKHM's focus tracking pattern - only count streams when user is actively listening
 */
export function useFocusTracking() {
  const [focusState, setFocusState] = useState<FocusState>({
    isFocused: !document.hidden,
    focusedDuration: 0,
    totalDuration: 0,
    focusPercentage: 100,
    lastFocusChange: new Date(),
  });

  const [trackingStartTime, setTrackingStartTime] = useState<Date | null>(null);
  const [focusIntervals, setFocusIntervals] = useState<Array<{ start: number; end: number | null }>>([]);

  // Start tracking when playback begins
  const startTracking = useCallback(() => {
    const now = new Date();
    setTrackingStartTime(now);
    setFocusIntervals([{ start: now.getTime(), end: null }]);
    setFocusState(prev => ({
      ...prev,
      focusedDuration: 0,
      totalDuration: 0,
      focusPercentage: 100,
      isFocused: !document.hidden,
      lastFocusChange: now,
    }));
  }, []);

  // Stop tracking and return final stats
  const stopTracking = useCallback(() => {
    if (!trackingStartTime) return focusState;

    const now = new Date();
    const totalDuration = (now.getTime() - trackingStartTime.getTime()) / 1000;
    
    // Calculate focused duration from intervals
    let focusedMs = 0;
    focusIntervals.forEach(interval => {
      const end = interval.end || now.getTime();
      if (!document.hidden && !interval.end) {
        focusedMs += end - interval.start;
      } else if (interval.end) {
        focusedMs += interval.end - interval.start;
      }
    });

    const focusedDuration = focusedMs / 1000;
    const focusPercentage = totalDuration > 0 ? (focusedDuration / totalDuration) * 100 : 100;

    setTrackingStartTime(null);
    setFocusIntervals([]);

    return {
      isFocused: !document.hidden,
      focusedDuration,
      totalDuration,
      focusPercentage,
      lastFocusChange: now,
    };
  }, [focusState, trackingStartTime, focusIntervals]);

  // Reset tracking
  const resetTracking = useCallback(() => {
    setTrackingStartTime(null);
    setFocusIntervals([]);
    setFocusState({
      isFocused: !document.hidden,
      focusedDuration: 0,
      totalDuration: 0,
      focusPercentage: 100,
      lastFocusChange: new Date(),
    });
  }, []);

  // Handle visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isFocused = !document.hidden;
      const now = new Date();

      setFocusState(prev => ({
        ...prev,
        isFocused,
        lastFocusChange: now,
      }));

      if (trackingStartTime) {
        if (isFocused) {
          // Tab became focused - start new interval
          setFocusIntervals(prev => [...prev, { start: now.getTime(), end: null }]);
        } else {
          // Tab lost focus - close current interval
          setFocusIntervals(prev => {
            const updated = [...prev];
            const lastInterval = updated[updated.length - 1];
            if (lastInterval && lastInterval.end === null) {
              lastInterval.end = now.getTime();
            }
            return updated;
          });
        }
      }
    };

    const handleFocus = () => {
      if (!document.hidden) return; // Already handled by visibility change
      handleVisibilityChange();
    };

    const handleBlur = () => {
      if (document.hidden) return; // Already handled by visibility change
      handleVisibilityChange();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [trackingStartTime]);

  // Get current focus stats
  const getFocusStats = useCallback(() => {
    if (!trackingStartTime) {
      return {
        isFocused: !document.hidden,
        focusedDuration: 0,
        totalDuration: 0,
        focusPercentage: 100,
        isTracking: false,
      };
    }

    const now = new Date();
    const totalDuration = (now.getTime() - trackingStartTime.getTime()) / 1000;
    
    let focusedMs = 0;
    focusIntervals.forEach(interval => {
      const end = interval.end || (document.hidden ? interval.start : now.getTime());
      focusedMs += end - interval.start;
    });

    const focusedDuration = focusedMs / 1000;
    const focusPercentage = totalDuration > 0 ? (focusedDuration / totalDuration) * 100 : 100;

    return {
      isFocused: !document.hidden,
      focusedDuration,
      totalDuration,
      focusPercentage,
      isTracking: true,
    };
  }, [trackingStartTime, focusIntervals]);

  return {
    ...focusState,
    isTracking: !!trackingStartTime,
    startTracking,
    stopTracking,
    resetTracking,
    getFocusStats,
  };
}
