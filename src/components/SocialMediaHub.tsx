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

export function SocialMediaHub() {
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
        {platforms.map((platform) => (
          <Card key={platform.id} className="glass-card p-6 hover:border-primary/60 transition-all">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center`}>
                  <platform.icon className="w-6 h-6 text-white" />
                </div>
                {platform.connected ? (
                  <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary">Not Connected</Badge>
                )}
              </div>
              
              <div>
                <h3 className="font-semibold mb-1">{platform.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {platform.connected 
                    ? "Syncing analytics data"
                    : "Connect to view insights"}
                </p>
              </div>

              <Button
                onClick={() => handleConnect(platform.name)}
                variant={platform.connected ? "outline" : "default"}
                className="w-full"
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
          <div className="text-center p-4 rounded-lg bg-muted">
            <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">--</p>
            <p className="text-xs text-muted-foreground">Total Followers</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">--</p>
            <p className="text-xs text-muted-foreground">Engagement Rate</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">--</p>
            <p className="text-xs text-muted-foreground">Total Reach</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
