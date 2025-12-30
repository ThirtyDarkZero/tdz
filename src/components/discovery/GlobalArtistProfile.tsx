import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Play, Bell, MoreHorizontal, ChevronLeft, ChevronRight, 
  Disc, Clock, ListPlus, Youtube, Loader2
} from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import { useMusicBrainz } from "@/hooks/useMusicBrainz";
import { useDiscogsLibrary } from "@/hooks/useDiscogsLibrary";
import { GlobalAlbumDetail } from "./GlobalAlbumDetail";

interface GlobalArtistProfileProps {
  artistName: string;
  artistId?: string;
  source: 'discogs' | 'musicbrainz';
  onClose: () => void;
  onAddToPlaylist?: (track: any) => void;
}

interface GlobalTrack {
  id: string;
  title: string;
  album: string;
  duration?: string;
  position?: string;
  youtubeId?: string;
  thumbnail?: string;
}

interface GlobalAlbum {
  id: string;
  title: string;
  year?: string;
  coverArt?: string;
  type?: string;
  genres?: string[];
}

export function GlobalArtistProfile({ 
  artistName, 
  artistId, 
  source, 
  onClose,
  onAddToPlaylist 
}: GlobalArtistProfileProps) {
  const { playTrack } = usePlayer();
  const { getArtist: getMBArtist, search: searchMB, findYouTubeMatch } = useMusicBrainz();
  const { getArtist: getDiscogsArtist, getArtistReleases } = useDiscogsLibrary();
  
  const [artist, setArtist] = useState<any>(null);
  const [tracks, setTracks] = useState<GlobalTrack[]>([]);
  const [albums, setAlbums] = useState<GlobalAlbum[]>([]);
  const [relatedArtists, setRelatedArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTrack, setLoadingTrack] = useState<string | null>(null);
  const [albumScrollPosition, setAlbumScrollPosition] = useState(0);
  const [featuredScrollPosition, setFeaturedScrollPosition] = useState(0);
  const [relatedScrollPosition, setRelatedScrollPosition] = useState(0);
  const [selectedAlbum, setSelectedAlbum] = useState<GlobalAlbum | null>(null);
  const [artistImage, setArtistImage] = useState<string | null>(null);

  useEffect(() => {
    loadArtistData();
  }, [artistName, artistId, source]);

  const loadArtistData = async () => {
    setLoading(true);
    
    try {
      // First, try to get artist image from YouTube/Google
      const { data: artistImageData } = await supabase.functions.invoke('youtube-search', {
        body: { query: `${artistName} artist`, maxResults: 1 }
      });
      if (artistImageData?.results?.[0]?.thumbnail) {
        setArtistImage(artistImageData.results[0].thumbnail);
      }

      if (source === 'musicbrainz' && artistId) {
        const data = await getMBArtist(artistId);
        if (data) {
          setArtist({
            name: data.name,
            image: null, // Will use artistImage from YouTube
            genres: data.genres?.map((g: any) => g.name) || [],
            type: data.type,
            country: data.country,
            beginDate: data.beginDate,
          });
          
          // Get release groups as albums
          if (data.releaseGroups) {
            setAlbums(data.releaseGroups.map((rg: any) => ({
              id: rg.id,
              title: rg.title,
              year: rg.firstReleaseDate?.split('-')[0],
              coverArt: rg.coverArt,
              type: rg.primaryType,
              genres: data.genres?.map((g: any) => g.name) || [],
            })));
          }
        }
      } else if (source === 'discogs' && artistId) {
        const data = await getDiscogsArtist(artistId);
        if (data) {
          setArtist({
            name: data.name,
            image: data.cover_art_url,
            profile: data.profile,
            genres: [],
          });
          // Use Discogs image if available
          if (data.cover_art_url) {
            setArtistImage(data.cover_art_url);
          }
        }
        
        // Get releases
        const releases = await getArtistReleases(artistId);
        if (releases?.releases) {
          setAlbums(releases.releases.slice(0, 20).map((r: any) => ({
            id: r.id,
            title: r.title,
            year: r.year,
            coverArt: r.cover_art_url,
            type: r.type,
            genres: r.genres || [],
          })));
        }
      } else {
        // Search by name
        const mbResults = await searchMB(artistName, 'artist');
        if (mbResults?.artists?.[0]) {
          const firstArtist = mbResults.artists[0];
          setArtist({
            name: firstArtist.name,
            genres: firstArtist.tags || [],
            type: firstArtist.type,
            country: firstArtist.country,
          });
        }
      }

      // Get popular tracks via YouTube search
      const { data: ytData } = await supabase.functions.invoke('youtube-search', {
        body: { query: `${artistName} official audio`, maxResults: 10 }
      });

      if (ytData?.results) {
        setTracks(ytData.results.map((video: any, idx: number) => ({
          id: `yt-${video.id}`,
          title: video.title.replace(artistName, '').replace(/[-|]/g, '').trim(),
          album: 'YouTube',
          duration: video.duration,
          position: String(idx + 1),
          youtubeId: video.id,
          thumbnail: video.thumbnail,
        })));
      }

      // Get related artists
      const { data: relatedData } = await supabase.functions.invoke('youtube-search', {
        body: { query: `${artistName} similar artists hip hop rap`, maxResults: 8 }
      });

      if (relatedData?.results) {
        const uniqueArtists = new Map();
        relatedData.results.forEach((video: any) => {
          if (!uniqueArtists.has(video.channel) && video.channel !== artistName) {
            uniqueArtists.set(video.channel, {
              name: video.channel,
              thumbnail: video.thumbnail,
            });
          }
        });
        setRelatedArtists(Array.from(uniqueArtists.values()).slice(0, 6));
      }

    } catch (error) {
      console.error('Error loading artist:', error);
      toast.error('Failed to load artist data');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayTrack = async (track: GlobalTrack) => {
    if (track.youtubeId) {
      const youtubeTrack = {
        id: track.id,
        title: track.title,
        artist_name: artist?.name || artistName,
        duration: 0,
        file_path: '',
        play_count: 0,
        source: 'youtube' as const,
        youtubeId: track.youtubeId,
        thumbnail: track.thumbnail,
      };
      playTrack(youtubeTrack);
      toast.success(`Now playing: ${track.title}`);
    } else {
      // Find YouTube match
      setLoadingTrack(track.id);
      try {
        const videoId = await findYouTubeMatch({ title: track.title } as any, artist?.name || artistName);
        if (videoId) {
          const youtubeTrack = {
            id: track.id,
            title: track.title,
            artist_name: artist?.name || artistName,
            duration: 0,
            file_path: '',
            play_count: 0,
            source: 'youtube' as const,
            youtubeId: videoId,
            thumbnail: track.thumbnail,
          };
          playTrack(youtubeTrack);
          toast.success(`Now playing: ${track.title}`);
        }
      } finally {
        setLoadingTrack(null);
      }
    }
  };

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      handlePlayTrack(tracks[0]);
    }
  };

  const handleAddToPlaylist = (track: GlobalTrack) => {
    if (onAddToPlaylist) {
      onAddToPlaylist({
        id: track.id,
        title: track.title,
        artist_name: artist?.name || artistName,
        youtubeId: track.youtubeId,
        thumbnail: track.thumbnail,
      });
    } else {
      toast.info('Add to playlist coming soon');
    }
  };

  // Handle album click - open album detail
  const handleAlbumClick = (album: GlobalAlbum) => {
    setSelectedAlbum(album);
  };

  // If showing album detail
  if (selectedAlbum) {
    return (
      <GlobalAlbumDetail
        album={{
          id: selectedAlbum.id,
          title: selectedAlbum.title,
          artist: artist?.name || artistName,
          year: selectedAlbum.year,
          coverArt: selectedAlbum.coverArt,
          type: selectedAlbum.type,
          genres: selectedAlbum.genres || artist?.genres,
          source: source,
        }}
        onClose={() => setSelectedAlbum(null)}
        onAddToPlaylist={onAddToPlaylist}
        onOpenArtist={() => setSelectedAlbum(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
          <p className="text-white/60">Loading {artistName}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-4 px-4 md:px-6 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full bg-white/5 hover:bg-white/10"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-cyan-500/20 text-cyan-400"
          >
            <Play className="w-5 h-5" fill="currentColor" />
          </Button>
          
          <h1 className="text-xl font-bold text-white">{artist?.name || artistName}</h1>
        </div>
      </div>

      {/* Hero Section - RKHM Style */}
      <div className="relative px-4 md:px-8 pt-8 pb-6">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10">
          {/* Circular Artist Image */}
          <div className="relative flex-shrink-0">
            <div className="w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl bg-gradient-to-br from-white/10 to-white/5">
              {(artistImage || artist?.image) ? (
                <img
                  src={artistImage || artist?.image}
                  alt={artist?.name || artistName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-600/30 to-purple-600/30">
                  <span className="text-5xl font-black text-white/40">
                    {(artist?.name || artistName).charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Artist Info */}
          <div className="flex-1 text-center md:text-left space-y-4">
            {/* Type + Genres */}
            <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
              <span className="text-white/60 text-sm">Artist</span>
              {artist?.genres?.slice(0, 3).map((genre: string) => (
                <Badge 
                  key={genre} 
                  variant="outline" 
                  className="text-xs bg-white/5 border-white/10 text-white/80"
                >
                  {genre}
                </Badge>
              ))}
            </div>

            {/* Name */}
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
              {artist?.name || artistName}
            </h1>

            {/* Stats */}
            <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-white/60">
              <span>Last release: <strong className="text-cyan-400">Recently</strong></span>
              <span>•</span>
              <span>Albums: <strong className="text-white">{albums.length}</strong></span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
              <Button 
                size="lg"
                onClick={handlePlayAll}
                className="bg-white text-black hover:bg-white/90 font-semibold px-8"
              >
                <Play className="w-5 h-5 mr-2" fill="currentColor" />
                PLAY
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
              >
                <Bell className="w-5 h-5 mr-2" />
                Subscribe
              </Button>

              <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 pb-32 space-y-10">
        {/* Tracks Section */}
        <section>
          <h2 className="text-2xl md:text-3xl font-black text-white mb-6">Tracks</h2>
          
          <div className="space-y-1">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer"
                onClick={() => handlePlayTrack(track)}
              >
                {/* Thumbnail */}
                <div className="relative w-12 h-12 rounded-md overflow-hidden bg-white/5 flex-shrink-0">
                  {track.thumbnail ? (
                    <img 
                      src={track.thumbnail} 
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Disc className="w-5 h-5 text-white/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {loadingTrack === track.id ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Play className="w-5 h-5 text-white" fill="white" />
                    )}
                  </div>
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{track.title}</p>
                  <p className="text-sm text-white/50 truncate">{track.album}</p>
                </div>

                {/* Duration */}
                {track.duration && (
                  <span className="text-sm text-white/40">{track.duration}</span>
                )}

                {/* Actions */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-white/60 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToPlaylist(track);
                  }}
                >
                  <ListPlus className="w-5 h-5" />
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* Studio Albums Section */}
        {albums.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl md:text-3xl font-black text-white">
                Studio albums
                <span className="ml-3 text-sm font-normal text-white/40 uppercase tracking-wider">MORE</span>
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-white/5 hover:bg-white/10 text-white/60"
                  onClick={() => setAlbumScrollPosition(Math.max(0, albumScrollPosition - 1))}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-white/5 hover:bg-white/10 text-white/60"
                  onClick={() => setAlbumScrollPosition(albumScrollPosition + 1)}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <ScrollArea className="w-full">
              <div className="flex gap-4 pb-4">
                {albums.map((album) => (
                  <div 
                    key={album.id}
                    className="flex-shrink-0 w-40 md:w-48 group cursor-pointer"
                    onClick={() => handleAlbumClick(album)}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden bg-white/5 mb-3 relative">
                      {album.coverArt ? (
                        <img
                          src={album.coverArt}
                          alt={album.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Disc className="w-12 h-12 text-white/20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          size="icon"
                          className="rounded-full bg-cyan-500 hover:bg-cyan-400 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAlbumClick(album);
                          }}
                        >
                          <Play className="w-5 h-5" fill="white" />
                        </Button>
                      </div>
                      {/* YouTube badge */}
                      <div className="absolute bottom-2 right-2">
                        <Badge className="bg-red-600 text-white text-xs px-1.5 py-0.5">
                          <Youtube className="w-3 h-3" />
                        </Badge>
                      </div>
                    </div>
                    <p className="text-white font-medium text-sm truncate">{album.title}</p>
                    <p className="text-white/50 text-xs">{album.year}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </section>
        )}

        {/* Related Artists */}
        {relatedArtists.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl md:text-3xl font-black text-white">
                Related artists
                <span className="ml-3 text-sm font-normal text-white/40 uppercase tracking-wider">MORE</span>
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-white/5 hover:bg-white/10 text-white/60"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-white/5 hover:bg-white/10 text-white/60"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <ScrollArea className="w-full">
              <div className="flex gap-4 pb-4">
                {relatedArtists.map((related, idx) => (
                  <div 
                    key={idx}
                    className="flex-shrink-0 w-36 md:w-44 group cursor-pointer text-center"
                  >
                    <div className="aspect-square rounded-full overflow-hidden bg-white/5 mb-3 mx-auto w-32 h-32 md:w-40 md:h-40 relative">
                      {related.thumbnail ? (
                        <img
                          src={related.thumbnail}
                          alt={related.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-600/20 to-purple-600/20">
                          <span className="text-3xl font-bold text-white/30">
                            {related.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-white font-medium text-sm truncate">{related.name}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </section>
        )}
      </div>
    </div>
  );
}
