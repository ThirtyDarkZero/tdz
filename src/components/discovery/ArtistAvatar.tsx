import { useEffect, useState } from "react";

interface ArtistAvatarProps {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}

export function ArtistAvatar({ src, name, size = 48, className = "" }: ArtistAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const fallbackLetter = (name || "?").trim().charAt(0).toUpperCase() || "?";

  useEffect(() => {
    setImgError(false);
  }, [src]);

  if (!src || imgError) {
    return (
      <div
        className={`flex items-center justify-center rounded-full flex-shrink-0 ${className}`}
        style={{
          width: size,
          height: size,
          background: "linear-gradient(135deg, rgba(0,207,255,0.4), rgba(139,92,246,0.4))",
        }}
      >
        <span
          style={{
            fontFamily: "'Raleway', sans-serif",
            fontWeight: 700,
            fontSize: size * 0.35,
            color: "rgba(255,255,255,0.8)",
          }}
        >
          {initials}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className={`rounded-full object-cover flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
      onError={() => setImgError(true)}
      loading="lazy"
    />
  );
}
