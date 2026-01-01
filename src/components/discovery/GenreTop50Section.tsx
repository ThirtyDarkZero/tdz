import { useState, useEffect, useCallback } from "react";
import { Play, ChevronDown, Loader2, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer } from "@/contexts/PlayerContext";
import { toast } from "sonner";

interface TopTrack {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  genre: string;
  position: number;
  youtubeId?: string;
}

const GENRE_OPTIONS = [
  { id: "all", label: "All Genres" },
  { id: "hip-hop", label: "Hip Hop / R&B" },
  { id: "dance", label: "Dance Music" },
  { id: "pop", label: "Pop / Mainstream" },
  { id: "00s", label: "00s" },
  { id: "90s", label: "90s" },
  { id: "80s", label: "80s & Back" },
  { id: "rock", label: "Rock / Alternative" },
  { id: "country", label: "Country" },
  { id: "latin", label: "Latin" },
  { id: "electronic", label: "Electronic" },
  { id: "rnb", label: "R&B / Soul" },
  { id: "exclusives", label: "Exclusives" },
];

interface GenreTop50SectionProps {
  onViewAll?: () => void;
}

export function GenreTop50Section({ onViewAll }: GenreTop50SectionProps) {
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [tracks, setTracks] = useState<TopTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTrack, setLoadingTrack] = useState<string | null>(null);
  const { playTrack, addToQueue } = usePlayer();

  // Fetch tracks for selected genre
  const fetchGenreTracks = useCallback(async () => {
    setLoading(true);
    try {
      const genre = selectedGenre === "all" ? "hip-hop" : selectedGenre;
      const { data, error } = await supabase.functions.invoke("genre-top50", {
        body: { genre, limit: 50, withYouTube: true },
      });

      if (error) throw error;
      setTracks(data?.tracks || []);
    } catch (err) {
      console.error("Failed to fetch genre tracks:", err);
      toast.error("Failed to load Top 50 tracks");
    } finally {
      setLoading(false);
    }
  }, [selectedGenre]);

  useEffect(() => {
    fetchGenreTracks();
  }, [fetchGenreTracks]);

  // Play track via YouTube
  const handlePlayTrack = async (track: TopTrack, index: number) => {
    let youtubeId = track.youtubeId;

    // If no YouTube ID, search for it
    if (!youtubeId) {
      setLoadingTrack(track.id);
      try {
        const { data } = await supabase.functions.invoke("youtube-search", {
          body: {
            query: `${track.artist} ${track.title} official audio`,
            maxResults: 1,
            officialOnly: true,
          },
        });
        youtubeId = data?.results?.[0]?.id;
      } catch (err) {
        console.error("YouTube search failed:", err);
      }
      setLoadingTrack(null);
    }

    if (!youtubeId) {
      toast.error("Could not find playable version");
      return;
    }

    // Play the track
    playTrack({
      id: track.id,
      title: track.title,
      artist_name: track.artist,
      duration: 0,
      file_path: "",
      play_count: 0,
      source: "youtube",
      youtubeId,
      thumbnail: track.thumbnail,
    });

    // Queue remaining tracks
    tracks.slice(index + 1, index + 10).forEach((t) => {
      if (t.youtubeId) {
        addToQueue({
          id: t.id,
          title: t.title,
          artist_name: t.artist,
          duration: 0,
          file_path: "",
          play_count: 0,
          source: "youtube",
          youtubeId: t.youtubeId,
          thumbnail: t.thumbnail,
        });
      }
    });
  };

  const currentGenreLabel =
    GENRE_OPTIONS.find((g) => g.id === selectedGenre)?.label || "All Genres";

  return (
    <section className="py-12 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Header - BPM Supreme style */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Top 50 Songs
            </h2>
            <p className="text-white/50 text-sm mt-1">
              Trending tracks across all genres
            </p>
          </div>

          {/* Genre Dropdown - BPM Supreme style */}
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 min-w-[180px] justify-between"
                >
                  {currentGenreLabel}
                  <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-[#1a1a1a] border-white/10"
              >
                {GENRE_OPTIONS.map((genre) => (
                  <DropdownMenuItem
                    key={genre.id}
                    onClick={() => setSelectedGenre(genre.id)}
                    className={`cursor-pointer ${
                      selectedGenre === genre.id
                        ? "bg-cyan-500/20 text-cyan-400"
                        : "text-white/80 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {genre.label}
                    {selectedGenre === genre.id && (
                      <span className="ml-auto text-cyan-400">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Track list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          </div>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="space-y-1">
              {tracks.map((track, index) => (
                <div
                  key={`${track.id}-${index}`}
                  onClick={() => handlePlayTrack(track, index)}
                  className="group flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  {/* Position */}
                  <div className="w-8 text-center">
                    <span className="text-white/40 text-sm font-medium group-hover:hidden">
                      {track.position}
                    </span>
                    <div className="hidden group-hover:flex items-center justify-center">
                      {loadingTrack === track.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                      ) : (
                        <Play className="w-4 h-4 text-white" fill="white" />
                      )}
                    </div>
                  </div>

                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded bg-white/5 overflow-hidden flex-shrink-0">
                    {track.thumbnail ? (
                      <img
                        src={track.thumbnail}
                        alt={track.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&q=80";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-5 h-5 text-white/30" />
                      </div>
                    )}
                  </div>

                  {/* Track info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate group-hover:text-cyan-400 transition-colors">
                      {track.title}
                    </p>
                    <p className="text-sm text-white/50 truncate">
                      {track.artist}
                    </p>
                  </div>

                  {/* Genre badge */}
                  <span className="hidden sm:inline-block px-2 py-1 text-xs bg-white/5 text-white/50 rounded capitalize">
                    {track.genre}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </section>
  );
}
