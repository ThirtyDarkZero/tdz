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
  Sliders,
  Headphones
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
      case "Analytics Dashboard":
        return (
          <div className="space-y-3">
            {/* Interactive Metric Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1">
              {["Overview", "Platforms", "Growth"].map((tab, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveView(idx)}
                  className={`px-2 py-1 rounded-full text-[8px] font-medium whitespace-nowrap transition-all ${
                    activeView === idx 
                      ? 'bg-primary text-primary-foreground shadow-lg scale-105' 
                      : 'bg-muted/50 hover:bg-muted'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Dynamic Content Based on Active View */}
            {activeView === 0 && (
              <div className="space-y-2 animate-fade-in">
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Total Streams", value: animatedStats.streams.toLocaleString(), icon: Play, color: "from-primary/30 to-secondary/30" },
                    { label: "Revenue", value: `$${animatedStats.revenue}`, icon: DollarSign, color: "from-green-500/30 to-emerald-500/30" },
                    { label: "Tracks", value: animatedStats.tracks, icon: Music, color: "from-blue-500/30 to-cyan-500/30" },
                    { label: "Listeners", value: animatedStats.listeners.toLocaleString(), icon: Users, color: "from-purple-500/30 to-pink-500/30" }
                  ].map((metric, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedMetric(idx)}
                      className={`glass-card p-2 rounded-lg text-left transition-all hover:scale-105 ${
                        selectedMetric === idx ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[9px] text-muted-foreground">{metric.label}</p>
                        <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${metric.color} flex items-center justify-center`}>
                          <metric.icon className="w-3 h-3" />
                        </div>
                      </div>
                      <p className="text-lg font-black">{metric.value}</p>
                      <div className="h-1 bg-muted rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000" style={{ width: `${75 + Math.random() * 25}%` }} />
                      </div>
                    </button>
                  ))}
                </div>

                {/* Quick Stats */}
                <div className="glass-card p-2 rounded-lg">
                  <div className="flex items-center justify-between text-[9px] mb-1">
                    <span className="text-muted-foreground">Today's Performance</span>
                    <Badge className="text-[7px] px-1 py-0 bg-green-500/20 text-green-500">+18%</Badge>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 text-center">
                      <p className="text-xs font-bold">+2.4K</p>
                      <p className="text-[7px] text-muted-foreground">Streams</p>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div className="flex-1 text-center">
                      <p className="text-xs font-bold">+127</p>
                      <p className="text-[7px] text-muted-foreground">Fans</p>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div className="flex-1 text-center">
                      <p className="text-xs font-bold text-green-500">+$9.60</p>
                      <p className="text-[7px] text-muted-foreground">Revenue</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeView === 1 && (
              <div className="space-y-2 animate-fade-in">
                <div className="glass-card p-3 rounded-lg">
                  <h4 className="text-[10px] font-semibold mb-2 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    <span>Platform Distribution</span>
                  </h4>
                  <div className="space-y-2">
                    {[
                      { name: "Spotify", pct: 45, color: "from-green-500 to-emerald-500", streams: "57.4K" },
                      { name: "Apple Music", pct: 25, color: "from-pink-500 to-red-500", streams: "31.9K" },
                      { name: "YouTube", pct: 15, color: "from-red-500 to-orange-500", streams: "19.1K" },
                      { name: "Amazon", pct: 10, color: "from-blue-500 to-cyan-500", streams: "12.8K" },
                      { name: "Others", pct: 5, color: "from-purple-500 to-pink-500", streams: "6.4K" }
                    ].map((platform, idx) => (
                      <button
                        key={idx}
                        className="w-full text-left hover:scale-105 transition-transform"
                        onClick={() => setSelectedMetric(idx)}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[9px] font-medium">{platform.name}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[8px] text-muted-foreground">{platform.streams}</span>
                            <span className="text-[9px] font-bold">{platform.pct}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${platform.color} rounded-full transition-all duration-500`}
                            style={{ width: selectedMetric === idx ? `${platform.pct}%` : '0%' }}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeView === 2 && (
              <div className="space-y-2 animate-fade-in">
                <div className="glass-card p-3 rounded-lg">
                  <h4 className="text-[10px] font-semibold mb-2 flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    <span>Growth Over Time</span>
                  </h4>
                  <div className="space-y-2">
                    {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, idx) => {
                      const height = 10 + (idx * 8);
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedMetric(idx)}
                          className="w-full text-left hover:bg-accent/20 rounded p-1 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-medium w-8">{month}</span>
                            <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-primary to-accent rounded transition-all duration-500"
                                style={{ width: selectedMetric === idx ? '100%' : `${height * 1.5}%` }}
                              />
                            </div>
                            <span className="text-[9px] font-bold">{Math.floor(animatedStats.streams * (0.1 + idx * 0.15)).toLocaleString()}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case "Music Library":
        return (
          <div className="space-y-2">
            {/* Interactive Search */}
            <button 
              onClick={() => setActiveView(activeView === 0 ? 1 : 0)}
              className="w-full flex items-center gap-2 bg-muted/50 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors"
            >
              <Search className="w-3 h-3 text-muted-foreground" />
              <span className="text-[9px] text-muted-foreground">
                {activeView === 1 ? "Type to search..." : "Search tracks..."}
              </span>
            </button>
            
            {/* Interactive Tab Pills */}
            <div className="flex gap-1 overflow-x-auto pb-1">
              {["Published", "Unpublished", "Albums", "Liked"].map((tab, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveView(idx)}
                  className={`px-2 py-1 rounded-full text-[8px] font-medium whitespace-nowrap transition-all ${
                    activeView === idx 
                      ? 'bg-primary text-primary-foreground shadow-lg scale-105' 
                      : 'bg-muted/50 hover:bg-muted'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Track List with Play/Pause */}
            <div className="space-y-1.5 animate-fade-in">
              {[
                { title: "Summer Nights", artist: "Your Name", plays: "45.2K", time: "3:24", published: true },
                { title: "Electric Dreams", artist: "Your Name", plays: "32.8K", time: "4:01", published: true },
                { title: "Midnight Drive", artist: "Your Name", plays: "28.4K", time: "3:47", published: activeView !== 1 },
                { title: "Neon Lights", artist: "Your Name", plays: "21.1K", time: "3:15", published: true },
                { title: "Urban Pulse", artist: "Your Name", plays: "18.7K", time: "3:33", published: activeView !== 1 }
              ].filter(track => activeView === 1 ? !track.published : track.published).slice(0, 4).map((track, idx) => (
                <button
                  key={idx}
                  onClick={() => setPlayingTrack(playingTrack === idx ? null : idx)}
                  className={`w-full flex items-center gap-2 p-1.5 rounded transition-all ${
                    playingTrack === idx 
                      ? 'bg-primary/20 scale-105 shadow-lg' 
                      : 'hover:bg-accent/30'
                  } group`}
                >
                  <div className="relative">
                    <span className="text-[9px] text-muted-foreground w-3 block group-hover:opacity-0 transition-opacity">
                      {idx + 1}
                    </span>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {playingTrack === idx ? (
                        <Pause className="w-3 h-3 text-primary" />
                      ) : (
                        <Play className="w-3 h-3 text-primary" />
                      )}
                    </div>
                  </div>
                  
                  <div className={`w-9 h-9 rounded overflow-hidden flex-shrink-0 transition-all ${
                    playingTrack === idx ? 'ring-2 ring-primary' : ''
                  }`}>
                    <div className="w-full h-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center">
                      {playingTrack === idx ? (
                        <div className="flex gap-0.5">
                          <div className="w-0.5 h-3 bg-primary animate-pulse" style={{ animationDelay: '0ms' }} />
                          <div className="w-0.5 h-4 bg-primary animate-pulse" style={{ animationDelay: '150ms' }} />
                          <div className="w-0.5 h-2 bg-primary animate-pulse" style={{ animationDelay: '300ms' }} />
                        </div>
                      ) : (
                        <Music className="w-4 h-4 text-primary/60" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[10px] font-semibold truncate">{track.title}</p>
                    <p className="text-[8px] text-muted-foreground truncate">{track.artist}</p>
                  </div>
                  
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[8px] text-muted-foreground">{track.time}</span>
                    {activeView !== 1 && (
                      <Badge className="text-[7px] px-1 py-0 bg-accent/20">{track.plays}</Badge>
                    )}
                  </div>
                  
                  <button 
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <MoreVertical className="w-3 h-3" />
                  </button>
                </button>
              ))}
            </div>

            {/* Interactive Stats Footer */}
            <div className="glass-card p-2 rounded-lg mt-2">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-[8px] text-muted-foreground mb-1">
                    {activeView === 1 ? "Unpublished Tracks" : "Total Performance"}
                  </p>
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-xs font-black">
                        {activeView === 1 ? "3" : "127.5K"}
                      </p>
                      <p className="text-[7px] text-muted-foreground">
                        {activeView === 1 ? "Tracks" : "Plays"}
                      </p>
                    </div>
                    {activeView !== 1 && (
                      <>
                        <div className="h-6 w-px bg-border" />
                        <div>
                          <p className="text-xs font-black text-green-500">$510</p>
                          <p className="text-[7px] text-muted-foreground">Revenue</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setPlayingTrack(null)}
                  className="px-2 py-1 bg-primary/10 hover:bg-primary/20 rounded text-[8px] font-medium transition-colors"
                >
                  {playingTrack !== null ? "Stop All" : "Play All"}
                </button>
              </div>
            </div>
          </div>
        );
      case "Canvas Manager":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Film className="w-4 h-4 text-primary" />
              <div>
                <h3 className="text-[10px] font-bold">Canvas Manager</h3>
                <p className="text-[8px] text-muted-foreground">Looping visual art (3-8 sec)</p>
              </div>
            </div>

            {/* Interactive Track List with Canvas */}
            <div className="space-y-1.5">
              {[
                { title: "Summer Nights", artist: "Your Name", hasCanvas: true },
                { title: "Electric Dreams", artist: "Your Name", hasCanvas: true },
                { title: "Midnight Drive", artist: "Your Name", hasCanvas: false }
              ].map((track, idx) => {
                const isSelected = selectedMetric === idx;
                const hasCanvas = track.hasCanvas || isSelected;
                const isUploading = isSelected && activeView === 1;
                
                return (
                  <div 
                    key={idx}
                    className={`glass-card p-1.5 rounded-lg transition-all ${
                      isSelected ? 'ring-2 ring-primary shadow-lg' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <button
                        onClick={() => setSelectedMetric(idx)}
                        className="relative w-10 h-10 rounded overflow-hidden bg-gradient-to-br from-primary/30 to-accent/30 flex-shrink-0 hover:scale-110 transition-transform"
                      >
                        {hasCanvas ? (
                          <div className="w-full h-full flex items-center justify-center relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-accent/40 to-secondary/40 animate-pulse" />
                            <Film className="w-4 h-4 text-primary relative z-10" />
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary/50">
                              <div className="h-full bg-primary animate-[slide_2s_ease-in-out_infinite]" style={{ width: '30%' }} />
                            </div>
                          </div>
                        ) : (
                          <Film className="w-3 h-3 text-muted-foreground" />
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-semibold truncate">{track.title}</p>
                        <p className="text-[7px] text-muted-foreground truncate">{track.artist}</p>
                      </div>
                      
                      {hasCanvas && !isUploading && (
                        <Badge className="bg-primary/20 text-primary text-[6px] px-1 py-0 animate-fade-in">
                          Active
                        </Badge>
                      )}
                    </div>
                    
                    {isUploading && (
                      <div className="mb-1">
                        <div className="h-0.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000"
                            style={{ width: '75%' }}
                          />
                        </div>
                        <p className="text-[6px] text-primary mt-0.5">Uploading... 75%</p>
                      </div>
                    )}
                    
                    <div className="flex gap-1">
                      <button 
                        onClick={() => {
                          setSelectedMetric(idx);
                          setActiveView(1);
                          setTimeout(() => setActiveView(0), 2000);
                        }}
                        disabled={isUploading}
                        className="flex-1 text-[8px] py-1 px-1.5 rounded font-medium transition-all bg-primary/10 hover:bg-primary/20"
                      >
                        {isUploading ? "..." : hasCanvas ? "Replace" : "Upload"}
                      </button>
                      
                      {hasCanvas && !isUploading && (
                        <button 
                          onClick={() => selectedMetric === idx && setSelectedMetric(-1)}
                          className="text-[8px] py-1 px-1.5 bg-muted/50 hover:bg-destructive/20 rounded transition-all"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stats Summary */}
            <div className="glass-card p-1.5 rounded-lg mt-2">
              <div className="flex items-center justify-between text-[8px]">
                <div>
                  <p className="text-muted-foreground mb-0.5">Canvas Active</p>
                  <p className="font-black">2 of 3 tracks</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground mb-0.5">Engagement</p>
                  <p className="font-black text-accent">+47%</p>
                </div>
              </div>
            </div>
          </div>
        );
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
      
      case "Now Playing":
        return (
          <div className="space-y-3">
            {/* Album Art with Motion Effect */}
            <div className="relative aspect-square w-full rounded-xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/60 via-accent/60 to-secondary/60 animate-pulse">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Music className="w-20 h-20 text-white/40" />
                </div>
              </div>
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className={`w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
                    isLiked ? 'bg-red-500/80 text-white' : 'bg-black/40 text-white/80'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            {/* Track Info */}
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black truncate">Midnight Drive</h3>
              <p className="text-sm text-muted-foreground truncate">Your Name • Electric Dreams EP</p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden cursor-pointer">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                  style={{ width: `${(currentTime / 204) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                <span>{Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')}</span>
                <span>3:24</span>
              </div>
            </div>

            {/* Main Controls */}
            <div className="flex items-center justify-center gap-4 py-2">
              <button
                onClick={() => setShuffle(!shuffle)}
                className={`transition-colors ${shuffle ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Shuffle className="w-5 h-5" />
              </button>
              <button className="text-foreground hover:text-primary transition-colors">
                <SkipBack className="w-6 h-6" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-14 h-14 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 text-white" />
                ) : (
                  <Play className="w-7 h-7 text-white ml-1" />
                )}
              </button>
              <button className="text-foreground hover:text-primary transition-colors">
                <SkipForward className="w-6 h-6" />
              </button>
              <button
                onClick={() => setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off')}
                className={`transition-colors relative ${repeat !== 'off' ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Repeat className="w-5 h-5" />
                {repeat === 'one' && (
                  <span className="absolute -top-1 -right-1 text-[8px] font-bold">1</span>
                )}
              </button>
            </div>

            {/* Additional Controls */}
            <div className="flex items-center justify-between px-2">
              <button
                onClick={() => setShowEqualizer(!showEqualizer)}
                className={`transition-colors ${showEqualizer ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Sliders className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-muted-foreground">Quality:</span>
                <Badge className="text-[7px] px-1.5 py-0.5 bg-primary/20 text-primary">HD</Badge>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="glass-card p-2 rounded-lg">
              <div className="flex items-center justify-between text-[9px]">
                <div className="flex items-center gap-1">
                  <Play className="w-3 h-3 text-primary" />
                  <span className="text-muted-foreground">45.2K plays</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-red-500" />
                  <span className="text-muted-foreground">12.8K likes</span>
                </div>
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
...
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
              title="Analytics Dashboard" 
              color="from-primary/50 to-accent/50"
            />
            <div className="text-center space-y-2 px-4">
              <h3 className="font-bold text-lg">Real-Time Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Track streams, revenue, and fan engagement across 150+ platforms with AI-powered insights
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <StudioPhoneMockup 
              title="Music Library" 
              color="from-accent/50 to-secondary/50"
            />
            <div className="text-center space-y-2 px-4">
              <h3 className="font-bold text-lg">Smart Music Library</h3>
              <p className="text-sm text-muted-foreground">
                Manage your entire catalog with AI-powered organization and instant distribution capabilities
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <StudioPhoneMockup 
              title="Canvas Manager" 
              color="from-secondary/50 to-primary/50"
            />
            <div className="text-center space-y-2 px-4">
              <h3 className="font-bold text-lg">Visual Canvas</h3>
              <p className="text-sm text-muted-foreground">
                Add looping visual art to tracks like Spotify Canvas. Professional motion covers in seconds
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

export function MusicPlayerPhoneMockups() {
  return (
    <section className="py-16 px-4 md:px-6 bg-gradient-to-b from-background via-accent/5 to-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--accent)/0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,hsl(var(--secondary)/0.1),transparent_50%)]" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 mb-4">
            <Headphones className="w-4 h-4 mr-2 inline" />
            TDZ Distribution
          </Badge>
          <h2 className="text-4xl md:text-5xl font-display font-black mb-4">
            Immersive Music Experience
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Next-generation music player with advanced features. Experience studio-quality sound with interactive visualizations and smart controls.
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
            <span className="text-sm font-semibold">Start listening now</span>
            <ChevronRight className="w-4 h-4 text-primary" />
          </div>
        </div>
      </div>
    </section>
  );
}
