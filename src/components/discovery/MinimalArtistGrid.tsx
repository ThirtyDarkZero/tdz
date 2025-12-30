import { MinimalArtistCard } from "./MinimalArtistCard";

interface MinimalArtistGridProps {
  artists: any[];
  followedArtists: Set<string>;
  onToggleFollow: (artistId: string) => void;
  title?: string;
}

export function MinimalArtistGrid({
  artists,
  followedArtists,
  onToggleFollow,
  title
}: MinimalArtistGridProps) {
  return (
    <div>
      {title && (
        <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {artists.map((artist, index) => (
          <MinimalArtistCard
            key={artist.user_id}
            artist={artist}
            isFollowing={followedArtists.has(artist.user_id)}
            onToggleFollow={() => onToggleFollow(artist.user_id)}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
