import { useState, useEffect, useCallback } from 'react';
import { Search, TrendingUp, Play, Clock, Eye, Music2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useYouTubeSearch } from '@/hooks/useYouTubeSearch';
import { YouTubeVideo } from '@/hooks/useYouTubePlayer';
import { cn } from '@/lib/utils';

interface YouTubeBrowserProps {
  onVideoSelect: (video: YouTubeVideo) => void;
  currentVideoId?: string;
}

export function YouTubeBrowser({ onVideoSelect, currentVideoId }: YouTubeBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('trending');
  const { results, isLoading, error, search, getTrending, nextPageToken } = useYouTubeSearch();

  // Load trending on mount
  useEffect(() => {
    getTrending();
  }, [getTrending]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      search(searchQuery);
      setActiveTab('search');
    }
  }, [searchQuery, search]);

  const handleVideoClick = useCallback((video: YouTubeVideo) => {
    onVideoSelect(video);
  }, [onVideoSelect]);

  return (
    <div className="flex flex-col h-full bg-background/95 backdrop-blur-xl">
      {/* Search Header */}
      <div className="p-4 border-b border-border/50">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search YouTube music..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/50 border-border/50"
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
          </Button>
        </form>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2 w-fit">
          <TabsTrigger value="trending" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="search" className="gap-2" disabled={!searchQuery}>
            <Search className="h-4 w-4" />
            Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trending" className="flex-1 m-0 mt-2">
          <VideoGrid 
            videos={results} 
            isLoading={isLoading} 
            onVideoClick={handleVideoClick}
            currentVideoId={currentVideoId}
          />
        </TabsContent>

        <TabsContent value="search" className="flex-1 m-0 mt-2">
          <VideoGrid 
            videos={results} 
            isLoading={isLoading} 
            onVideoClick={handleVideoClick}
            currentVideoId={currentVideoId}
          />
        </TabsContent>
      </Tabs>

      {error && (
        <div className="p-4 text-center text-destructive text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

interface VideoGridProps {
  videos: YouTubeVideo[];
  isLoading: boolean;
  onVideoClick: (video: YouTubeVideo) => void;
  currentVideoId?: string;
}

function VideoGrid({ videos, isLoading, onVideoClick, currentVideoId }: VideoGridProps) {
  if (isLoading && videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <Music2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No videos found</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 h-[calc(100vh-200px)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            isPlaying={currentVideoId === video.id}
            onClick={() => onVideoClick(video)}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

interface VideoCardProps {
  video: YouTubeVideo;
  isPlaying: boolean;
  onClick: () => void;
}

function VideoCard({ video, isPlaying, onClick }: VideoCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300",
        "bg-card border border-border/50 hover:border-primary/50",
        "hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1",
        isPlaying && "ring-2 ring-primary border-primary"
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Duration badge */}
        {video.duration && (
          <Badge 
            variant="secondary" 
            className="absolute bottom-2 right-2 bg-black/80 text-white text-xs"
          >
            <Clock className="h-3 w-3 mr-1" />
            {video.duration}
          </Badge>
        )}

        {/* Play overlay */}
        <div className={cn(
          "absolute inset-0 flex items-center justify-center",
          "bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity",
          isPlaying && "opacity-100"
        )}>
          <div className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center",
            "bg-primary text-primary-foreground shadow-lg",
            isPlaying && "animate-pulse"
          )}>
            <Play className="h-6 w-6 ml-1" fill="currentColor" />
          </div>
        </div>

        {/* Now playing indicator */}
        {isPlaying && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-primary text-primary-foreground animate-pulse">
              Now Playing
            </Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium text-sm line-clamp-2 text-foreground group-hover:text-primary transition-colors">
          {video.title}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 truncate">
          {video.channel}
        </p>
        {video.viewCount && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {video.viewCount}
          </p>
        )}
      </div>
    </div>
  );
}
