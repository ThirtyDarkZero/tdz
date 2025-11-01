import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Instagram, Youtube, Music2, Twitter, 
  TrendingUp, Users, BarChart3, ExternalLink 
} from "lucide-react";
import { toast } from "sonner";

const platforms = [
  { 
    id: "spotify", 
    name: "Spotify for Artists", 
    icon: Music2, 
    color: "from-green-500 to-emerald-500",
    connected: false 
  },
  { 
    id: "apple", 
    name: "Apple Music for Artists", 
    icon: Music2, 
    color: "from-pink-500 to-red-500",
    connected: false 
  },
  { 
    id: "youtube", 
    name: "YouTube Studio", 
    icon: Youtube, 
    color: "from-red-500 to-orange-500",
    connected: false 
  },
  { 
    id: "instagram", 
    name: "Instagram", 
    icon: Instagram, 
    color: "from-purple-500 to-pink-500",
    connected: false 
  },
  { 
    id: "twitter", 
    name: "Twitter/X", 
    icon: Twitter, 
    color: "from-blue-400 to-cyan-400",
    connected: false 
  },
];

export const SocialMediaHub = () => {
  const handleConnect = (platform: string) => {
    toast.info(`Connect to ${platform}`, {
      description: "Social media integration coming soon! This will sync your analytics across all platforms."
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-2xl font-display font-bold">Social Media Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Connect your accounts for unified analytics dashboard
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {platforms.map((platform, idx) => (
          <Card 
            key={platform.id} 
            className="glass-card p-6 hover:border-primary/60 hover:scale-105 transition-all group cursor-pointer animate-fade-in"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all`}>
                  <platform.icon className="w-7 h-7 text-white" />
                </div>
                {platform.connected ? (
                  <Badge className="bg-green-500/20 text-green-500 border-green-500/30 animate-pulse">
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary">Not Connected</Badge>
                )}
              </div>
              
              <div>
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{platform.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {platform.connected 
                    ? "Syncing analytics data"
                    : "Connect to view insights"}
                </p>
              </div>

              <Button
                onClick={() => handleConnect(platform.name)}
                variant={platform.connected ? "outline" : "default"}
                className="w-full group-hover:scale-105 transition-transform"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {platform.connected ? "Manage" : "Connect"}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="glass-card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Unified Analytics (Coming Soon)
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="group text-center p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:scale-105 hover:border-purple-500/40 transition-all cursor-pointer">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8 text-white" />
            </div>
            <p className="text-3xl font-bold mb-1 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">--</p>
            <p className="text-sm text-muted-foreground">Total Followers</p>
          </div>
          <div className="group text-center p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:scale-105 hover:border-blue-500/40 transition-all cursor-pointer">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <p className="text-3xl font-bold mb-1 bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">--</p>
            <p className="text-sm text-muted-foreground">Engagement Rate</p>
          </div>
          <div className="group text-center p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 hover:scale-105 hover:border-green-500/40 transition-all cursor-pointer">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <p className="text-3xl font-bold mb-1 bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">--</p>
            <p className="text-sm text-muted-foreground">Total Reach</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
