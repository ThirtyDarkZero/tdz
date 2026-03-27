import { useState, useEffect } from "react";
import { Play, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer } from "@/contexts/PlayerContext";
import { useNavigate } from "react-router-dom";
import { useClientYouTubeResolver } from "@/hooks/useClientYouTubeResolver";

interface TrendingTrack {
  id: string;
  title: string;
  artist: string;
  image: string;
  position?: number;
  youtubeId?: string;
  source?: string;
}

interface CityTrendingProps {
  sectionNumber?: number;
  onViewAllTrends?: () => void;
}

const TRENDING_CITIES = [
  { id: 'nyc', name: 'NYC', region: 'us' },
  { id: 'london', name: 'London', region: 'uk' },
  { id: 'chicago', name: 'Chicago', region: 'us' },
  { id: 'miami', name: 'Miami', region: 'us' },
  { id: 'atlanta', name: 'Atlanta', region: 'us' },
  { id: 'berlin', name: 'Berlin', region: 'de' },
  { id: 'tokyo', name: 'Tokyo', region: 'jp' },
  { id: 'los-angeles', name: 'Los Angeles', region: 'us' },
  { id: 'paris', name: 'Paris', region: 'fr' },
  { id: 'barcelona', name: 'Barcelona', region: 'es' },
  { id: 'detroit', name: 'Detroit', region: 'us' },
  { id: 'cdmx', name: 'CDMX', region: 'mx' },
  { id: 'dubai', name: 'Dubai', region: 'ae' },
  { id: 'houston', name: 'Houston', region: 'us' },
  { id: 'singapore', name: 'Singapore', region: 'sg' },
];

export function CityTrendingSection({ sectionNumber = 0, onViewAllTrends }: CityTrendingProps) {
  const [activeCity, setActiveCity] = useState('nyc');
  const [tracks, setTracks] = useState<TrendingTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const { playTrack } = usePlayer();
  const navigate = useNavigate();
  const { resolveTrack } = useClientYouTubeResolver();

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('spotify-trending', {
          body: { action: 'city-trending', cityId: activeCity }
        });
        if (error) { setTracks(getFallbackTracks(activeCity)); return; }
        const spotifyTracks = data?.data?.tracks || [];
        if (spotifyTracks.length > 0) {
          const tracksWithYouTube = await Promise.all(
            spotifyTracks.slice(0, 5).map(async (track: any, index: number) => {
              let youtubeId: string | undefined;
              try {
                const ytResponse = await supabase.functions.invoke('youtube-search', {
                  body: { query: `${track.title} ${track.artist} official audio`, type: 'search', maxResults: 1, officialOnly: true }
                });
                youtubeId = ytResponse.data?.results?.[0]?.id;
              } catch (ytErr) { console.error('YouTube search failed:', ytErr); }
              return {
                id: track.id || `spotify-${index + 1}`, title: track.title || 'Unknown Track',
                artist: track.artist || 'Unknown Artist',
                image: track.thumbnail || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
                position: index + 1, youtubeId, source: 'spotify',
              };
            })
          );
          setTracks(tracksWithYouTube);
        } else {
          setTracks(getFallbackTracks(activeCity));
        }
      } catch (err) {
        setTracks(getFallbackTracks(activeCity));
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, [activeCity]);

  const getFallbackTracks = (cityId: string): TrendingTrack[] => {
    const cityTracks: Record<string, TrendingTrack[]> = {
      'nyc': [
        { id: '1', title: 'Not Like Us', artist: 'Kendrick Lamar', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80', position: 1 },
        { id: '2', title: 'Lose Control', artist: 'Teddy Swims', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80', position: 2 },
        { id: '3', title: 'Beautiful Things', artist: 'Benson Boone', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80', position: 3 },
        { id: '4', title: 'Million Dollar Baby', artist: 'Tommy Richman', image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&q=80', position: 4 },
        { id: '5', title: 'Birds of a Feather', artist: 'Billie Eilish', image: 'https://images.unsplash.com/photo-1571266028243-d220c6e3d9ec?w=400&q=80', position: 5 },
      ],
    };
    return cityTracks[cityId] || cityTracks['nyc'];
  };

  const handlePlayTrack = async (track: TrendingTrack) => {
    let youtubeId = track.youtubeId;
    if (!youtubeId) {
      try {
        const { data } = await supabase.functions.invoke('youtube-search', {
          body: { query: `${track.title} ${track.artist} official audio`, type: 'search', maxResults: 1, officialOnly: true }
        });
        youtubeId = data?.results?.[0]?.id;
      } catch (err) { console.log('Edge function failed, trying client resolver'); }
      if (!youtubeId) {
        const resolved = await resolveTrack(track.title, track.artist);
        youtubeId = resolved?.youtubeId;
      }
    }
    if (!youtubeId) return;
    playTrack({ id: track.id, title: track.title, artist_name: track.artist, source: 'youtube', youtubeId, album_cover_path: track.image, duration: 0, file_path: '', play_count: 0 });
  };

  return (
    <section className="relative py-10">
      {/* Glassmorphic container */}
      <div
        className="max-w-7xl mx-auto rounded-3xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.02)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "0 8px 64px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div className="px-6 md:px-10 py-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
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
                TRENDING IN
              </h2>
            </div>
            {onViewAllTrends && (
              <Button variant="ghost" onClick={onViewAllTrends}
                className="text-white/50 hover:text-white hover:bg-white/5 gap-2 uppercase tracking-wider text-xs font-semibold"
                style={{ fontFamily: "'Raleway', sans-serif" }}>
                All Trends <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* City selector - glassmorphic pills */}
          <div className="flex flex-wrap items-center gap-2 mb-8">
            {TRENDING_CITIES.map((city) => (
              <button
                key={city.id}
                onClick={() => setActiveCity(city.id)}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
                style={{
                  fontFamily: "'Raleway', sans-serif",
                  fontSize: 12,
                  letterSpacing: "0.05em",
                  background: activeCity === city.id ? "rgba(0,207,255,0.12)" : "rgba(255,255,255,0.03)",
                  border: activeCity === city.id ? "1px solid rgba(0,207,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
                  backdropFilter: "blur(8px)",
                  color: activeCity === city.id ? "#00CFFF" : "rgba(255,255,255,0.45)",
                }}
              >
                {city.name}
              </button>
            ))}
          </div>

          {/* Trending tracks grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square rounded-2xl mb-3" style={{ background: "rgba(255,255,255,0.04)" }} />
                  <div className="h-3 rounded w-3/4 mb-2" style={{ background: "rgba(255,255,255,0.04)" }} />
                  <div className="h-2.5 rounded w-1/2" style={{ background: "rgba(255,255,255,0.03)" }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-5">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className="group cursor-pointer transition-all duration-300 hover:-translate-y-1.5"
                  onClick={() => handlePlayTrack(track)}
                >
                  {/* Rank */}
                  <div className="mb-2">
                    <span style={{
                      fontFamily: "'Six Caps', sans-serif",
                      fontSize: 24,
                      color: (track.position || 0) <= 3 ? "#00CFFF" : "rgba(255,255,255,0.2)",
                      letterSpacing: "0.03em",
                    }}>
                      {track.position}
                    </span>
                  </div>

                  {/* Album art - glassmorphic card */}
                  <div
                    className="relative aspect-square rounded-2xl overflow-hidden transition-all duration-500 group-hover:shadow-2xl"
                    style={{
                      border: "1px solid rgba(255,255,255,0.06)",
                      boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
                    }}
                  >
                    <img
                      src={track.image}
                      alt={track.title}
                      className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-75"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80'; }}
                    />

                    {/* Play overlay */}
                    <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                      <Button
                        size="icon"
                        className="w-10 h-10 rounded-full transition-all hover:scale-110"
                        style={{
                          background: "rgba(255,255,255,0.9)",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                          color: "#000",
                        }}
                      >
                        <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                      </Button>
                    </div>

                    {/* Glassmorphic border glow */}
                    <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ boxShadow: "inset 0 0 0 1px rgba(0,207,255,0.15), 0 0 20px rgba(0,207,255,0.05)" }} />
                  </div>

                  {/* Track info */}
                  <div className="mt-3">
                    <h3 className="font-semibold text-sm truncate text-white group-hover:text-[#00CFFF] transition-colors"
                      style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600 }}>
                      {track.title}
                    </h3>
                    <p className="text-xs truncate mt-0.5" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Raleway', sans-serif" }}>
                      {track.artist}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
