import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Shuffle } from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";

interface MinimalHeroProps {
  tracks: any[];
  featuredTrack?: any;
}

export function MinimalHero({ tracks, featuredTrack }: MinimalHeroProps) {
  const navigate = useNavigate();
  const { playTrack } = usePlayer();
  
  const heroTrack = featuredTrack || tracks[0];
  const hasContent = tracks.length > 0;

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks);
    }
  };

  const handleShuffle = () => {
    if (tracks.length > 0) {
      const shuffled = [...tracks].sort(() => Math.random() - 0.5);
      playTrack(shuffled[0], shuffled);
    }
  };

  return (
    <div className="relative w-full h-[50vh] min-h-[400px] max-h-[600px] -mx-4 sm:-mx-6 lg:-mx-8 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        {heroTrack?.album_cover_path ? (
          <img
            src={`https://rcjzvfskkoqygnlolrcs.supabase.co/storage/v1/object/public/${heroTrack.album_cover_bucket || 'album-covers'}/${heroTrack.album_cover_path}`}
            alt=""
            className="w-full h-full object-cover opacity-30"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cyan-900/30 to-purple-900/30" />
        )}
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-2xl">
          {/* Label */}
          <p className="text-cyan-400 font-medium mb-2 uppercase tracking-wider text-sm">
            TDZ Streaming
          </p>
          
          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
            Discover<br />New Music
          </h1>
          
          {/* Description */}
          <p className="text-white/60 text-lg mb-8 max-w-lg">
            Stream unlimited music from independent artists. Support creators directly with every play.
          </p>

          {/* Actions */}
          {hasContent && (
            <div className="flex items-center gap-4">
              <Button
                onClick={handlePlayAll}
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8 py-6 text-base rounded-full"
              >
                <Play className="w-5 h-5 mr-2" fill="currentColor" />
                Play All
              </Button>
              
              <Button
                onClick={handleShuffle}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 hover:border-white/40 px-6 py-6 rounded-full"
              >
                <Shuffle className="w-5 h-5 mr-2" />
                Shuffle
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
