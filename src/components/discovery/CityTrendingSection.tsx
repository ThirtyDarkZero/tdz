import { useState, useEffect } from "react";
import { Play, ChevronRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer } from "@/contexts/PlayerContext";
import { useNavigate } from "react-router-dom";

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
  { id: 'san-francisco', name: 'San Francisco', region: 'us' },
  { id: 'paris', name: 'Paris', region: 'fr' },
  { id: 'barcelona', name: 'Barcelona', region: 'es' },
  { id: 'detroit', name: 'Detroit', region: 'us' },
  { id: 'cdmx', name: 'CDMX', region: 'mx' },
  { id: 'san-diego', name: 'San Diego', region: 'us' },
  { id: 'dubai', name: 'Dubai', region: 'ae' },
  { id: 'houston', name: 'Houston', region: 'us' },
  { id: 'denver', name: 'Denver', region: 'us' },
  { id: 'singapore', name: 'Singapore', region: 'sg' },
  { id: 'san-antonio', name: 'San Antonio', region: 'us' },
];

export function CityTrendingSection({ 
  sectionNumber = 5,
  onViewAllTrends 
}: CityTrendingProps) {
  const [activeCity, setActiveCity] = useState('nyc');
  const [tracks, setTracks] = useState<TrendingTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);
  const { playTrack } = usePlayer();
  const navigate = useNavigate();

  // Fetch trending tracks from Spotify's regional Top 50 playlists
  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      try {
        // Use the city-trending action to get regional Top 50 tracks
        const { data, error } = await supabase.functions.invoke('spotify-trending', {
          body: { action: 'city-trending', cityId: activeCity }
        });

        if (error) {
          console.error('Error fetching city trending:', error);
          setTracks(getFallbackTracks(activeCity));
          return;
        }

        const spotifyTracks = data?.data?.tracks || [];
        
        if (spotifyTracks.length > 0) {
          const mappedTracks: TrendingTrack[] = spotifyTracks.slice(0, 5).map((track: any) => ({
            id: track.id || `spotify-${track.position}`,
            title: track.title || 'Unknown Track',
            artist: track.artist || 'Unknown Artist',
            image: track.thumbnail || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
            position: track.position,
            source: 'spotify',
          }));
          setTracks(mappedTracks);
          console.log(`Loaded ${mappedTracks.length} Spotify tracks for ${activeCity}`);
        } else {
          console.log(`No Spotify tracks for ${activeCity}, using fallback`);
          setTracks(getFallbackTracks(activeCity));
        }
      } catch (err) {
        console.error('Error fetching trending:', err);
        setTracks(getFallbackTracks(activeCity));
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, [activeCity]);

  const getFallbackTracks = (cityId: string): TrendingTrack[] => {
    // City-specific trending fallbacks based on typical genre preferences
    const cityTracks: Record<string, TrendingTrack[]> = {
      'nyc': [
        { id: '1', title: 'Not Like Us', artist: 'Kendrick Lamar', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80', position: 1 },
        { id: '2', title: 'Lose Control', artist: 'Teddy Swims', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80', position: 2 },
        { id: '3', title: 'Beautiful Things', artist: 'Benson Boone', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80', position: 3 },
        { id: '4', title: 'Million Dollar Baby', artist: 'Tommy Richman', image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&q=80', position: 4 },
        { id: '5', title: 'Birds of a Feather', artist: 'Billie Eilish', image: 'https://images.unsplash.com/photo-1571266028243-d220c6e3d9ec?w=400&q=80', position: 5 },
      ],
      'london': [
        { id: '1', title: 'Too Sweet', artist: 'Hozier', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80', position: 1 },
        { id: '2', title: 'Espresso', artist: 'Sabrina Carpenter', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80', position: 2 },
        { id: '3', title: 'Good Luck, Babe!', artist: 'Chappell Roan', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80', position: 3 },
        { id: '4', title: 'Stick Season', artist: 'Noah Kahan', image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&q=80', position: 4 },
        { id: '5', title: 'Lunch', artist: 'Billie Eilish', image: 'https://images.unsplash.com/photo-1571266028243-d220c6e3d9ec?w=400&q=80', position: 5 },
      ],
      'miami': [
        { id: '1', title: 'Titi Me Pregunto', artist: 'Bad Bunny', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80', position: 1 },
        { id: '2', title: 'Ella Baila Sola', artist: 'Eslabon Armado', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80', position: 2 },
        { id: '3', title: 'La Bebe', artist: 'Peso Pluma', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80', position: 3 },
        { id: '4', title: 'Me Porto Bonito', artist: 'Bad Bunny', image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&q=80', position: 4 },
        { id: '5', title: 'Cupido', artist: 'Rauw Alejandro', image: 'https://images.unsplash.com/photo-1571266028243-d220c6e3d9ec?w=400&q=80', position: 5 },
      ],
    };

    return cityTracks[cityId] || cityTracks['nyc'];
  };

  const handlePlayTrack = (track: TrendingTrack) => {
    playTrack({
      id: track.id,
      title: track.title,
      artist_name: track.artist,
      source: 'youtube',
      youtubeId: track.youtubeId,
      album_cover_path: track.image,
      duration: 0,
      file_path: '',
      play_count: 0,
    });
  };

  const handleViewAllTrends = () => {
    if (onViewAllTrends) {
      onViewAllTrends();
    } else {
      navigate('/discover?tab=library');
    }
  };

  return (
    <section className="relative py-16 bg-[#030303]">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-baseline gap-10">
            <span className="text-white/20 text-5xl md:text-6xl font-black font-display">
              {sectionNumber}
            </span>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white font-display tracking-tight">
                Trending in
              </h2>
            </div>
          </div>
          
          <Button
            variant="ghost"
            onClick={handleViewAllTrends}
            className="text-white/60 hover:text-white hover:bg-white/5 gap-2 uppercase tracking-wider text-sm font-semibold"
          >
            All Trends
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* City selector - flowing text style */}
        <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2">
          {TRENDING_CITIES.map((city, index) => (
            <div key={city.id} className="flex items-center">
              <button
                onClick={() => setActiveCity(city.id)}
                className={`
                  text-xl md:text-2xl lg:text-3xl font-bold transition-all duration-300
                  ${activeCity === city.id 
                    ? 'text-white' 
                    : 'text-white/30 hover:text-white/60'
                  }
                `}
              >
                {city.name}
              </button>
              {index < TRENDING_CITIES.length - 1 && (
                <span className="text-white/20 text-xl md:text-2xl lg:text-3xl font-light mx-3">/</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Trending tracks grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-white/5 rounded-xl mb-3" />
                <div className="h-4 bg-white/5 rounded w-3/4 mb-2" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="group cursor-pointer"
                onMouseEnter={() => setHoveredTrack(track.id)}
                onMouseLeave={() => setHoveredTrack(null)}
                onClick={() => handlePlayTrack(track)}
              >
                {/* Rank number */}
                <div className="mb-3">
                  <span className="text-white/30 text-lg font-bold">{track.position}</span>
                </div>

                {/* Album art */}
                <div className={`
                  relative aspect-square rounded-xl overflow-hidden
                  transition-all duration-500
                  ${hoveredTrack === track.id ? 'scale-105 shadow-2xl shadow-black/60' : 'shadow-lg shadow-black/40'}
                `}>
                  <img
                    src={track.image}
                    alt={track.title}
                    className={`
                      w-full h-full object-cover transition-all duration-500
                      ${hoveredTrack === track.id ? 'scale-110 brightness-75' : ''}
                    `}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80';
                    }}
                  />
                  
                  {/* Play button overlay */}
                  <div className={`
                    absolute bottom-3 left-3 
                    transition-all duration-300
                    ${hoveredTrack === track.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
                  `}>
                    <Button
                      size="icon"
                      className="w-10 h-10 rounded-full bg-white/90 text-black hover:bg-white hover:scale-110 transition-all shadow-xl"
                    >
                      <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                    </Button>
                  </div>
                </div>

                {/* Track info */}
                <div className="mt-3">
                  <h3 className={`
                    font-bold text-sm truncate transition-colors
                    ${hoveredTrack === track.id ? 'text-white' : 'text-white/80'}
                  `}>
                    {track.title}
                  </h3>
                  <p className="text-white/40 text-xs truncate mt-0.5">
                    {track.artist}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
