import { MinimalAlbumCard } from "./MinimalAlbumCard";

interface MinimalAlbumGridProps {
  albums: any[];
  title?: string;
}

export function MinimalAlbumGrid({ albums, title }: MinimalAlbumGridProps) {
  return (
    <div>
      {title && (
        <div className="mb-6">
          <h2 style={{ 
            fontFamily: "'Six Caps', sans-serif", 
            fontSize: 36, 
            letterSpacing: "0.04em", 
            color: "#fff",
            textShadow: "0 0 20px rgba(139,92,246,0.3)"
          }}>{title.toUpperCase()}</h2>
          <p className="text-xs mt-1" style={{ color: "#888", fontFamily: "'Raleway', sans-serif" }}>
            Your Cosmic Collection • {albums.length} albums
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {albums.map((album, index) => (
          <MinimalAlbumCard
            key={album.id}
            album={album}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
