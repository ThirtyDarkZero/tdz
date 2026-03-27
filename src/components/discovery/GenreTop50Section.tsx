import { useState, useEffect, useCallback } from "react";
import { Play, ChevronDown, Loader2, Music, Plus, MoreHorizontal } from "lucide-react";
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
import { AddToPlaylistDialog } from "./AddToPlaylistDialog";
import { useClientYouTubeResolver } from "@/hooks/useClientYouTubeResolver";

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
  const [addToPlaylistTrack, setAddToPlaylistTrack] = useState<any>(null);
  const { playTrack, addToQueue } = usePlayer();
  const { resolveTrack } = useClientYouTubeResolver();

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

  const handlePlayTrack = async (track: TopTrack, index: number) => {
    let youtubeId = track.youtubeId;
    if (!youtubeId) {
      setLoadingTrack(track.id);
      try {
        const { data } = await supabase.functions.invoke("youtube-search", {
          body: { query: `${track.artist} ${track.title} official audio`, maxResults: 1, officialOnly: true },
        });
        youtubeId = data?.results?.[0]?.id;
      } catch (err) {
        console.log("Edge function failed, trying client resolver");
      }
      if (!youtubeId) {
        const resolved = await resolveTrack(track.title, track.artist);
        youtubeId = resolved?.youtubeId;
      }
      setLoadingTrack(null);
    }
    if (!youtubeId) { toast.error("Could not find playable version"); return; }

    const playerTrack = { id: track.id, title: track.title, artist_name: track.artist, duration: 0, file_path: "", play_count: 0, source: "youtube" as const, youtubeId, thumbnail: track.thumbnail };
    const queueTracks = tracks.slice(index + 1, index + 15).filter(t => t.youtubeId).map((t) => ({
      id: t.id, title: t.title, artist_name: t.artist, duration: 0, file_path: "", play_count: 0, source: "youtube" as const, youtubeId: t.youtubeId!, thumbnail: t.thumbnail,
    }));
    playTrack(playerTrack, [playerTrack, ...queueTracks]);
  };

  const handleAddToPlaylist = (track: TopTrack, e: React.MouseEvent) => {
    e.stopPropagation();
    setAddToPlaylistTrack({ id: track.id, title: track.title, artist_name: track.artist, youtubeId: track.youtubeId, thumbnail: track.thumbnail });
  };

  const handleAddToQueue = async (track: TopTrack, e: React.MouseEvent) => {
    e.stopPropagation();
    let youtubeId = track.youtubeId;
    if (!youtubeId) {
      try {
        const { data } = await supabase.functions.invoke("youtube-search", {
          body: { query: `${track.artist} ${track.title} official audio`, maxResults: 1, officialOnly: true },
        });
        youtubeId = data?.results?.[0]?.id;
      } catch (err) { console.error("YouTube search failed:", err); }
    }
    if (!youtubeId) { toast.error("Could not find playable version"); return; }
    addToQueue({ id: track.id, title: track.title, artist_name: track.artist, duration: 0, file_path: "", play_count: 0, source: "youtube", youtubeId, thumbnail: track.thumbnail });
    toast.success(`Added "${track.title}" to queue`);
  };

  const currentGenreLabel = GENRE_OPTIONS.find((g) => g.id === selectedGenre)?.label || "All Genres";

  return (
    <section className="relative py-10">
      {/* Glassmorphic container */}
      <div
        className="max-w-7xl mx-auto rounded-3xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 8px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <div className="px-6 md:px-10 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2
                style={{
                  fontFamily: "'Six Caps', sans-serif",
                  fontSize: "clamp(36px, 4vw, 52px)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  lineHeight: 1,
                  background: "linear-gradient(180deg, #FFFFFF 0%, #888888 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                TOP 50 SONGS
              </h2>
              <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 300, fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
                Trending tracks across all genres
              </p>
            </div>

            {/* Genre Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="min-w-[180px] justify-between rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    backdropFilter: "blur(12px)",
                    color: "#FFFFFF",
                    fontFamily: "'Raleway', sans-serif",
                    fontSize: 13,
                  }}
                >
                  {currentGenreLabel}
                  <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 rounded-xl"
                style={{
                  background: "rgba(20,20,30,0.95)",
                  backdropFilter: "blur(24px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {GENRE_OPTIONS.map((genre) => (
                  <DropdownMenuItem
                    key={genre.id}
                    onClick={() => setSelectedGenre(genre.id)}
                    className={`cursor-pointer ${selectedGenre === genre.id ? "text-[#00CFFF]" : "text-white/70 hover:text-white"}`}
                    style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13 }}
                  >
                    {genre.label}
                    {selectedGenre === genre.id && <span className="ml-auto text-[#00CFFF]">✓</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Track list */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#00CFFF" }} />
            </div>
          ) : (
            <ScrollArea className="h-[550px]">
              <div className="space-y-0.5">
                {tracks.map((track, index) => (
                  <div
                    key={`${track.id}-${index}`}
                    onClick={() => handlePlayTrack(track, index)}
                    className="group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer"
                    style={{ background: "transparent" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.backdropFilter = "blur(8px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.backdropFilter = ""; }}
                  >
                    {/* Position */}
                    <div className="w-8 text-center flex-shrink-0">
                      <span className="group-hover:hidden" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 14, fontWeight: 700, color: track.position <= 3 ? "#00CFFF" : "rgba(255,255,255,0.3)" }}>
                        {track.position}
                      </span>
                      <div className="hidden group-hover:flex items-center justify-center">
                        {loadingTrack === track.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#00CFFF]" />
                        ) : (
                          <Play className="w-4 h-4 text-white" fill="white" />
                        )}
                      </div>
                    </div>

                    {/* Thumbnail */}
                    <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "rgba(255,255,255,0.05)" }}>
                      {track.thumbnail ? (
                        <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" loading="lazy"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="w-4 h-4" style={{ color: "rgba(255,255,255,0.2)" }} />
                        </div>
                      )}
                    </div>

                    {/* Track info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate text-white group-hover:text-[#00CFFF] transition-colors" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600 }}>
                        {track.title}
                      </p>
                      <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Raleway', sans-serif" }}>
                        {track.artist}
                      </p>
                    </div>

                    {/* Genre badge - glassmorphic */}
                    <span
                      className="hidden sm:inline-block px-3 py-1 text-xs rounded-full capitalize"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.4)",
                        fontFamily: "'Raleway', sans-serif",
                        fontSize: 11,
                      }}
                    >
                      {track.genre}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10 rounded-full"
                        onClick={(e) => handleAddToPlaylist(track, e)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10 rounded-full"
                            onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" style={{ background: "rgba(20,20,30,0.95)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          <DropdownMenuItem onClick={(e) => handleAddToQueue(track, e as any)} className="text-white/80 hover:text-white cursor-pointer">Add to Queue</DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleAddToPlaylist(track, e as any)} className="text-white/80 hover:text-white cursor-pointer">Add to Playlist</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>

      <AddToPlaylistDialog open={!!addToPlaylistTrack} onOpenChange={(open) => !open && setAddToPlaylistTrack(null)} track={addToPlaylistTrack} />
    </section>
  );
}
