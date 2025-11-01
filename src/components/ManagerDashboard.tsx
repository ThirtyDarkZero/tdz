import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Users, TrendingUp, DollarSign, Music, BarChart3 } from "lucide-react";

interface Artist {
  id: string;
  artist_id: string;
  artist_name: string;
  email: string;
  notes: string | null;
  commission_rate: number;
  contract_start_date: string | null;
  contract_end_date: string | null;
  total_tracks: number;
  total_plays: number;
  monthly_listeners: number;
  created_at: string;
}

export const ManagerDashboard = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [newArtistEmail, setNewArtistEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [commissionRate, setCommissionRate] = useState("15");
  const { toast } = useToast();

  useEffect(() => {
    loadArtists();
  }, []);

  const loadArtists = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all artists managed by this manager
      const { data: managedArtists, error: managedError } = await supabase
        .from('manager_artists')
        .select('*')
        .eq('manager_id', user.id);

      if (managedError) throw managedError;

      // Get artist profiles and stats for each artist
      const artistsWithStats = await Promise.all(
        (managedArtists || []).map(async (ma) => {
          // Get artist profile
          const { data: profile } = await supabase
            .from('artist_profiles')
            .select('artist_name')
            .eq('user_id', ma.artist_id)
            .single();

          // Get artist tracks
          const { data: tracks } = await supabase
            .from('tracks')
            .select('id, play_count')
            .eq('user_id', ma.artist_id);

          const totalTracks = tracks?.length || 0;
          const totalPlays = tracks?.reduce((sum, t) => sum + t.play_count, 0) || 0;

          // Get monthly listeners
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const { data: listeners } = await supabase
            .from('listening_history')
            .select('user_id')
            .in('track_id', tracks?.map(t => t.id) || [])
            .gte('played_at', thirtyDaysAgo.toISOString());

          const monthlyListeners = new Set(listeners?.map(l => l.user_id)).size;

          return {
            id: ma.id,
            artist_id: ma.artist_id,
            artist_name: profile?.artist_name || 'Unknown Artist',
            email: '',
            notes: ma.notes,
            commission_rate: Number(ma.commission_rate),
            contract_start_date: ma.contract_start_date,
            contract_end_date: ma.contract_end_date,
            total_tracks: totalTracks,
            total_plays: totalPlays,
            monthly_listeners: monthlyListeners,
            created_at: ma.created_at
          };
        })
      );

      setArtists(artistsWithStats);
    } catch (error: any) {
      console.error('Error loading artists:', error);
      toast({
        title: "Failed to load artists",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardArtist = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find artist by email (lookup in auth.users via admin)
      // Note: In production, you'd need an admin endpoint to lookup users by email
      toast({
        title: "Artist Onboarding",
        description: "To onboard an artist, they need to sign up first. Share the artist registration link with them.",
      });

      setOnboardOpen(false);
      setNewArtistEmail("");
      setNotes("");
      setCommissionRate("15");
    } catch (error: any) {
      toast({
        title: "Failed to onboard artist",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const totalRevenue = artists.reduce(
    (sum, artist) => sum + (artist.total_plays * 0.004 * artist.commission_rate / 100),
    0
  );

  const totalPlays = artists.reduce((sum, artist) => sum + artist.total_plays, 0);
  const totalTracks = artists.reduce((sum, artist) => sum + artist.total_tracks, 0);

  if (loading) {
    return <div className="text-center py-12">Loading manager dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Manager Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage your roster of artists</p>
        </div>
        <Dialog open={onboardOpen} onOpenChange={setOnboardOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <UserPlus className="h-4 w-4 mr-2" />
              Onboard Artist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Onboard New Artist</DialogTitle>
              <DialogDescription>
                Add a new artist to your roster
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Artist Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="artist@example.com"
                  value={newArtistEmail}
                  onChange={(e) => setNewArtistEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="commission">Commission Rate (%)</Label>
                <Input
                  id="commission"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Contract details, special arrangements..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <Button onClick={handleOnboardArtist} className="w-full">
                Add Artist
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Artists</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{artists.length}</div>
            <p className="text-xs text-muted-foreground">Active roster</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tracks</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTracks}</div>
            <p className="text-xs text-muted-foreground">Across all artists</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Plays</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPlays.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Commission Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Based on streams</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="roster" className="space-y-6">
        <TabsList>
          <TabsTrigger value="roster" className="gap-2">
            <Users className="h-4 w-4" />
            Artist Roster
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roster">
          <Card>
            <CardHeader>
              <CardTitle>Your Artists</CardTitle>
              <CardDescription>Manage and track your artist roster</CardDescription>
            </CardHeader>
            <CardContent>
              {artists.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No artists yet. Start onboarding!</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Artist Name</TableHead>
                      <TableHead>Tracks</TableHead>
                      <TableHead>Total Plays</TableHead>
                      <TableHead>Monthly Listeners</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {artists.map((artist) => (
                      <TableRow key={artist.id}>
                        <TableCell className="font-medium">{artist.artist_name}</TableCell>
                        <TableCell>{artist.total_tracks}</TableCell>
                        <TableCell>{artist.total_plays.toLocaleString()}</TableCell>
                        <TableCell>{artist.monthly_listeners.toLocaleString()}</TableCell>
                        <TableCell>{artist.commission_rate}%</TableCell>
                        <TableCell>
                          ${(artist.total_plays * 0.004 * artist.commission_rate / 100).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Roster Analytics</CardTitle>
              <CardDescription>Performance overview across all artists</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  Detailed analytics coming soon
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
