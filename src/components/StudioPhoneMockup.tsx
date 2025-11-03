import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Music, 
  LayoutDashboard, 
  Video,
  Users,
  Heart,
  Star,
  Play,
  ChevronRight,
  Film,
  Search,
  MoreVertical,
  MoreHorizontal,
  Pause,
  Upload,
  Check,
  BarChart3,
  DollarSign,
  Activity,
  Globe,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Mic,
  Sliders
} from "lucide-react";

interface PhoneMockupProps {
  title: string;
  color: string;
}

export function StudioPhoneMockup({ title, color }: PhoneMockupProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [activeView, setActiveView] = useState(0);
  const [playingTrack, setPlayingTrack] = useState<number | null>(null);
  const [selectedMetric, setSelectedMetric] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'off' | 'all' | 'one'>('off');
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(87);
  const [animatedStats, setAnimatedStats] = useState({
    streams: 0,
    revenue: 0,
    tracks: 0,
    listeners: 0
  });

  // Simulate time progression
  useEffect(() => {
    if (isPlaying && (title === "Now Playing" || title === "Audio Visualizer")) {
      const timer = setInterval(() => {
        setCurrentTime(prev => (prev + 1) % 204);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isPlaying, title]);

  // Animate stats on mount
  useEffect(() => {
    if (title === "Analytics Dashboard") {
      const targets = { streams: 127500, revenue: 510, tracks: 24, listeners: 89200 };
      const duration = 2000;
      const steps = 60;
      const interval = duration / steps;
      
      let step = 0;
      const timer = setInterval(() => {
        step++;
        setAnimatedStats({
          streams: Math.floor((targets.streams / steps) * step),
          revenue: Math.floor((targets.revenue / steps) * step),
          tracks: Math.floor((targets.tracks / steps) * step),
          listeners: Math.floor((targets.listeners / steps) * step)
        });
        
        if (step >= steps) clearInterval(timer);
      }, interval);
      
      return () => clearInterval(timer);
    }
  }, [title]);

  const getContent = () => {
    switch(title) {
      case "Now Playing":
        return (
          <div className="space-y-3">
            {/* Album Art with Motion Cover Simulation */}
            <div className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-primary/30 to-secondary/30 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 animate-pulse" style={{ animationDuration: '3s' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Music className="w-12 h-12 text-primary/60 mx-auto mb-2" />
                  <p className="text-[10px] font-bold">Summer Nights</p>
                  <p className="text-[8px] text-muted-foreground">Your Name</p>
                </div>
              </div>
              {/* Floating particles effect */}
              <div className="absolute top-2 left-2 w-1 h-1 bg-primary rounded-full animate-pulse" />
              <div className="absolute top-4 right-3 w-1.5 h-1.5 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
              <div className="absolute bottom-3 left-4 w-1 h-1 bg-secondary rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Song Info */}
            <div className="text-center px-2">
              <h3 className="text-sm font-bold truncate">Summer Nights</h3>
              <p className="text-[10px] text-muted-foreground truncate">Your Name • Electronic</p>
            </div>

            {/* Interactive Progress Bar */}
            <div className="space-y-1">
              <div className="relative h-1 bg-muted rounded-full overflow-hidden cursor-pointer hover:h-1.5 transition-all group">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300"
                  style={{ width: `${(currentTime / 204) * 100}%` }}
                />
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `${(currentTime / 204) * 100}%`, marginLeft: '-4px' }}
                />
              </div>
              <div className="flex justify-between text-[8px] text-muted-foreground px-1">
                <span>{Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')}</span>
                <span>3:24</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-4 py-2">
              <button 
                onClick={() => setShuffle(!shuffle)}
                className={`transition-all hover:scale-110 ${shuffle ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>
              <button className="transition-all hover:scale-110 text-muted-foreground">
                <SkipBack className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg flex items-center justify-center hover:scale-110 transition-all"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button className="transition-all hover:scale-110 text-muted-foreground">
                <SkipForward className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off')}
                className={`transition-all hover:scale-110 ${repeat !== 'off' ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Repeat className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Interactive Action Buttons */}
            <div className="flex items-center justify-around pt-2 border-t border-border/50">
              <button 
                onClick={() => setIsLiked(!isLiked)}
                className={`transition-all hover:scale-110 ${isLiked ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              </button>
              <button className="transition-all hover:scale-110 text-muted-foreground">
                <Mic className="w-4 h-4" />
              </button>
              <button className="transition-all hover:scale-110 text-muted-foreground">
                <Sliders className="w-4 h-4" />
              </button>
              <button className="transition-all hover:scale-110 text-muted-foreground">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      
      case "Audio Visualizer":
        return (
          <div className="space-y-3">
            {/* Compact Track Info */}
            <div className="flex items-center gap-2 glass-card p-2 rounded-lg">
              <div className="w-10 h-10 rounded bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center flex-shrink-0">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold truncate">Electric Dreams</p>
                <p className="text-[8px] text-muted-foreground truncate">Your Name</p>
              </div>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Waveform Visualizer */}
            <div className="glass-card p-3 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-semibold">Audio Visualizer</span>
                <Badge className="text-[7px] px-1.5 py-0.5 bg-primary/20 text-primary">Live</Badge>
              </div>
              <div className="h-24 flex items-end justify-around gap-0.5">
                {Array.from({ length: 40 }).map((_, idx) => {
                  const height = isPlaying 
                    ? 10 + Math.sin((currentTime + idx) * 0.5) * 40 + Math.random() * 20
                    : 10 + Math.random() * 15;
                  return (
                    <div 
                      key={idx} 
                      className="flex-1 bg-gradient-to-t from-primary via-accent to-primary-glow rounded-t transition-all duration-150"
                      style={{ 
                        height: `${height}%`,
                        opacity: 0.6 + (height / 100) * 0.4
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Interactive Equalizer Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-semibold">Equalizer Presets</span>
                <button 
                  onClick={() => setShowEqualizer(!showEqualizer)}
                  className="text-[8px] text-primary hover:underline"
                >
                  {showEqualizer ? 'Hide' : 'Show'}
                </button>
              </div>
              {showEqualizer && (
                <div className="grid grid-cols-3 gap-1.5 animate-fade-in">
                  {["Bass Boost", "Rock", "Pop", "Jazz", "Classical", "Hip Hop"].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedMetric(idx)}
                      className={`glass-card p-1.5 rounded text-[8px] font-medium transition-all hover:scale-105 ${
                        selectedMetric === idx 
                          ? 'bg-primary/20 ring-1 ring-primary text-primary' 
                          : 'text-muted-foreground'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Equalizer Sliders */}
            <div className="glass-card p-2 rounded-lg space-y-2">
              <span className="text-[9px] font-semibold">Custom EQ</span>
              <div className="flex items-end justify-around gap-1 h-16">
                {["60", "230", "910", "3.6k", "14k"].map((freq, idx) => {
                  const height = 30 + (selectedMetric === idx ? 40 : Math.random() * 30);
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedMetric(idx)}
                      className="flex-1 flex flex-col items-center gap-1 group"
                    >
                      <div className="w-full bg-muted/50 rounded-t overflow-hidden">
                        <div 
                          className="w-full bg-gradient-to-t from-primary to-accent rounded-t transition-all duration-300 group-hover:from-accent group-hover:to-primary"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <span className="text-[7px] text-muted-foreground">{freq}Hz</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Playback Speed */}
            <div className="glass-card p-2 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-semibold">Playback Speed</span>
                <span className="text-[9px] text-primary font-bold">{playbackRate}x</span>
              </div>
              <div className="flex gap-1">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setPlaybackRate(rate)}
                    className={`flex-1 py-1 rounded text-[8px] font-medium transition-all ${
                      playbackRate === rate
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      
      case "Queue & Lyrics":
        return (
          <div className="space-y-2">
            {/* Tab Switcher */}
            <div className="flex gap-1">
              {["Queue", "Lyrics"].map((tab, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveView(idx)}
                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-semibold transition-all ${
                    activeView === idx 
                      ? 'bg-primary text-primary-foreground shadow-lg' 
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeView === 0 ? (
              <div className="space-y-2 animate-fade-in">
                {/* Now Playing */}
                <div className="glass-card p-2 rounded-lg border-l-2 border-primary">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center flex-shrink-0">
                      <div className="flex gap-0.5">
                        <div className="w-0.5 h-4 bg-primary animate-pulse" />
                        <div className="w-0.5 h-5 bg-primary animate-pulse" style={{ animationDelay: '0.2s' }} />
                        <div className="w-0.5 h-3 bg-primary animate-pulse" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold truncate">Midnight Drive</p>
                      <p className="text-[8px] text-muted-foreground truncate">Your Name • 3:47</p>
                    </div>
                    <Badge className="text-[7px] px-1.5 py-0.5 bg-primary/20 text-primary">Now</Badge>
                  </div>
                </div>

                {/* Up Next */}
                <div>
                  <div className="flex items-center justify-between px-1 mb-1">
                    <span className="text-[9px] font-semibold text-muted-foreground">Up Next</span>
                    <span className="text-[8px] text-muted-foreground">5 tracks</span>
                  </div>
                  <div className="space-y-1">
                    {[
                      { title: "Neon Lights", artist: "Your Name", time: "3:15" },
                      { title: "Urban Pulse", artist: "Your Name", time: "3:33" },
                      { title: "Starlight", artist: "Featured Artist", time: "4:12" },
                      { title: "Ocean Waves", artist: "Your Name", time: "3:56" }
                    ].map((track, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPlayingTrack(playingTrack === idx ? null : idx)}
                        className={`w-full flex items-center gap-2 p-1.5 rounded transition-all ${
                          playingTrack === idx 
                            ? 'glass-card scale-105' 
                            : 'hover:bg-accent/20'
                        } group`}
                      >
                        <span className="text-[9px] text-muted-foreground w-4">{idx + 1}</span>
                        <div className="w-8 h-8 rounded bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                          <Music className="w-3 h-3 text-primary/60" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-[9px] font-medium truncate">{track.title}</p>
                          <p className="text-[7px] text-muted-foreground truncate">{track.artist}</p>
                        </div>
                        <span className="text-[8px] text-muted-foreground">{track.time}</span>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-3 h-3" />
                        </button>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Queue Actions */}
                <div className="flex gap-1.5 pt-1">
                  <button className="flex-1 glass-card py-1.5 rounded text-[8px] font-medium hover:bg-accent/20 transition-colors">
                    Clear Queue
                  </button>
                  <button className="flex-1 glass-card py-1.5 rounded text-[8px] font-medium hover:bg-accent/20 transition-colors">
                    Save as Playlist
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 animate-fade-in">
                {/* Lyrics Header */}
                <div className="glass-card p-2 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[9px] font-semibold">Synced Lyrics</span>
                    </div>
                    <Badge className="text-[7px] px-1.5 py-0.5 bg-green-500/20 text-green-500">Live</Badge>
                  </div>
                  <p className="text-[8px] text-muted-foreground">Midnight Drive • Your Name</p>
                </div>

                {/* Scrollable Lyrics */}
                <div className="glass-card p-2 rounded-lg h-48 overflow-y-auto space-y-2 scroll-smooth">
                  {[
                    { time: "0:15", text: "Driving through the city lights", active: false },
                    { time: "0:20", text: "Stars are shining bright tonight", active: false },
                    { time: "0:25", text: "Feel the rhythm, feel alive", active: true },
                    { time: "0:30", text: "On this endless midnight drive", active: false },
                    { time: "0:45", text: "Music flowing through my soul", active: false },
                    { time: "0:50", text: "Lost in sound, I'm in control", active: false },
                    { time: "1:00", text: "Every beat tells a story", active: false },
                    { time: "1:05", text: "In this moment, feel the glory", active: false }
                  ].map((line, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedMetric(idx)}
                      className={`w-full text-left p-1.5 rounded transition-all ${
                        line.active || selectedMetric === idx
                          ? 'bg-primary/20 scale-105' 
                          : 'hover:bg-accent/10'
                      }`}
                    >
                      <p className={`text-[10px] leading-relaxed ${
                        line.active || selectedMetric === idx
                          ? 'text-foreground font-bold' 
                          : 'text-muted-foreground'
                      }`}>
                        {line.text}
                      </p>
                      <span className="text-[7px] text-muted-foreground">{line.time}</span>
                    </button>
                  ))}
                </div>

                {/* Lyrics Actions */}
                <div className="flex gap-1.5">
                  <button className="flex-1 glass-card py-1.5 rounded text-[8px] font-medium hover:bg-accent/20 transition-colors">
                    Share Lyrics
                  </button>
                  <button className="flex-1 glass-card py-1.5 rounded text-[8px] font-medium hover:bg-accent/20 transition-colors">
                    Full Screen
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative group">
      {/* Phone frame */}
      <div className="relative w-[280px] mx-auto">
        {/* Phone body */}
        <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-[40px] p-3 shadow-2xl">
          {/* Screen */}
          <div className="bg-background rounded-[32px] overflow-hidden shadow-inner">
            {/* Status bar */}
            <div className="bg-background/95 backdrop-blur px-6 py-2 flex items-center justify-between border-b border-border/50">
              <span className="text-[10px] font-semibold">9:41</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-2 bg-primary/30 rounded-sm"></div>
                <div className="w-4 h-2 bg-primary/50 rounded-sm"></div>
                <div className="w-4 h-2 bg-primary rounded-sm"></div>
              </div>
            </div>

            {/* App header */}
            <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 px-4 py-3 border-b border-border/50">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-black">TDZ Studio</div>
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="w-3 h-3 text-primary" />
                </div>
              </div>
              <div className="text-xs font-semibold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                {title}
              </div>
            </div>

            {/* Content area */}
            <div className="px-4 py-4 min-h-[420px]">
              {getContent()}
            </div>

            {/* Bottom navigation */}
            <div className="bg-background/95 backdrop-blur border-t border-border/50 px-6 py-3">
              <div className="flex items-center justify-around">
                {[LayoutDashboard, Music, Video, Heart, Star].map((Icon, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTab(i)}
                    className={`transition-colors ${
                      activeTab === i ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Home indicator */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-600 rounded-full"></div>
        </div>

        {/* Glow effect */}
        <div className={`absolute inset-0 -z-10 bg-gradient-to-br ${color} blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 rounded-[40px]`}></div>
      </div>
    </div>
  );
}

export function StudioPhoneMockups() {
  return (
    <section className="py-16 px-4 md:px-6 bg-gradient-to-b from-background via-primary/5 to-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,hsl(var(--accent)/0.1),transparent_50%)]" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <Badge className="bg-accent/10 text-accent border-accent/20 px-4 py-2 mb-4">
            <LayoutDashboard className="w-4 h-4 mr-2 inline" />
            Live Platform Preview
          </Badge>
          <h2 className="text-4xl md:text-5xl font-display font-black mb-4">
            Experience the Studio
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Interactive demos of our revolutionary platform. Click and explore the features that are transforming the music industry.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          <div className="space-y-4">
            <StudioPhoneMockup 
              title="Now Playing" 
              color="from-primary/50 to-accent/50"
            />
            <div className="text-center space-y-2 px-4">
              <h3 className="font-bold text-lg">Immersive Now Playing</h3>
              <p className="text-sm text-muted-foreground">
                Experience your music with motion covers, advanced playback controls, and real-time interactions
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <StudioPhoneMockup 
              title="Audio Visualizer" 
              color="from-accent/50 to-secondary/50"
            />
            <div className="text-center space-y-2 px-4">
              <h3 className="font-bold text-lg">Live Audio Visualizer</h3>
              <p className="text-sm text-muted-foreground">
                Real-time waveform visualization, custom equalizer presets, and dynamic playback speed control
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <StudioPhoneMockup 
              title="Queue & Lyrics" 
              color="from-secondary/50 to-primary/50"
            />
            <div className="text-center space-y-2 px-4">
              <h3 className="font-bold text-lg">Smart Queue & Lyrics</h3>
              <p className="text-sm text-muted-foreground">
                Manage your queue effortlessly and follow along with time-synced, interactive lyrics
              </p>
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 px-6 py-3 rounded-full border border-primary/20">
            <span className="text-sm font-semibold">Try it yourself</span>
            <ChevronRight className="w-4 h-4 text-primary" />
          </div>
        </div>
      </div>
    </section>
  );
}
