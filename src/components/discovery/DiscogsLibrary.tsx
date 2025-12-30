import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDiscogsLibrary, DISCOGS_GENRES, type DiscogsRelease } from "@/hooks/useDiscogsLibrary";
import { supabase } from "@/integrations/supabase/client";
import { Search, Disc, Users, Music, Play, Loader2, ExternalLink, ChevronLeft, ChevronRight, Library } from "lucide-react";
import { toast } from "sonner";

interface DiscogsLibraryProps {
  onPlayYouTube?: (videoId: string, title: string, artist: string, thumbnail: string) => void;
}

export function DiscogsLibrary({ onPlayYouTube }: DiscogsLibraryProps) {
  const { loading, error, search, browseReleases, browseMasters, getTrending, getRelease, mergeWithYouTube } = useDiscogsLibrary();
  
  const [activeTab, setActiveTab] = useState("browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("release");
  const [results, setResults] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRelease, setSelectedRelease] = useState<DiscogsRelease | null>(null);
  const [loadingRelease, setLoadingRelease] = useState(false);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);

  // Load trending on mount
  useEffect(() => {
    loadTrending();
  }, []);

  const loadTrending = async () => {
    const data = await getTrending({ per_page: 24 });
    if (data) {
      setResults(data.results || []);
      setPagination(data.pagination);
    }
  };

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    const data = await search(searchQuery, { 
      type: selectedType !== "all" ? selectedType : undefined,
      genre: selectedGenre || undefined,
      page: currentPage,
      per_page: 24,
    });
    
    if (data) {
      setResults(data.results || []);
      setPagination(data.pagination);
    }
  }, [searchQuery, selectedType, selectedGenre, currentPage, search]);

  const handleBrowseByGenre = async (genre: string) => {
    setSelectedGenre(genre);
    const data = await browseMasters({ genre, page: 1, per_page: 24 });
    if (data) {
      setResults(data.results || []);
      setPagination(data.pagination);
    }
  };

  const handlePageChange = async (newPage: number) => {
    setCurrentPage(newPage);
    
    if (searchQuery) {
      const data = await search(searchQuery, { 
        type: selectedType !== "all" ? selectedType : undefined,
        genre: selectedGenre || undefined,
        page: newPage,
        per_page: 24,
      });
      if (data) {
        setResults(data.results || []);
        setPagination(data.pagination);
      }
    } else if (selectedGenre) {
      const data = await browseMasters({ genre: selectedGenre, page: newPage, per_page: 24 });
      if (data) {
        setResults(data.results || []);
        setPagination(data.pagination);
      }
    } else {
      const data = await getTrending({ page: newPage, per_page: 24 });
      if (data) {
        setResults(data.results || []);
        setPagination(data.pagination);
      }
    }
  };

  const handleOpenRelease = async (releaseId: string, type: string) => {
    setLoadingRelease(true);
    try {
      const data = await getRelease(releaseId);
      if (data) {
        // Merge with YouTube for playback
        const merged = await mergeWithYouTube(data);
        setSelectedRelease(merged);
      }
    } catch (err) {
      toast.error("Failed to load release details");
    } finally {
      setLoadingRelease(false);
    }
  };

  const handlePlayTrack = async (track: any) => {
    if (track.youtube_id && onPlayYouTube) {
      onPlayYouTube(
        track.youtube_id,
        track.title,
        selectedRelease?.artist_name || "Unknown Artist",
        track.youtube_thumbnail || selectedRelease?.cover_art_url || ""
      );
      setPlayingTrack(track.title);
    } else {
      // Search YouTube for this track
      setPlayingTrack(track.title);
      try {
        const { data } = await supabase.functions.invoke("youtube-search", {
          body: { query: track.search_query, maxResults: 1 },
        });
        
        const video = data?.items?.[0];
        if (video && onPlayYouTube) {
          onPlayYouTube(
            video.id.videoId,
            track.title,
            selectedRelease?.artist_name || "Unknown Artist",
            video.snippet?.thumbnails?.high?.url || selectedRelease?.cover_art_url || ""
          );
        } else {
          toast.error("No playable version found on YouTube");
        }
      } catch (err) {
        toast.error("Failed to find track on YouTube");
      }
    }
  };

  const getReleaseTypeBadge = (item: any) => {
    const type = item.release_type || item.type;
    const colors: Record<string, string> = {
      album: "bg-purple-500/20 text-purple-300",
      single: "bg-blue-500/20 text-blue-300",
      ep: "bg-green-500/20 text-green-300",
      compilation: "bg-orange-500/20 text-orange-300",
      master: "bg-yellow-500/20 text-yellow-300",
      release: "bg-muted text-muted-foreground",
    };
    return colors[type] || colors.release;
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Library className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Global Music Library</CardTitle>
            <Badge variant="outline" className="text-xs">Powered by Discogs</Badge>
          </div>
          {selectedRelease && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedRelease(null)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to results
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!selectedRelease ? (
          <>
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search albums, artists, tracks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="release">Releases</SelectItem>
                  <SelectItem value="master">Masters</SelectItem>
                  <SelectItem value="artist">Artists</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
              </Button>
            </div>

            {/* Genre Pills */}
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2 pb-2">
                <Button
                  variant={!selectedGenre ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setSelectedGenre(""); loadTrending(); }}
                >
                  Trending
                </Button>
                {DISCOGS_GENRES.slice(0, 10).map((genre) => (
                  <Button
                    key={genre}
                    variant={selectedGenre === genre ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleBrowseByGenre(genre)}
                  >
                    {genre}
                  </Button>
                ))}
              </div>
            </ScrollArea>

            {/* Results Grid */}
            {error && (
              <div className="text-center py-8 text-destructive">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {results.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => item.type === "release" && handleOpenRelease(String(item.id), item.type)}
                  className="group text-left bg-card hover:bg-accent/50 rounded-lg p-2 transition-all duration-200 hover:scale-[1.02]"
                >
                  <div className="aspect-square rounded-md overflow-hidden mb-2 bg-muted relative">
                    {item.cover_art_url ? (
                      <img
                        src={item.cover_art_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Disc className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    {item.type === "release" && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="h-8 w-8 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">{item.title?.split(" - ")[1] || item.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.artist || item.title?.split(" - ")[0]}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Badge className={`text-[10px] px-1.5 py-0 ${getReleaseTypeBadge(item)}`}>
                      {item.release_type || item.type}
                    </Badge>
                    {item.year && (
                      <span className="text-[10px] text-muted-foreground">{item.year}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {results.length === 0 && !loading && (
              <div className="text-center py-12 text-muted-foreground">
                <Disc className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Search or browse to discover music</p>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {pagination.pages} ({pagination.items} results)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= pagination.pages || loading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          /* Release Detail View */
          <div className="space-y-4">
            {loadingRelease ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Release Header */}
                <div className="flex gap-4">
                  <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {selectedRelease.cover_art_url ? (
                      <img
                        src={selectedRelease.cover_art_url}
                        alt={selectedRelease.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Disc className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold truncate">{selectedRelease.title}</h3>
                    <p className="text-muted-foreground">{selectedRelease.artist_name}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedRelease.year && (
                        <Badge variant="outline">{selectedRelease.year}</Badge>
                      )}
                      <Badge className={getReleaseTypeBadge({ release_type: selectedRelease.release_type })}>
                        {selectedRelease.release_type}
                      </Badge>
                      {selectedRelease.genres?.slice(0, 2).map((g) => (
                        <Badge key={g} variant="secondary">{g}</Badge>
                      ))}
                    </div>
                    {selectedRelease.labels?.[0] && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Label: {selectedRelease.labels[0].name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Tracklist */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    Tracklist ({selectedRelease.tracklist?.length || 0} tracks)
                  </h4>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-1">
                      {selectedRelease.tracklist?.map((track, index) => (
                        <button
                          key={`${track.position}-${index}`}
                          onClick={() => handlePlayTrack(track)}
                          className={`w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors text-left ${
                            playingTrack === track.title ? "bg-primary/10" : ""
                          }`}
                        >
                          <span className="w-6 text-center text-xs text-muted-foreground">
                            {track.position || index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{track.title}</p>
                            {track.duration && (
                              <p className="text-xs text-muted-foreground">{track.duration}</p>
                            )}
                          </div>
                          <Play className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                          {track.youtube_id && (
                            <Badge variant="outline" className="text-[10px]">YouTube</Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Notes */}
                {selectedRelease.notes && (
                  <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg">
                    <p className="line-clamp-3">{selectedRelease.notes}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
