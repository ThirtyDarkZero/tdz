import { Music, Radio, Zap, Coffee, Moon, Sunrise, Heart, Dumbbell } from "lucide-react";

const GENRE_CARDS = [
  { id: 'hip-hop', name: 'Hip-Hop', color: 'from-orange-500/20 to-red-500/20', textColor: 'text-orange-400' },
  { id: 'r-b', name: 'R&B', color: 'from-purple-500/20 to-pink-500/20', textColor: 'text-purple-400' },
  { id: 'pop', name: 'Pop', color: 'from-pink-500/20 to-rose-500/20', textColor: 'text-pink-400' },
  { id: 'electronic', name: 'Electronic', color: 'from-cyan-500/20 to-blue-500/20', textColor: 'text-cyan-400' },
  { id: 'rock', name: 'Rock', color: 'from-red-500/20 to-orange-500/20', textColor: 'text-red-400' },
  { id: 'jazz', name: 'Jazz', color: 'from-amber-500/20 to-yellow-500/20', textColor: 'text-amber-400' },
];

const MOOD_CARDS = [
  { id: 'energetic', name: 'Energetic', icon: Zap, color: 'from-yellow-500/20 to-orange-500/20' },
  { id: 'chill', name: 'Chill', icon: Coffee, color: 'from-teal-500/20 to-cyan-500/20' },
  { id: 'focus', name: 'Focus', icon: Radio, color: 'from-indigo-500/20 to-purple-500/20' },
  { id: 'sleep', name: 'Sleep', icon: Moon, color: 'from-slate-500/20 to-blue-500/20' },
  { id: 'morning', name: 'Morning', icon: Sunrise, color: 'from-orange-500/20 to-yellow-500/20' },
  { id: 'workout', name: 'Workout', icon: Dumbbell, color: 'from-red-500/20 to-pink-500/20' },
];

interface MinimalGenreSectionProps {
  onGenreSelect: (genre: string) => void;
}

export function MinimalGenreSection({ onGenreSelect }: MinimalGenreSectionProps) {
  return (
    <div className="space-y-8">
      {/* Genres */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Browse by Genre</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {GENRE_CARDS.map((genre) => (
            <button
              key={genre.id}
              onClick={() => onGenreSelect(genre.id)}
              className={`
                relative p-4 rounded-xl bg-gradient-to-br ${genre.color}
                border border-white/5 hover:border-white/10
                transition-all duration-200 hover:scale-[1.02]
                group
              `}
            >
              <span className={`font-semibold text-sm ${genre.textColor}`}>
                {genre.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Moods */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Browse by Mood</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {MOOD_CARDS.map((mood) => (
            <button
              key={mood.id}
              onClick={() => onGenreSelect(mood.id)}
              className={`
                relative p-4 rounded-xl bg-gradient-to-br ${mood.color}
                border border-white/5 hover:border-white/10
                transition-all duration-200 hover:scale-[1.02]
                flex flex-col items-center gap-2
              `}
            >
              <mood.icon className="w-5 h-5 text-white/70" />
              <span className="font-semibold text-sm text-white/90">
                {mood.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
