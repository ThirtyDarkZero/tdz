import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Music } from "lucide-react";

interface MotionCoverProps {
  motionCoverPath?: string | null;
  motionCoverBucket?: string | null;
  staticCoverPath?: string | null;
  staticCoverBucket?: string | null;
  alt: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  fallbackSrc?: string;
}

export const MotionCover = ({
  motionCoverPath,
  motionCoverBucket = "motion-covers",
  staticCoverPath,
  staticCoverBucket = "album-covers",
  alt,
  className = "",
  autoPlay = true,
  loop = true,
  muted = true,
  controls = false,
  fallbackSrc = "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop"
}: MotionCoverProps) => {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [error, setError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let url: string | null = null;

    // Priority 1: Motion cover (video)
    if (motionCoverPath && motionCoverBucket) {
      const { data } = supabase.storage
        .from(motionCoverBucket)
        .getPublicUrl(motionCoverPath);
      
      if (data.publicUrl) {
        url = data.publicUrl;
        setIsVideo(true);
      }
    }
    
    // Priority 2: Static cover (image)
    if (!url && staticCoverPath && staticCoverBucket) {
      const { data } = supabase.storage
        .from(staticCoverBucket)
        .getPublicUrl(staticCoverPath);
      
      if (data.publicUrl) {
        url = data.publicUrl;
        setIsVideo(false);
      }
    }
    
    // Priority 3: Fallback image
    if (!url) {
      url = fallbackSrc;
      setIsVideo(false);
    }

    setMediaUrl(url);
    setError(false);
  }, [motionCoverPath, motionCoverBucket, staticCoverPath, staticCoverBucket, fallbackSrc]);

  // Handle video play on mount and intersection observer for performance
  useEffect(() => {
    if (!videoRef.current || !isVideo || !autoPlay) return;

    const video = videoRef.current;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {
              // Auto-play was prevented, that's okay
            });
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, [isVideo, autoPlay]);

  const handleError = () => {
    setError(true);
    if (isVideo && staticCoverPath && staticCoverBucket) {
      // Fallback to static image if video fails
      const { data } = supabase.storage
        .from(staticCoverBucket)
        .getPublicUrl(staticCoverPath);
      
      if (data.publicUrl) {
        setMediaUrl(data.publicUrl);
        setIsVideo(false);
      } else {
        setMediaUrl(fallbackSrc);
        setIsVideo(false);
      }
    } else {
      setMediaUrl(fallbackSrc);
      setIsVideo(false);
    }
  };

  if (!mediaUrl) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <Music className="w-12 h-12 text-muted-foreground/40" />
      </div>
    );
  }

  if (isVideo && !error) {
    return (
      <video
        ref={videoRef}
        src={mediaUrl}
        className={`object-cover ${className}`}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        controls={controls}
        playsInline
        onError={handleError}
        poster={staticCoverPath && staticCoverBucket ? 
          supabase.storage.from(staticCoverBucket).getPublicUrl(staticCoverPath).data.publicUrl : 
          undefined
        }
      />
    );
  }

  return (
    <img
      src={mediaUrl}
      alt={alt}
      className={`object-cover ${className}`}
      onError={handleError}
    />
  );
};
