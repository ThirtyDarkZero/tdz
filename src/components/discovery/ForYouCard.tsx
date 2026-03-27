import { useState } from "react";
import { Heart, Play } from "lucide-react";

interface ForYouCardProps {
  title: string;
  artist: string;
  image: string;
  colorTint?: string;
  isLiked?: boolean;
  isPlaying?: boolean;
  onPlay: () => void;
  onLike?: () => void;
  onClick: () => void;
}

// Simulated waveform bars
function WaveformVisualizer({ isPlaying, color = "rgba(255,255,255,0.5)" }: { isPlaying?: boolean; color?: string }) {
  const bars = [0.4, 0.7, 1, 0.6, 0.8, 0.5, 0.9, 0.3, 0.7, 0.5, 0.8, 0.6, 1, 0.4, 0.7, 0.9, 0.5, 0.8, 0.6, 0.4];
  return (
    <div className="flex items-end gap-[2px] h-8">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-[2.5px] rounded-full transition-all"
          style={{
            height: `${h * 100}%`,
            background: color,
            opacity: isPlaying ? 1 : 0.4,
            animation: isPlaying ? `waveBar 0.8s ease-in-out ${i * 0.04}s infinite alternate` : undefined,
          }}
        />
      ))}
    </div>
  );
}

export function ForYouCard({ title, artist, image, colorTint = "rgba(0,207,255,0.15)", isLiked, isPlaying, onPlay, onLike, onClick }: ForYouCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="relative rounded-3xl overflow-hidden cursor-pointer group transition-all duration-500 hover:scale-[1.02]"
      style={{
        width: "100%",
        aspectRatio: "3/4",
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 60px " + colorTint.replace("0.15", "0.08"),
      }}
      onClick={onClick}
    >
      {/* Background image */}
      {!imgError && image ? (
        <img
          src={image}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${colorTint}, rgba(139,92,246,0.2))` }} />
      )}

      {/* Color tint overlay */}
      <div className="absolute inset-0" style={{ background: colorTint, mixBlendMode: "multiply" }} />

      {/* Bottom gradient */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 40%, transparent 70%)" }} />

      {/* Waveform visualizer overlay */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-60">
        <WaveformVisualizer isPlaying={isPlaying} color="rgba(255,255,255,0.6)" />
      </div>

      {/* Heart button */}
      <button
        className="absolute bottom-4 right-4 p-2 rounded-full transition-all hover:scale-110 z-10"
        style={{
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(8px)",
        }}
        onClick={(e) => { e.stopPropagation(); onLike?.(); }}
      >
        <Heart
          className="w-4 h-4"
          style={{ color: isLiked ? "#FF6B8A" : "rgba(255,255,255,0.7)" }}
          fill={isLiked ? "#FF6B8A" : "none"}
        />
      </button>

      {/* Track info */}
      <div className="absolute bottom-4 left-4 right-12 z-10">
        <h3
          className="font-bold text-white truncate"
          style={{ fontFamily: "'Raleway', sans-serif", fontSize: 16, fontWeight: 700 }}
        >
          {title}
        </h3>
        <p
          className="truncate mt-0.5"
          style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.6)" }}
        >
          {artist}
        </p>
      </div>

      <style>{`
        @keyframes waveBar {
          0% { transform: scaleY(0.4); }
          100% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}
