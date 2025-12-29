import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

type ContentType = 'albums' | 'tracks' | 'artists' | 'playlists';

interface FilterState {
  search: string;
  sortBy: string;
  genre: string[];
  type: string;
  priceRange: 'all' | 'free' | 'priced';
  artist: string;
}

interface BrowseFiltersProps {
  contentType: ContentType;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClose: () => void;
}

const ALBUM_TYPES = ['All', 'Studio', 'Compilation', 'Single', 'Mixtape', 'EP', 'Live'];
const GENRES = ['Hip Hop', 'R&B', 'Pop', 'Rock', 'Electronic', 'Jazz', 'Classical', 'Country', 'Reggae', 'Latin'];

const SORT_OPTIONS = {
  albums: [
    { value: 'newest', label: 'Newest' },
    { value: 'title', label: 'Title' },
    { value: 'plays', label: 'Most Played' },
  ],
  tracks: [
    { value: 'newest', label: 'Newest' },
    { value: 'title', label: 'Title' },
    { value: 'plays', label: 'Most Played' },
    { value: 'duration', label: 'Duration' },
  ],
  artists: [
    { value: 'newest', label: 'Newest' },
    { value: 'name', label: 'Name' },
    { value: 'listeners', label: 'Most Listeners' },
    { value: 'plays', label: 'Most Played' },
  ],
  playlists: [
    { value: 'newest', label: 'Newest' },
    { value: 'name', label: 'Name' },
    { value: 'plays', label: 'Most Played' },
  ],
};

export function BrowseFilters({ contentType, filters, onFiltersChange, onClose }: BrowseFiltersProps) {
  const handleSortChange = (value: string) => {
    onFiltersChange({ ...filters, sortBy: value });
  };

  const handleTypeChange = (type: string) => {
    onFiltersChange({ ...filters, type });
  };

  const handleGenreToggle = (genre: string) => {
    const newGenres = filters.genre.includes(genre)
      ? filters.genre.filter(g => g !== genre)
      : [...filters.genre, genre];
    onFiltersChange({ ...filters, genre: newGenres });
  };

  const handlePriceChange = (priceRange: 'all' | 'free' | 'priced') => {
    onFiltersChange({ ...filters, priceRange });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      search: filters.search,
      sortBy: 'newest',
      genre: [],
      type: 'all',
      priceRange: 'all',
      artist: '',
    });
  };

  const hasActiveFilters = 
    filters.genre.length > 0 || 
    filters.type !== 'all' || 
    filters.priceRange !== 'all' ||
    filters.sortBy !== 'newest';

  return (
    <div className="border-t border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Filters</h3>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                Clear all
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sort By */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Sort By
            </label>
            <Select value={filters.sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS[contentType].map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type (Albums only) */}
          {contentType === 'albums' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Type
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ALBUM_TYPES.map((type) => (
                  <Badge
                    key={type}
                    variant={filters.type.toLowerCase() === type.toLowerCase() ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => handleTypeChange(type.toLowerCase())}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Artist Search */}
          {(contentType === 'albums' || contentType === 'tracks') && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Artist
              </label>
              <Input
                placeholder="Search artist..."
                value={filters.artist}
                onChange={(e) => onFiltersChange({ ...filters, artist: e.target.value })}
                className="bg-muted/50"
              />
            </div>
          )}

          {/* Price Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Price
            </label>
            <div className="flex gap-1.5">
              {(['all', 'free', 'priced'] as const).map((price) => (
                <Badge
                  key={price}
                  variant={filters.priceRange === price ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/20 transition-colors capitalize"
                  onClick={() => handlePriceChange(price)}
                >
                  {price}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Genre Filter */}
        {(contentType === 'albums' || contentType === 'tracks') && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Genres
            </label>
            <div className="flex flex-wrap gap-1.5">
              {GENRES.map((genre) => (
                <Badge
                  key={genre}
                  variant={filters.genre.includes(genre) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/20 transition-colors"
                  onClick={() => handleGenreToggle(genre)}
                >
                  {genre}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
