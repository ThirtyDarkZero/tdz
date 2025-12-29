import { Play, MoreHorizontal, Heart, Clock, Users, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MotionCover } from '@/components/MotionCover';
import { cn } from '@/lib/utils';

type ContentType = 'albums' | 'tracks' | 'artists' | 'playlists';

interface BrowseGridProps {
  items: any[];
  contentType: ContentType;
  viewMode: 'grid' | 'list';
  loading: boolean;
  onItemClick: (item: any) => void;
}

export function BrowseGrid({ items, contentType, viewMode, loading, onItemClick }: BrowseGridProps) {
  if (loading) {
    return (
      <div className={cn(
        "p-4",
        viewMode === 'grid' 
          ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          : "space-y-2"
      )}>
        {Array.from({ length: 24 }).map((_, i) => (
          viewMode === 'grid' ? (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ) : (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          )
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Music className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-xl font-semibold mb-2">No {contentType} found</h3>
        <p className="text-muted-foreground">Try adjusting your filters or search</p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="divide-y divide-border/30">
        {items.map((item, index) => (
          <ListItem
            key={item.id}
            item={item}
            contentType={contentType}
            index={index}
            onClick={() => onItemClick(item)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
      {items.map((item) => (
        <GridItem
          key={item.id}
          item={item}
          contentType={contentType}
          onClick={() => onItemClick(item)}
        />
      ))}
    </div>
  );
}

interface GridItemProps {
  item: any;
  contentType: ContentType;
  onClick: () => void;
}

function GridItem({ item, contentType, onClick }: GridItemProps) {
  const getImage = () => {
    if (contentType === 'albums') return item.cover_art_path;
    if (contentType === 'tracks') return item.album_cover_path;
    if (contentType === 'artists') return item.profile_image_path;
    if (contentType === 'playlists') return item.cover_image_path;
    return null;
  };

  const getTitle = () => {
    if (contentType === 'artists') return item.artist_name;
    if (contentType === 'playlists') return item.name;
    return item.title;
  };

  const getSubtitle = () => {
    if (contentType === 'albums' || contentType === 'tracks') return item.artist_name;
    if (contentType === 'artists') {
      const listeners = item.monthly_listeners || 0;
      return listeners > 0 ? `${formatNumber(listeners)} listeners` : 'Artist';
    }
    if (contentType === 'playlists') return `${item.track_count || 0} tracks`;
    return '';
  };

  const isArtist = contentType === 'artists';

  return (
    <div
      onClick={onClick}
      className={cn(
        "group cursor-pointer",
        "transition-all duration-300 hover:-translate-y-1"
      )}
    >
      {/* Cover */}
      <div className={cn(
        "relative overflow-hidden mb-3",
        isArtist ? "aspect-square rounded-full" : "aspect-square rounded-lg"
      )}>
        {contentType === 'tracks' ? (
          <MotionCover
            motionCoverPath={item.motion_cover_path}
            motionCoverBucket={item.motion_cover_bucket}
            staticCoverPath={item.album_cover_path}
            staticCoverBucket={item.album_cover_bucket || 'album-covers'}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted">
            {getImage() ? (
              <img
                src={getImage()}
                alt={getTitle()}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                {contentType === 'artists' ? (
                  <Users className="h-12 w-12 text-muted-foreground" />
                ) : (
                  <Music className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
            )}
          </div>
        )}

        {/* Play overlay */}
        <div className={cn(
          "absolute inset-0 flex items-center justify-center",
          "bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity",
          isArtist && "rounded-full"
        )}>
          <Button
            size="icon"
            className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg"
          >
            <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className={cn(isArtist && "text-center")}>
        <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
          {getTitle()}
        </h3>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {getSubtitle()}
        </p>
      </div>
    </div>
  );
}

interface ListItemProps {
  item: any;
  contentType: ContentType;
  index: number;
  onClick: () => void;
}

function ListItem({ item, contentType, index, onClick }: ListItemProps) {
  const getImage = () => {
    if (contentType === 'albums') return item.cover_art_path;
    if (contentType === 'tracks') return item.album_cover_path;
    if (contentType === 'artists') return item.profile_image_path;
    if (contentType === 'playlists') return item.cover_image_path;
    return null;
  };

  const getTitle = () => {
    if (contentType === 'artists') return item.artist_name;
    if (contentType === 'playlists') return item.name;
    return item.title;
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors group"
    >
      {/* Index */}
      <div className="w-8 text-center text-sm text-muted-foreground font-mono">
        {index + 1}
      </div>

      {/* Image */}
      <div className="relative w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
        {getImage() ? (
          <img src={getImage()} alt={getTitle()} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
            <Music className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="h-4 w-4 text-white" fill="currentColor" />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{getTitle()}</p>
        <p className="text-sm text-muted-foreground truncate">
          {item.artist_name || item.description || ''}
        </p>
      </div>

      {/* Duration (tracks only) */}
      {contentType === 'tracks' && (
        <div className="text-sm text-muted-foreground font-mono">
          {formatDuration(item.duration)}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Heart className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}
