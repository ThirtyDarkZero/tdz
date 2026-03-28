import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Play, Bell, MoreHorizontal, ChevronLeft, ChevronRight, 
  Disc, Clock, ListPlus, Youtube, Loader2, Music, Heart
} from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import { useMusicBrainz } from "@/hooks/useMusicBrainz";
import { useDiscogsLibrary } from "@/hooks/useDiscogsLibrary";
import { GlobalAlbumDetail } from "./GlobalAlbumDetail";
import { ArtistYouTubeCatalog } from "./ArtistYouTubeCatalog";
import { useGlobalLibrary } from "@/hooks/useGlobalLibrary";

interface GlobalArtistProfileProps {
  artistName: string;
  artistId?: string;
  source: 'discogs' | 'musicbrainz' | 'allmusic';
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

// Multiple image source fallback for reliable artist images
const IMAGE_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMxYTFhMWEiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjgwIiBmaWxsPSIjMmEyYTJhIi8+PHBhdGggZD0iTTEwMCA2MEMxMjcuNjE0IDYwIDE1MCA4Mi4zODU4IDE1MCAxMTBDMTUwIDEzNy42MTQgMTI3LjYxNCAxNjAgMTAwIDE2MEM3Mi4zODU4IDE2MCA1MCAxMzcuNjE0IDUwIDExMEM1MCA4Mi4zODU4IDcyLjM4NTggNjAgMTAwIDYwWiIgZmlsbD0iIzNhM2EzYSIvPjwvc3ZnPg==';

export function GlobalArtistProfile({ 
  artistName, 
  artistId, 
  source, 
  onClose,
  onAddToPlaylist 
}: GlobalArtistProfileProps) {
  const { playTrack, addToQueue } = usePlayer();
  const { toggleGlobalLike, isGlobalTrackLiked, loadLikedGlobalTracks } = useGlobalLibrary();
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
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [youtubeChannelId, setYoutubeChannelId] = useState<string | null>(null);
  const [showFullCatalog, setShowFullCatalog] = useState(false);

  // Load liked tracks
  useEffect(() => {
    loadLikedGlobalTracks();
  }, [loadLikedGlobalTracks]);

  // Fetch artist image from multiple sources with fallbacks
  const fetchReliableArtistImage = useCallback(async (name: string): Promise<string | null> => {
    console.log('Fetching reliable artist image for:', name);
    
    // 1. Try AllMusic via edge function (highest quality)
    try {
      const { data: allMusicData } = await supabase.functions.invoke('allmusic-artist', {
        body: { artistName: name, includeDiscography: false }
      });
      if (allMusicData?.artist?.imageUrl) {
        console.log('Got AllMusic image:', allMusicData.artist.imageUrl);
        return allMusicData.artist.imageUrl;
      }
    } catch (e) {
      console.log('AllMusic fetch failed:', e);
    }

    // 2. Try YouTube Topic channel
    try {
      const { data: ytData } = await supabase.functions.invoke('youtube-search', {
        body: { query: `${name} - Topic`, maxResults: 1, type: 'channel' }
      });
      if (ytData?.results?.[0]?.thumbnail) {
        console.log('Got YouTube Topic image');
        return ytData.results[0].thumbnail;
      }
    } catch (e) {
      console.log('YouTube Topic fetch failed:', e);
    }

    // 3. Try YouTube artist search
    try {
      const { data: ytData } = await supabase.functions.invoke('youtube-search', {
        body: { query: `${name} official artist`, maxResults: 1 }
      });
      if (ytData?.results?.[0]?.thumbnail) {
        console.log('Got YouTube artist image');
        return ytData.results[0].thumbnail;
      }
    } catch (e) {
      console.log('YouTube artist fetch failed:', e);
    }

    // 4. Try unified music search for AllMusic/Discogs results
    try {
      const { data: unifiedData } = await supabase.functions.invoke('unified-music-search', {
        body: { query: name, type: 'artist', limit: 5, includeAllMusic: true }
      });
      const artistResult = unifiedData?.results?.find((r: any) => 
        r.type === 'artist' && (r.allMusicImage || r.thumbnail)
      );
      if (artistResult?.allMusicImage || artistResult?.thumbnail) {
        console.log('Got unified search image');
        return artistResult.allMusicImage || artistResult.thumbnail;
      }
    } catch (e) {
      console.log('Unified search fetch failed:', e);
    }

    return null;
  }, []);

  useEffect(() => {
    loadArtistData();
  }, [artistName, artistId, source]);

  const loadArtistData = async () => {
    setLoading(true);
    setImageLoadFailed(false);
    
    try {
      // Fetch artist image from reliable multi-source function
      const reliableImage = await fetchReliableArtistImage(artistName);
      if (reliableImage) {
        setArtistImage(reliableImage);
      }

      // Also try AllMusic for full artist data including discography
      if (source === 'allmusic' || !artistId) {
        try {
          const { data: allMusicData } = await supabase.functions.invoke('allmusic-artist', {
            body: { artistName, includeDiscography: true }
          });
          
          if (allMusicData?.artist) {
            setArtist({
              name: allMusicData.artist.name || artistName,
              image: allMusicData.artist.imageUrl,
              bio: allMusicData.artist.biography,
              genres: allMusicData.artist.genres || [],
              styles: allMusicData.artist.styles || [],
            });
            
            // Use AllMusic image if we don't have one yet
            if (!reliableImage && allMusicData.artist.imageUrl) {
              setArtistImage(allMusicData.artist.imageUrl);
            }
            
            // Use AllMusic discography if available
            if (allMusicData.artist.discography?.length > 0) {
              setAlbums(allMusicData.artist.discography.map((album: any) => ({
                id: album.id,
                title: album.title,
                year: album.year,
                coverArt: album.coverArt,
                type: album.type,
                genres: allMusicData.artist.genres,
              })));
            }
          }
        } catch (e) {
          console.log('AllMusic full data fetch failed:', e);
        }
      }

      if (source === 'musicbrainz' && artistId) {
        const data = await getMBArtist(artistId);
        if (data) {
          setArtist({
            name: data.name,
            image: null,
            genres: data.genres?.map((g: any) => g.name) || [],
            type: data.type,
            country: data.country,
            beginDate: data.beginDate,
          });
          
          if (data.releaseGroups && albums.length === 0) {
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
          
          // Use Discogs image as fallback
          if (!artistImage && data.cover_art_url) {
            setArtistImage(data.cover_art_url);
          }
        }
        
        // Get releases
        const releases = await getArtistReleases(artistId);
        if (releases?.releases && albums.length === 0) {
          setAlbums(releases.releases.slice(0, 20).map((r: any) => ({
            id: r.id,
            title: r.title,
            year: r.year,
            coverArt: r.cover_art_url,
            type: r.type,
            genres: r.genres || [],
          })));
        }
      } else if (!artist) {
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

      // Get popular tracks via YouTube Music search (official only)
      const { data: ytData } = await supabase.functions.invoke('youtube-search', {
        body: { 
          query: `${artistName} official audio`, 
          maxResults: 15,
          officialOnly: true 
        }
      });

      if (ytData?.results) {
        setTracks(ytData.results.map((video: any, idx: number) => ({
          id: `yt-${video.id}`,
          title: video.title.replace(new RegExp(artistName, 'gi'), '').replace(/[-|]/g, '').replace(/\(official.*?\)/gi, '').trim(),
          album: 'YouTube Music',
          duration: video.duration,
          position: String(idx + 1),
          youtubeId: video.id,
          thumbnail: video.thumbnail,
        })));
      }

      // Get related artists
      const { data: relatedData } = await supabase.functions.invoke('youtube-search', {
        body: { query: `${artistName} similar artists`, maxResults: 10 }
      });

      if (relatedData?.results) {
        const uniqueArtists = new Map();
        for (const video of relatedData.results) {
          if (!uniqueArtists.has(video.channel) && video.channel.toLowerCase() !== artistName.toLowerCase()) {
            uniqueArtists.set(video.channel, {
              name: video.channel,
              thumbnail: video.thumbnail,
            });
          }
        }
        setRelatedArtists(Array.from(uniqueArtists.values()).slice(0, 6));
      }

    } catch (error) {
      console.error('Error loading artist:', error);
      toast.error('Failed to load artist data');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayTrack = async (track: GlobalTrack, index?: number) => {
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
      
      // Add remaining tracks to queue for continuous playback
      if (typeof index === 'number') {
        tracks.slice(index + 1).forEach(t => {
          if (t.youtubeId) {
            addToQueue({
              id: t.id,
              title: t.title,
              artist_name: artist?.name || artistName,
              duration: 0,
              file_path: '',
              play_count: 0,
              source: 'youtube' as const,
              youtubeId: t.youtubeId,
              thumbnail: t.thumbnail,
            });
          }
        });
      }
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
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: "#03030F" }}>
      {/* Blurred art background */}
      {(artistImage || artist?.image) && (
        <div className="fixed inset-0 z-0" style={{
          backgroundImage: `url(${artistImage || artist?.image})`,
          backgroundSize: "cover", backgroundPosition: "center",
          filter: "blur(80px) saturate(1.5) brightness(0.15)", transform: "scale(1.2)",
        }} />
      )}
      <div className="fixed inset-0 z-0" style={{ background: "linear-gradient(to bottom, rgba(3,3,15,0.4), rgba(3,3,15,0.9) 60%, rgba(3,3,15,0.98))" }} />

      {/* Header */}
      <div className="sticky top-0 z-20" style={{ background: "rgba(3,3,15,0.75)", backdropFilter: "blur(32px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-4 px-4 md:px-6 py-3">
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold truncate" style={{ color: "var(--text-1)" }}>{artist?.name || artistName}</h1>
        </div>
      </div>

      <div className="relative z-10">
        {/* Centered Hero */}
        <div className="flex flex-col items-center pt-10 pb-8 px-4">
          {/* Circular photo with coral glow */}
          <div className="relative mb-6">
            <div className="absolute -inset-4 rounded-full" style={{ background: "rgba(255,99,71,0.2)", filter: "blur(30px)" }} />
            <div className="relative w-44 h-44 md:w-56 md:h-56 rounded-full overflow-hidden" style={{
              border: "3px solid rgba(255,99,71,0.3)",
              boxShadow: "0 0 40px rgba(255,99,71,0.15), inset 0 0 30px rgba(0,0,0,0.3)",
            }}>
              {(artistImage || artist?.image) ? (
                <img src={artistImage || artist?.image} alt={artist?.name || artistName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(255,99,71,0.2), rgba(139,92,246,0.2))" }}>
                  <span className="text-5xl font-black" style={{ color: "rgba(255,255,255,0.3)" }}>{(artist?.name || artistName).charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Name + genres */}
          <h1 className="text-3xl md:text-5xl font-black text-center tracking-tight mb-2" style={{ color: "var(--text-1)" }}>
            {artist?.name || artistName}
          </h1>
          <div className="flex items-center gap-2 flex-wrap justify-center mb-4">
            <span className="text-xs uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Artist</span>
            {artist?.genres?.slice(0, 4).map((genre: string) => (
              <Badge key={genre} variant="outline" className="text-[10px]" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)", color: "var(--text-2)" }}>
                {genre}
              </Badge>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs mb-5" style={{ color: "var(--text-3)" }}>
            <span>Albums: <strong style={{ color: "var(--text-1)" }}>{albums.length}</strong></span>
            <span>•</span>
            <span>Tracks: <strong style={{ color: "var(--text-1)" }}>{tracks.length}</strong></span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button size="lg" onClick={handlePlayAll} className="font-semibold px-8" style={{ background: "#FF6347", color: "#000" }}>
              <Play className="w-5 h-5 mr-2" fill="currentColor" /> PLAY
            </Button>
            <Button variant="outline" size="lg" style={{ borderColor: "rgba(255,99,71,0.3)", color: "#FF6347" }}>
              <Bell className="w-5 h-5 mr-2" /> Subscribe
            </Button>
            <Button variant="ghost" size="icon" style={{ color: "var(--text-3)" }}><MoreHorizontal className="w-5 h-5" /></Button>
          </div>
        </div>

      <div className="px-4 md:px-8 pb-32 space-y-10">
        {/* YouTube Music Catalog - Full Official Releases */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
              <Youtube className="w-7 h-7 text-red-500" />
              Official Catalog
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFullCatalog(!showFullCatalog)}
              className="border-white/20 text-white/60 hover:text-white"
            >
              {showFullCatalog ? 'Show Less' : 'View All'}
            </Button>
          </div>
          
          <ArtistYouTubeCatalog
            artistName={artist?.name || artistName}
            youtubeChannelId={youtubeChannelId || undefined}
            onAlbumClick={(album) => {
              setSelectedAlbum({
                id: album.id,
                title: album.title,
                coverArt: album.thumbnail,
                genres: artist?.genres,
              });
            }}
          />
        </section>

        {/* Tracks Section */}
        {tracks.length > 0 && (
          <section>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-6">Popular Tracks</h2>
            
            <div className="space-y-1">
              {tracks.slice(0, showFullCatalog ? tracks.length : 10).map((track, index) => {
                const isLiked = isGlobalTrackLiked({
                  id: track.id,
                  title: track.title,
                  artist_name: artist?.name || artistName,
                  youtubeId: track.youtubeId,
                  source: 'youtube',
                });
                
                return (
                  <div
                    key={track.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer"
                    onClick={() => handlePlayTrack(track, index)}
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

                    {/* Like Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`transition-colors ${isLiked ? 'text-pink-500' : 'text-white/40 hover:text-pink-400'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleGlobalLike({
                          id: track.id,
                          title: track.title,
                          artist_name: artist?.name || artistName,
                          youtubeId: track.youtubeId,
                          thumbnail: track.thumbnail,
                          source: 'youtube',
                        });
                      }}
                    >
                      <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                    </Button>

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
                );
              })}
            </div>
          </section>
        )}

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
