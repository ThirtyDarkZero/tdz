import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Search, Play, Loader2, Music2, User, Disc3, 
  Calendar, MapPin, Tag, ExternalLink, ChevronLeft
} from "lucide-react";
import { useMusicBrainz, MBReleaseGroup, MBRelease, MBArtist } from "@/hooks/useMusicBrainz";

interface MusicBrainzLibraryProps {
  onPlayYouTube: (videoId: string, title: string, artist: string, thumbnail: string) => void;
}

export function MusicBrainzLibrary({ onPlayYouTube }: MusicBrainzLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"release-group" | "artist" | "recording">("release-group");
  const [results, setResults] = useState<any>(null);
  const [selectedRelease, setSelectedRelease] = useState<MBRelease | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<MBArtist | null>(null);
  const [loadingTrack, setLoadingTrack] = useState<string | null>(null);

  const {
    loading,
    error,
    search,
    getRelease,
    getArtist,
    getReleaseGroup,
    findYouTubeMatch,
  } = useMusicBrainz();

  // Handle search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    const data = await search(searchQuery, searchType);
    setResults(data);
    setSelectedRelease(null);
    setSelectedArtist(null);
  }, [searchQuery, searchType, search]);

  // Handle release group click - get first release with tracks
  const handleReleaseGroupClick = async (releaseGroup: MBReleaseGroup) => {
    // First get the release group to find releases
    const rgData = await getReleaseGroup(releaseGroup.id);
    if (rgData?.releases?.length) {
      // Get the first release with full track data
      const releaseData = await getRelease(rgData.releases[0].id);
      if (releaseData) {
        setSelectedRelease(releaseData);
        setSelectedArtist(null);
      }
    }
  };

  // Handle artist click
  const handleArtistClick = async (artist: MBArtist) => {
    const artistData = await getArtist(artist.id);
    if (artistData) {
      setSelectedArtist(artistData);
      setSelectedRelease(null);
    }
  };

  // Play track via YouTube
  const handlePlayTrack = async (trackTitle: string, artistName: string, coverArt: string) => {
    setLoadingTrack(trackTitle);
    
    try {
      const videoId = await findYouTubeMatch({ title: trackTitle } as any, artistName);
      if (videoId) {
        onPlayYouTube(videoId, trackTitle, artistName, coverArt);
      }
    } finally {
      setLoadingTrack(null);
    }
  };

  // Reset to results view
  const handleBack = () => {
    setSelectedRelease(null);
    setSelectedArtist(null);
  };

  // Render release detail view
  const renderReleaseDetail = () => {
    if (!selectedRelease) return null;

    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Results
        </Button>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Cover art */}
          <div className="flex-shrink-0">
            <img
              src={selectedRelease.coverArt}
              alt={selectedRelease.title}
              className="w-48 h-48 md:w-64 md:h-64 rounded-lg object-cover shadow-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          </div>

          {/* Release info */}
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">{selectedRelease.title}</h2>
              <p className="text-lg text-muted-foreground">{selectedRelease.artistName}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedRelease.releaseGroupType && (
                <Badge variant="secondary">
                  <Disc3 className="w-3 h-3 mr-1" />
                  {selectedRelease.releaseGroupType}
                </Badge>
              )}
              {selectedRelease.date && (
                <Badge variant="outline">
                  <Calendar className="w-3 h-3 mr-1" />
                  {selectedRelease.date}
                </Badge>
              )}
              {selectedRelease.country && (
                <Badge variant="outline">
                  <MapPin className="w-3 h-3 mr-1" />
                  {selectedRelease.country}
                </Badge>
              )}
              {selectedRelease.label && (
                <Badge variant="outline">{selectedRelease.label}</Badge>
              )}
            </div>

            {selectedRelease.tags && selectedRelease.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedRelease.tags.slice(0, 6).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Track list */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Tracks ({selectedRelease.tracks?.length || 0})</h3>
          <ScrollArea className="h-[400px]">
            <div className="space-y-1">
              {selectedRelease.tracks?.map((track) => (
                <div
                  key={`${track.disc}-${track.position}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <span className="text-sm text-muted-foreground w-8 text-center">
                    {track.position}
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{track.title}</p>
                    {track.lengthFormatted && (
                      <p className="text-sm text-muted-foreground">{track.lengthFormatted}</p>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={loadingTrack === track.title}
                    onClick={() => handlePlayTrack(track.title, selectedRelease.artistName, selectedRelease.coverArt)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {loadingTrack === track.title ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  };

  // Render artist detail view
  const renderArtistDetail = () => {
    if (!selectedArtist) return null;

    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Results
        </Button>

        <div className="space-y-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">{selectedArtist.name}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedArtist.type && (
                <Badge variant="secondary">{selectedArtist.type}</Badge>
              )}
              {selectedArtist.country && (
                <Badge variant="outline">
                  <MapPin className="w-3 h-3 mr-1" />
                  {selectedArtist.country}
                </Badge>
              )}
              {selectedArtist.beginDate && (
                <Badge variant="outline">
                  <Calendar className="w-3 h-3 mr-1" />
                  {selectedArtist.beginDate}
                </Badge>
              )}
            </div>
          </div>

          {/* Genres */}
          {selectedArtist.genres && selectedArtist.genres.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedArtist.genres.slice(0, 10).map((genre) => (
                <Badge key={genre.name} className="bg-primary/20 text-primary">
                  {genre.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Discography */}
          {selectedArtist.releaseGroups && selectedArtist.releaseGroups.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Discography</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {selectedArtist.releaseGroups.map((rg) => (
                  <Card
                    key={rg.id}
                    onClick={() => handleReleaseGroupClick(rg as MBReleaseGroup)}
                    className="cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
                  >
                    <img
                      src={rg.coverArt}
                      alt={rg.title}
                      className="w-full aspect-square object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                    <div className="p-3">
                      <p className="font-medium truncate text-sm">{rg.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {rg.primaryType && (
                          <Badge variant="secondary" className="text-xs">{rg.primaryType}</Badge>
                        )}
                        {rg.firstReleaseDate && (
                          <span className="text-xs text-muted-foreground">
                            {rg.firstReleaseDate.split('-')[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render search results
  const renderResults = () => {
    if (!results) {
      return (
        <div className="text-center py-16 text-muted-foreground">
          <Music2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Search the MusicBrainz database</p>
          <p className="text-sm">Over 30 million recordings indexed</p>
        </div>
      );
    }

    if (searchType === 'release-group' && results.releaseGroups) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {results.releaseGroups.map((rg: MBReleaseGroup) => (
            <Card
              key={rg.id}
              onClick={() => handleReleaseGroupClick(rg)}
              className="cursor-pointer hover:border-primary/50 transition-all hover:scale-[1.02] overflow-hidden group"
            >
              <div className="relative">
                <img
                  src={rg.coverArt}
                  alt={rg.title}
                  className="w-full aspect-square object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="w-12 h-12 text-white" />
                </div>
              </div>
              <div className="p-3">
                <p className="font-medium truncate">{rg.title}</p>
                <p className="text-sm text-muted-foreground truncate">{rg.artistName}</p>
                <div className="flex items-center gap-2 mt-2">
                  {rg.primaryType && (
                    <Badge variant="secondary" className="text-xs">{rg.primaryType}</Badge>
                  )}
                  {rg.firstReleaseDate && (
                    <span className="text-xs text-muted-foreground">
                      {rg.firstReleaseDate.split('-')[0]}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      );
    }

    if (searchType === 'artist' && results.artists) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {results.artists.map((artist: MBArtist) => (
            <Card
              key={artist.id}
              onClick={() => handleArtistClick(artist)}
              className="cursor-pointer hover:border-primary/50 transition-all p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{artist.name}</p>
                  <p className="text-sm text-muted-foreground">{artist.type || 'Artist'}</p>
                </div>
              </div>
              {artist.tags && artist.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {artist.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      );
    }

    if (searchType === 'recording' && results.recordings) {
      return (
        <div className="space-y-2">
          {results.recordings.map((rec: any) => (
            <div
              key={rec.id}
              className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center">
                <Music2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{rec.title}</p>
                <p className="text-sm text-muted-foreground truncate">{rec.artistName}</p>
              </div>
              {rec.lengthFormatted && (
                <span className="text-sm text-muted-foreground">{rec.lengthFormatted}</span>
              )}
              <Button
                size="sm"
                variant="ghost"
                disabled={loadingTrack === rec.title}
                onClick={() => handlePlayTrack(rec.title, rec.artistName, '/placeholder.svg')}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {loadingTrack === rec.title ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="text-center py-8 text-muted-foreground">
        No results found
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Disc3 className="w-6 h-6 text-primary" />
            MusicBrainz
          </h2>
          <p className="text-sm text-muted-foreground">Open music encyclopedia</p>
        </div>
        <a
          href="https://musicbrainz.org"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
        >
          <ExternalLink className="w-4 h-4" />
          musicbrainz.org
        </a>
      </div>

      {/* Search bar */}
      {!selectedRelease && !selectedArtist && (
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search artists, albums, songs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Tabs value={searchType} onValueChange={(v) => setSearchType(v as typeof searchType)}>
            <TabsList>
              <TabsTrigger value="release-group">Albums</TabsTrigger>
              <TabsTrigger value="artist">Artists</TabsTrigger>
              <TabsTrigger value="recording">Songs</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={handleSearch} disabled={loading || !searchQuery.trim()}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </Button>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      )}

      {/* Content */}
      {loading && !selectedRelease && !selectedArtist ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : selectedRelease ? (
        renderReleaseDetail()
      ) : selectedArtist ? (
        renderArtistDetail()
      ) : (
        renderResults()
      )}
    </div>
  );
}
