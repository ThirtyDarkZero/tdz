import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Play, Youtube, Disc, Loader2, ChevronRight, Music } from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import { toast } from "sonner";
import { useClientYouTubeResolver } from "@/hooks/useClientYouTubeResolver";

interface ArtistYouTubeCatalogProps {
  artistName: string;
  youtubeChannelId?: string;
  youtubeChannelUrl?: string;
  onAlbumClick?: (album: any) => void;
}

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration?: string;
  viewCount?: string;
  publishedAt?: string;
  isOfficialAudio?: boolean;
}

interface Album {
  id: string;
  title: string;
  thumbnail: string;
  year?: string;
  tracks: YouTubeVideo[];
}

export function ArtistYouTubeCatalog({ 
  artistName, 
  youtubeChannelId, 
  youtubeChannelUrl,
  onAlbumClick 
}: ArtistYouTubeCatalogProps) {
  const { playTrack, addToQueue } = usePlayer();
  const { resolveTrack } = useClientYouTubeResolver();
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelInfo, setChannelInfo] = useState<any>(null);

  useEffect(() => {
    loadYouTubeCatalog();
  }, [artistName, youtubeChannelId, youtubeChannelUrl]);

  const loadYouTubeCatalog = async () => {
    setLoading(true);
    try {
      let catalogVideos: YouTubeVideo[] = [];
      
      // Try to load from channel if URL/ID provided
      if (youtubeChannelId || youtubeChannelUrl) {
        const { data } = await supabase.functions.invoke('youtube-search', {
          body: {
            type: 'channel',
            channelId: youtubeChannelId,
            channelUrl: youtubeChannelUrl,
            maxResults: 50,
          }
        });

        if (data?.results?.length > 0) {
          catalogVideos = data.results;
          setChannelInfo(data.channelInfo);
        }
      }

      // Fallback to topic channel search
      if (catalogVideos.length === 0) {
        const { data: topicData } = await supabase.functions.invoke('youtube-search', {
          body: {
            query: `${artistName} - Topic`,
            maxResults: 30,
            officialOnly: true
          }
        });

        if (topicData?.results) {
          // Filter for likely official content
          catalogVideos = topicData.results.filter((v: any) => {
            const channel = (v.channel || '').toLowerCase();
            return channel.includes('topic') || channel.includes('vevo') || v.isOfficialAudio;
          });
        }
      }

      // If still no results, search by artist name
      if (catalogVideos.length === 0) {
        const { data: searchData } = await supabase.functions.invoke('youtube-search', {
          body: {
            query: `${artistName} official audio`,
            maxResults: 30,
            officialOnly: true
          }
        });

        if (searchData?.results) {
          catalogVideos = searchData.results;
        }
      }

      setVideos(catalogVideos);

      // Group into albums by detecting patterns in titles
      const albumMap = new Map<string, Album>();
      catalogVideos.forEach((video: YouTubeVideo) => {
        // Try to extract album name from title patterns
        const albumMatch = video.title.match(/\(.*?album.*?\)|from\s+["'](.+?)["']/i);
        const albumName = albumMatch ? albumMatch[1] || 'Singles' : 'Singles';
        
        if (!albumMap.has(albumName)) {
          albumMap.set(albumName, {
            id: `album-${albumName}`,
            title: albumName,
            thumbnail: video.thumbnail,
            tracks: [],
          });
        }
        albumMap.get(albumName)!.tracks.push(video);
      });

      // Convert to array and sort by track count
      const albumList = Array.from(albumMap.values())
        .filter(a => a.tracks.length >= 2)
        .sort((a, b) => b.tracks.length - a.tracks.length);

      setAlbums(albumList);
    } catch (error) {
      console.error('Error loading YouTube catalog:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayVideo = (video: YouTubeVideo, index: number) => {
    const track = {
      id: `yt-${video.id}`,
      title: cleanTitle(video.title),
      artist_name: artistName,
      duration: 0,
      file_path: '',
      play_count: 0,
      source: 'youtube' as const,
      youtubeId: video.id,
      thumbnail: video.thumbnail,
    };

    playTrack(track);

    // Queue remaining
    videos.slice(index + 1).forEach(v => {
      addToQueue({
        id: `yt-${v.id}`,
        title: cleanTitle(v.title),
        artist_name: artistName,
        duration: 0,
        file_path: '',
        play_count: 0,
        source: 'youtube' as const,
        youtubeId: v.id,
        thumbnail: v.thumbnail,
      });
    });
  };

  const cleanTitle = (title: string) => {
    return title
      .replace(new RegExp(artistName, 'gi'), '')
      .replace(/\(official.*?\)/gi, '')
      .replace(/\[official.*?\]/gi, '')
      .replace(/[-|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (videos.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Channel Info */}
      {channelInfo && (
        <div className="flex items-center gap-3 mb-4">
          <Badge className="bg-red-600/20 text-red-400 border-0">
            <Youtube className="w-3 h-3 mr-1" />
            YouTube Music
          </Badge>
          <span className="text-white/60 text-sm">{videos.length} official tracks</span>
        </div>
      )}

      {/* Singles / All Tracks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Official Releases</h3>
          <span className="text-white/40 text-sm">{videos.length} tracks</span>
        </div>
        
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4">
            {videos.slice(0, 12).map((video, index) => (
              <div
                key={video.id}
                className="flex-shrink-0 w-40 group cursor-pointer"
                onClick={() => handlePlayVideo(video, index)}
              >
                <div className="relative aspect-square rounded-lg overflow-hidden bg-white/5 mb-2">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform">
                      <Play className="w-5 h-5 text-black ml-0.5" fill="black" />
                    </div>
                  </div>
                  {video.isOfficialAudio && (
                    <Badge className="absolute top-2 left-2 bg-green-600/80 text-white text-[10px] px-1.5">
                      Official
                    </Badge>
                  )}
                </div>
                <p className="text-white text-sm font-medium truncate">{cleanTitle(video.title)}</p>
                <p className="text-white/40 text-xs truncate">{video.duration || 'Audio'}</p>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Detected Albums */}
      {albums.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Albums & EPs</h3>
          </div>
          
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4">
              {albums.map((album) => (
                <div
                  key={album.id}
                  className="flex-shrink-0 w-44 group cursor-pointer"
                  onClick={() => onAlbumClick?.(album)}
                >
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-white/5 mb-2">
                    <img
                      src={album.thumbnail}
                      alt={album.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <Badge className="bg-black/60 text-white border-0 text-[10px]">
                        <Disc className="w-3 h-3 mr-1" />
                        {album.tracks.length} tracks
                      </Badge>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform">
                        <Play className="w-5 h-5 text-black ml-0.5" fill="black" />
                      </div>
                    </div>
                  </div>
                  <p className="text-white text-sm font-medium truncate">{album.title}</p>
                  {album.year && (
                    <p className="text-white/40 text-xs">{album.year}</p>
                  )}
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
