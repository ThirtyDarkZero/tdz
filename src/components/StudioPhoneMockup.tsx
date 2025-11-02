import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Film
} from "lucide-react";

interface PhoneMockupProps {
  title: string;
  color: string;
}

export function StudioPhoneMockup({ title, color }: PhoneMockupProps) {
  const [activeTab, setActiveTab] = useState(0);

  const getContent = () => {
    switch(title) {
      case "Analytics Dashboard":
        return (
          <div className="space-y-3">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="glass-card p-2 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] text-muted-foreground">Total Streams</p>
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                    <Play className="w-3 h-3" />
                  </div>
                </div>
                <p className="text-lg font-black">127.5K</p>
                <p className="text-[8px] text-muted-foreground">All platforms</p>
              </div>
              <div className="glass-card p-2 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] text-muted-foreground">Revenue</p>
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-green-500/30 to-emerald-500/30 flex items-center justify-center">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  </div>
                </div>
                <p className="text-lg font-black text-green-500">$510</p>
                <p className="text-[8px] text-muted-foreground">100% yours</p>
              </div>
              <div className="glass-card p-2 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] text-muted-foreground">Tracks</p>
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500/30 to-cyan-500/30 flex items-center justify-center">
                    <Music className="w-3 h-3 text-blue-500" />
                  </div>
                </div>
                <p className="text-lg font-black">24</p>
                <p className="text-[8px] text-muted-foreground">Published</p>
              </div>
              <div className="glass-card p-2 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] text-muted-foreground">Listeners</p>
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                    <Users className="w-3 h-3 text-purple-500" />
                  </div>
                </div>
                <p className="text-lg font-black">89.2K</p>
                <p className="text-[8px] text-muted-foreground">Monthly</p>
              </div>
            </div>

            {/* Platform Breakdown */}
            <div className="glass-card p-3 rounded-lg">
              <h4 className="text-[10px] font-semibold mb-2 flex items-center gap-1">
                <span>Platform Distribution</span>
              </h4>
              <div className="space-y-2">
                {[
                  { name: "Spotify", pct: 45, color: "from-green-500 to-emerald-500" },
                  { name: "Apple Music", pct: 25, color: "from-pink-500 to-red-500" },
                  { name: "YouTube", pct: 15, color: "from-red-500 to-orange-500" },
                  { name: "Amazon", pct: 10, color: "from-blue-500 to-cyan-500" },
                  { name: "Others", pct: 5, color: "from-purple-500 to-pink-500" }
                ].map((platform, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[9px] font-medium">{platform.name}</span>
                      <span className="text-[9px] text-muted-foreground">{platform.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${platform.color} rounded-full`}
                        style={{ width: `${platform.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case "Music Library":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 bg-muted/50 rounded-lg px-2 py-1">
                <span className="text-[9px] text-muted-foreground">Search tracks...</span>
              </div>
            </div>
            
            {/* Tab Pills */}
            <div className="flex gap-1 mb-2 overflow-x-auto pb-1">
              {["Unpublished", "Published", "Albums", "Liked"].map((tab, idx) => (
                <div key={idx} className={`px-2 py-1 rounded-full text-[8px] font-medium whitespace-nowrap ${idx === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted/50'}`}>
                  {tab}
                </div>
              ))}
            </div>

            {/* Track List */}
            <div className="space-y-1.5">
              {[
                { title: "Summer Nights", artist: "Your Name", plays: "45.2K", time: "3:24" },
                { title: "Electric Dreams", artist: "Your Name", plays: "32.8K", time: "4:01" },
                { title: "Midnight Drive", artist: "Your Name", plays: "28.4K", time: "3:47" },
                { title: "Neon Lights", artist: "Your Name", plays: "21.1K", time: "3:15" }
              ].map((track, idx) => (
                <div key={idx} className="flex items-center gap-2 p-1.5 rounded hover:bg-accent/30 transition-colors group">
                  <span className="text-[9px] text-muted-foreground w-3">{idx + 1}</span>
                  <div className="w-9 h-9 bg-gradient-to-br from-primary/40 to-accent/40 rounded overflow-hidden flex-shrink-0">
                    <img src="/placeholder.svg" alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold truncate">{track.title}</p>
                    <p className="text-[8px] text-muted-foreground truncate">{track.artist}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[8px] text-muted-foreground hidden group-hover:inline">{track.time}</span>
                    <Play className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>

            {/* Stats Footer */}
            <div className="glass-card p-2 rounded-lg mt-2">
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-muted-foreground">Total Plays</span>
                <span className="font-black">127.5K</span>
              </div>
            </div>
          </div>
        );
      case "Canvas Manager":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Film className="w-4 h-4 text-primary" />
              <div>
                <h3 className="text-[10px] font-bold">Canvas Manager</h3>
                <p className="text-[8px] text-muted-foreground">Looping visual art (3-8 sec)</p>
              </div>
            </div>

            {/* Track List with Canvas */}
            <div className="space-y-2">
              {[
                { title: "Summer Nights", artist: "Your Name", hasCanvas: true },
                { title: "Electric Dreams", artist: "Your Name", hasCanvas: true },
                { title: "Midnight Drive", artist: "Your Name", hasCanvas: false }
              ].map((track, idx) => (
                <div key={idx} className="glass-card p-2 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="relative w-12 h-12 rounded overflow-hidden bg-gradient-to-br from-primary/30 to-accent/30 flex-shrink-0">
                      {track.hasCanvas ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="w-5 h-5 text-primary animate-pulse" />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold truncate">{track.title}</p>
                      <p className="text-[8px] text-muted-foreground truncate">{track.artist}</p>
                    </div>
                    {track.hasCanvas && (
                      <Badge className="bg-primary/20 text-primary text-[7px] px-1.5 py-0.5">Active</Badge>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <button className="flex-1 text-[9px] py-1.5 px-2 bg-primary/10 hover:bg-primary/20 rounded font-medium transition-colors">
                      {track.hasCanvas ? "Replace" : "Upload"}
                    </button>
                    {track.hasCanvas && (
                      <button className="text-[9px] py-1.5 px-2 bg-muted/50 hover:bg-muted rounded transition-colors">
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Info Footer */}
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-2 mt-2">
              <p className="text-[8px] text-muted-foreground leading-relaxed">
                Canvas adds looping visuals to your tracks, just like Spotify. Vertical format (9:16) works best.
              </p>
            </div>
          </div>
        );
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
