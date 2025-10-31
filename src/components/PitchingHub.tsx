import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ListMusic, Users, Radio, Send, CheckCircle2,
  TrendingUp, Target, Music
} from "lucide-react";
import { toast } from "sonner";

export function PitchingHub() {
  const handleSubmit = (type: string) => {
    toast.success(`${type} pitch submitted!`, {
      description: "Your pitch has been sent to our A&R team for review"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Target className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-2xl font-display font-bold">Pitching Hub</h2>
          <p className="text-sm text-muted-foreground">
            Get your music to playlists, DJs, and radio stations
          </p>
        </div>
      </div>

      <Tabs defaultValue="playlists" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="playlists" className="gap-2">
            <ListMusic className="w-4 h-4" />
            Playlists
          </TabsTrigger>
          <TabsTrigger value="dj-pools" className="gap-2">
            <Users className="w-4 h-4" />
            DJ Pools
          </TabsTrigger>
          <TabsTrigger value="radio" className="gap-2">
            <Radio className="w-4 h-4" />
            Radio
          </TabsTrigger>
        </TabsList>

        <TabsContent value="playlists" className="space-y-4">
          <Card className="glass-card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <ListMusic className="w-5 h-5 text-primary" />
              Playlist Pitching
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label>Select Track</Label>
                <Input placeholder="Choose a track from your library" />
              </div>
              
              <div>
                <Label>Target Playlists</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    "Editorial Playlists",
                    "Algorithmic Playlists",
                    "Independent Curators",
                    "Genre-Specific"
                  ].map((type) => (
                    <Button key={type} variant="outline" className="justify-start">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Pitch Message</Label>
                <Textarea 
                  placeholder="Tell curators why your track is a perfect fit for their playlist..."
                  rows={4}
                />
              </div>

              <Button 
                onClick={() => handleSubmit("Playlist")}
                className="w-full bg-gradient-to-r from-primary to-secondary"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit to Playlists
              </Button>
            </div>
          </Card>

          <Card className="glass-card p-6">
            <h4 className="font-semibold mb-3">Recommended Playlists</h4>
            <div className="space-y-3">
              {[
                { name: "Indie Vibes 2025", followers: "234K", match: 92 },
                { name: "New Music Friday", followers: "1.2M", match: 88 },
                { name: "Chill Beats", followers: "567K", match: 85 }
              ].map((playlist, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-3">
                    <Music className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-medium">{playlist.name}</p>
                      <p className="text-xs text-muted-foreground">{playlist.followers} followers</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      {playlist.match}% Match
                    </Badge>
                    <Button size="sm">Pitch</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="dj-pools" className="space-y-4">
          <Card className="glass-card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              DJ Pool Submission
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: "BPM Supreme", type: "Hip-Hop/R&B", status: "Accepting" },
                  { name: "DMS", type: "Multi-Genre", status: "Accepting" },
                  { name: "ZipDJ", type: "Electronic", status: "Review" },
                  { name: "Heavy Hits", type: "Pop/Dance", status: "Accepting" }
                ].map((pool, idx) => (
                  <Card key={idx} className="p-4 hover:border-primary/60 transition-all">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold">{pool.name}</h4>
                        <Badge variant={pool.status === "Accepting" ? "default" : "secondary"}>
                          {pool.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{pool.type}</p>
                      <Button size="sm" className="w-full">
                        <Send className="w-3 h-3 mr-1" />
                        Submit
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="radio" className="space-y-4">
          <Card className="glass-card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Radio className="w-5 h-5 text-primary" />
              Radio Pitching
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label>Station Type</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    "College Radio",
                    "Independent Radio",
                    "Internet Radio",
                    "Commercial Radio"
                  ].map((type) => (
                    <Button key={type} variant="outline" className="justify-start">
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Press Release</Label>
                <Textarea 
                  placeholder="Your artist bio and track information for radio programmers..."
                  rows={5}
                />
              </div>

              <Button 
                onClick={() => handleSubmit("Radio")}
                className="w-full bg-gradient-to-r from-primary to-secondary"
              >
                <Radio className="w-4 w-4 mr-2" />
                Submit to Radio Stations
              </Button>
            </div>
          </Card>

          <Card className="glass-card p-6 bg-accent/10 border-accent/20">
            <TrendingUp className="w-5 h-5 text-accent mb-2" />
            <h4 className="font-semibold mb-2">Radio Campaign Tips</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Target college radio first for indie artists</li>
              <li>• Include high-quality press photos</li>
              <li>• Follow up 2 weeks after submission</li>
              <li>• Provide clean versions for AM/FM stations</li>
            </ul>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
