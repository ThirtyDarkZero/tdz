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
  ChevronRight
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
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">Streaming Performance</span>
              <Badge className="bg-accent/20 text-accent text-xs">Live</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-background/50 rounded">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/20 rounded flex items-center justify-center">
                    <Music className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold">Spotify</div>
                    <div className="text-[10px] text-muted-foreground">+2.4K today</div>
                  </div>
                </div>
                <div className="text-xs font-bold text-primary">45.2K</div>
              </div>
              <div className="flex items-center justify-between p-2 bg-background/50 rounded">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-accent/20 rounded flex items-center justify-center">
                    <Music className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold">Apple Music</div>
                    <div className="text-[10px] text-muted-foreground">+1.8K today</div>
                  </div>
                </div>
                <div className="text-xs font-bold text-accent">32.1K</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/20 to-accent/20 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold">Revenue This Month</span>
                <TrendingUp className="w-3 h-3 text-primary" />
              </div>
              <div className="text-xl font-black">$4,287</div>
              <div className="text-[10px] text-muted-foreground">+38% vs last month</div>
            </div>
          </div>
        );
      case "Music Library":
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold">Your Releases</span>
              <span className="text-[10px] text-muted-foreground">24 tracks</span>
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-background/50 rounded hover:bg-primary/10 transition-colors cursor-pointer">
                <div className={`w-12 h-12 bg-gradient-to-br ${i === 1 ? 'from-primary to-accent' : i === 2 ? 'from-accent to-secondary' : 'from-secondary to-primary'} rounded flex items-center justify-center`}>
                  <Music className="w-5 h-5 text-background" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate">Summer Nights {i}</div>
                  <div className="text-[10px] text-muted-foreground">Released {i} week{i > 1 ? 's' : ''} ago</div>
                </div>
                <Play className="w-4 h-4 text-primary flex-shrink-0" />
              </div>
            ))}
            <div className="bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 p-3 rounded-lg mt-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold mb-1">Total Plays</div>
                  <div className="text-xl font-black">127.5K</div>
                </div>
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
        );
      case "AI Video Studio":
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">Active Projects</span>
              <Badge className="bg-primary/20 text-primary text-xs">3 rendering</Badge>
            </div>
            <div className="bg-gradient-to-br from-primary/30 to-accent/30 rounded-lg p-3">
              <div className="aspect-video bg-background/20 rounded mb-2 flex items-center justify-center">
                <Video className="w-8 h-8 text-primary" />
              </div>
              <div className="text-xs font-semibold mb-1">Electric Dreams MV</div>
              <div className="w-full bg-background/50 rounded-full h-1.5 mb-1">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: '68%' }}></div>
              </div>
              <div className="text-[10px] text-muted-foreground">Rendering: 68% complete</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {["Kling AI", "Runway", "Sora"].map((provider, i) => (
                <div key={i} className="text-center p-2 bg-background/50 rounded">
                  <div className="w-8 h-8 mx-auto mb-1 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                    <Video className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-[9px] font-semibold">{provider}</div>
                </div>
              ))}
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
              title="AI Video Studio" 
              color="from-secondary/50 to-primary/50"
            />
            <div className="text-center space-y-2 px-4">
              <h3 className="font-bold text-lg">Video Generation</h3>
              <p className="text-sm text-muted-foreground">
                Create professional music videos using Kling, Runway, Sora, and Veo AI in minutes
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
