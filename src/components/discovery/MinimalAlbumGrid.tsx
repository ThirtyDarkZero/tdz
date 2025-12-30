import { MinimalAlbumCard } from "./MinimalAlbumCard";

interface MinimalAlbumGridProps {
  albums: any[];
  title?: string;
}

export function MinimalAlbumGrid({ albums, title }: MinimalAlbumGridProps) {
  return (
    <div>
      {title && (
        <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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
