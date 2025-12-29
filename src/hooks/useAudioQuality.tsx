import { useState, useEffect, useCallback } from 'react';

export type AudioQuality = 'auto' | 'low' | 'standard' | 'high' | 'lossless';

interface AudioQualityInfo {
  bitrate: number;
  sampleRate: number;
  channels: number;
  format: string;
  quality: AudioQuality;
}

interface AudioQualityPreferences {
  preferredQuality: AudioQuality;
  downloadQuality: AudioQuality;
  streamingDataSaver: boolean;
  normalizeVolume: boolean;
}

const QUALITY_STORAGE_KEY = 'tdz_audio_quality_prefs';

const DEFAULT_PREFERENCES: AudioQualityPreferences = {
  preferredQuality: 'auto',
  downloadQuality: 'high',
  streamingDataSaver: false,
  normalizeVolume: true,
};

// Bitrate thresholds for quality detection (in kbps)
const QUALITY_THRESHOLDS = {
  low: 96,
  standard: 160,
  high: 320,
  lossless: 1411,
};

/**
 * Hook for audio quality detection and user preferences
 * Based on PHP platform's audio quality handling patterns
 */
export function useAudioQuality() {
  const [preferences, setPreferences] = useState<AudioQualityPreferences>(DEFAULT_PREFERENCES);
  const [detectedQuality, setDetectedQuality] = useState<AudioQualityInfo | null>(null);
  const [networkQuality, setNetworkQuality] = useState<'slow' | 'medium' | 'fast'>('medium');

  // Load preferences from storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(QUALITY_STORAGE_KEY);
      if (stored) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(stored) });
      }
    } catch (err) {
      console.warn('Failed to load audio quality preferences:', err);
    }
  }, []);

  // Detect network quality
  useEffect(() => {
    const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection;

    if (connection) {
      const updateNetworkQuality = () => {
        const effectiveType = connection.effectiveType;
        if (effectiveType === '4g') {
          setNetworkQuality('fast');
        } else if (effectiveType === '3g') {
          setNetworkQuality('medium');
        } else {
          setNetworkQuality('slow');
        }
      };

      updateNetworkQuality();
      connection.addEventListener('change', updateNetworkQuality);
      return () => connection.removeEventListener('change', updateNetworkQuality);
    }
  }, []);

  // Save preferences
  const savePreferences = useCallback((newPrefs: Partial<AudioQualityPreferences>) => {
    setPreferences(prev => {
      const updated = { ...prev, ...newPrefs };
      try {
        localStorage.setItem(QUALITY_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save audio quality preferences:', err);
      }
      return updated;
    });
  }, []);

  // Detect quality from audio element or file metadata
  const detectQuality = useCallback((audioElement: HTMLAudioElement | null): AudioQualityInfo | null => {
    if (!audioElement) return null;

    // Try to get from audio context
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaElementSource(audioElement);
      
      const sampleRate = audioContext.sampleRate;
      const channels = source.channelCount || 2;
      
      // Estimate bitrate based on sample rate and channels
      // This is approximate - real bitrate requires file metadata
      const estimatedBitrate = (sampleRate * channels * 16) / 1000;
      
      let quality: AudioQuality = 'standard';
      if (estimatedBitrate >= QUALITY_THRESHOLDS.lossless) {
        quality = 'lossless';
      } else if (estimatedBitrate >= QUALITY_THRESHOLDS.high) {
        quality = 'high';
      } else if (estimatedBitrate >= QUALITY_THRESHOLDS.standard) {
        quality = 'standard';
      } else {
        quality = 'low';
      }

      const info: AudioQualityInfo = {
        bitrate: estimatedBitrate,
        sampleRate,
        channels,
        format: 'audio/mpeg', // Default, could be detected from Content-Type
        quality,
      };

      setDetectedQuality(info);
      audioContext.close();
      return info;
    } catch (err) {
      // AudioContext not available or already connected
      console.log('Audio quality detection not available');
      return null;
    }
  }, []);

  // Get recommended quality based on network and preferences
  const getRecommendedQuality = useCallback((): AudioQuality => {
    if (preferences.preferredQuality !== 'auto') {
      return preferences.preferredQuality;
    }

    if (preferences.streamingDataSaver) {
      return 'low';
    }

    switch (networkQuality) {
      case 'slow':
        return 'low';
      case 'medium':
        return 'standard';
      case 'fast':
        return 'high';
      default:
        return 'standard';
    }
  }, [preferences, networkQuality]);

  // Quality labels for UI
  const qualityLabels: Record<AudioQuality, string> = {
    auto: 'Auto',
    low: 'Low (96 kbps)',
    standard: 'Standard (160 kbps)',
    high: 'High (320 kbps)',
    lossless: 'Lossless (FLAC)',
  };

  // Get bitrate for quality level
  const getBitrateForQuality = useCallback((quality: AudioQuality): number => {
    switch (quality) {
      case 'low': return 96;
      case 'standard': return 160;
      case 'high': return 320;
      case 'lossless': return 1411;
      case 'auto': return QUALITY_THRESHOLDS[getRecommendedQuality() as keyof typeof QUALITY_THRESHOLDS] || 160;
      default: return 160;
    }
  }, [getRecommendedQuality]);

  return {
    preferences,
    savePreferences,
    detectedQuality,
    detectQuality,
    networkQuality,
    getRecommendedQuality,
    qualityLabels,
    getBitrateForQuality,
  };
}
