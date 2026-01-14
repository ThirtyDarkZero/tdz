import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Bell, Calendar as CalendarIcon, Copy, ExternalLink, Link2, Loader2,
  Music, Plus, Share2, TrendingUp, Users, Zap, Globe
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, differenceInDays, isFuture } from "date-fns";

interface Campaign {
  id: string;
  campaign_name: string;
  slug: string;
  release_date: string;
  description?: string;
  cover_image_path?: string;
  total_presaves: number;
  is_active: boolean;
  track_id?: string;
  album_id?: string;
  created_at: string;
}

interface CampaignSignup {
  id: string;
  campaign_id: string;
  email: string;
  platform_preferences: string[];
  created_at: string;
}

export const PreSaveCampaignManager = () => {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [signups, setSignups] = useState<CampaignSignup[]>([]);
  const [newCampaign, setNewCampaign] = useState({
    campaign_name: "",
    slug: "",
    release_date: null as Date | null,
    description: "",
    track_id: "",
    album_id: ""
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      loadSignups(selectedCampaign.id);
    }
  }, [selectedCampaign]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [campaignsRes, tracksRes, albumsRes] = await Promise.all([
        supabase.from("presave_campaigns").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("tracks").select("id, title").eq("user_id", user.id).eq("is_published", false),
        supabase.from("albums").select("id, title").eq("user_id", user.id).eq("is_published", false)
      ]);

      setCampaigns(campaignsRes.data || []);
      setTracks(tracksRes.data || []);
      setAlbums(albumsRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSignups = async (campaignId: string) => {
    const { data } = await supabase
      .from("presave_signups")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false });
    setSignups((data || []).map(s => ({
      ...s,
      platform_preferences: Array.isArray(s.platform_preferences) ? s.platform_preferences as string[] : []
    })));
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Math.random().toString(36).substring(2, 8);
  };

  const handleCreateCampaign = async () => {
    if (!newCampaign.campaign_name || !newCampaign.release_date) {
      toast.error("Please fill in required fields");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const slug = newCampaign.slug || generateSlug(newCampaign.campaign_name);

      const { error } = await supabase
        .from("presave_campaigns")
        .insert({
          user_id: user.id,
          campaign_name: newCampaign.campaign_name,
          slug,
          release_date: format(newCampaign.release_date, "yyyy-MM-dd"),
          description: newCampaign.description || null,
          track_id: newCampaign.track_id || null,
          album_id: newCampaign.album_id || null,
          is_active: true,
          total_presaves: 0
        });

      if (error) throw error;

      toast.success("Pre-save campaign created!");
      setShowNewCampaign(false);
      setNewCampaign({
        campaign_name: "",
        slug: "",
        release_date: null,
        description: "",
        track_id: "",
        album_id: ""
      });
      loadData();
    } catch (error: any) {
      console.error("Error creating campaign:", error);
      toast.error(error.message || "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCampaignActive = async (campaign: Campaign) => {
    try {
      await supabase
        .from("presave_campaigns")
        .update({ is_active: !campaign.is_active })
        .eq("id", campaign.id);

      toast.success(campaign.is_active ? "Campaign paused" : "Campaign activated");
      loadData();
    } catch (error) {
      toast.error("Failed to update campaign");
    }
  };

  const copyLink = (slug: string) => {
    const link = `${window.location.origin}/presave/${slug}`;
    navigator.clipboard.writeText(link);
    toast.success("Pre-save link copied!");
  };

  const getPreSaveLink = (slug: string) => `${window.location.origin}/presave/${slug}`;

  if (loading) {
    return (
      <Card className="p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading campaigns...</p>
      </Card>
    );
  }

  // Campaign Detail View
  if (selectedCampaign) {
    const daysUntilRelease = differenceInDays(new Date(selectedCampaign.release_date), new Date());
    const isUpcoming = isFuture(new Date(selectedCampaign.release_date));

    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedCampaign(null)} className="gap-2">
          ← Back to Campaigns
        </Button>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Campaign Overview */}
          <Card className="md:col-span-2 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">{selectedCampaign.campaign_name}</h2>
                <p className="text-muted-foreground">{selectedCampaign.description || "No description"}</p>
              </div>
              <Badge variant={selectedCampaign.is_active ? "default" : "secondary"}>
                {selectedCampaign.is_active ? "Active" : "Paused"}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="p-4 bg-gradient-to-br from-primary/10 to-transparent">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Pre-saves</span>
                </div>
                <p className="text-3xl font-bold">{signups.length}</p>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-transparent">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarIcon className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Release</span>
                </div>
                <p className="text-xl font-bold">{format(new Date(selectedCampaign.release_date), "MMM d, yyyy")}</p>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-transparent">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-muted-foreground">Days Left</span>
                </div>
                <p className="text-3xl font-bold">{isUpcoming ? daysUntilRelease : "Released"}</p>
              </Card>
            </div>

            {/* Pre-save Link */}
            <Card className="p-4 bg-muted/50 mb-6">
              <div className="flex items-center gap-3">
                <Link2 className="w-5 h-5 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-1">Pre-save Link</p>
                  <p className="text-sm text-muted-foreground truncate">{getPreSaveLink(selectedCampaign.slug)}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => copyLink(selectedCampaign.slug)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.open(getPreSaveLink(selectedCampaign.slug), '_blank')}>
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </Card>

            {/* Recent Signups */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Recent Pre-saves ({signups.length})
              </h3>
              {signups.length === 0 ? (
                <Card className="p-8 text-center bg-muted/30">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No pre-saves yet. Share your link to get started!</p>
                </Card>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {signups.slice(0, 20).map(signup => (
                    <div key={signup.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="font-medium">{signup.email}</span>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(signup.created_at), "MMM d, h:mm a")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => copyLink(selectedCampaign.slug)}>
                  <Copy className="w-4 h-4" />
                  Copy Link
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline">
                  <Share2 className="w-4 h-4" />
                  Share to Social
                </Button>
                <Button 
                  className="w-full justify-start gap-2" 
                  variant={selectedCampaign.is_active ? "destructive" : "default"}
                  onClick={() => toggleCampaignActive(selectedCampaign)}
                >
                  <Zap className="w-4 h-4" />
                  {selectedCampaign.is_active ? "Pause Campaign" : "Activate Campaign"}
                </Button>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Promotion Tips</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Share your pre-save link on social media</li>
                <li>• Add it to your Instagram bio</li>
                <li>• Include in your email newsletter</li>
                <li>• Post countdown content to build hype</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold">Pre-Save Campaigns</h2>
            <p className="text-sm text-muted-foreground">Build hype and maximize first-day streams</p>
          </div>
        </div>

        <Dialog open={showNewCampaign} onOpenChange={setShowNewCampaign}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Pre-Save Campaign</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Campaign Name *</Label>
                <Input
                  value={newCampaign.campaign_name}
                  onChange={(e) => setNewCampaign({ 
                    ...newCampaign, 
                    campaign_name: e.target.value,
                    slug: generateSlug(e.target.value)
                  })}
                  placeholder="e.g., My New Single - Pre-Save"
                />
              </div>

              <div className="space-y-2">
                <Label>Release Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newCampaign.release_date 
                        ? format(newCampaign.release_date, "PPP") 
                        : "Select release date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newCampaign.release_date || undefined}
                      onSelect={(date) => setNewCampaign({ ...newCampaign, release_date: date || null })}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                  placeholder="Tell fans about your upcoming release..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    Link to Track
                  </Label>
                  <Select value={newCampaign.track_id} onValueChange={(v) => setNewCampaign({ ...newCampaign, track_id: v, album_id: "" })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {tracks.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Link to Album
                  </Label>
                  <Select value={newCampaign.album_id} onValueChange={(v) => setNewCampaign({ ...newCampaign, album_id: v, track_id: "" })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {albums.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Pre-save link:</strong>{" "}
                  <span className="text-primary">{newCampaign.slug ? getPreSaveLink(newCampaign.slug) : 'Will be generated'}</span>
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewCampaign(false)}>Cancel</Button>
              <Button onClick={handleCreateCampaign} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Create Campaign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaigns List */}
      {campaigns.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Pre-Save Campaigns</h3>
          <p className="text-muted-foreground mb-4">
            Create a pre-save campaign to build hype before your release
          </p>
          <Button onClick={() => setShowNewCampaign(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Campaign
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map(campaign => {
            const daysLeft = differenceInDays(new Date(campaign.release_date), new Date());
            const isUpcoming = isFuture(new Date(campaign.release_date));

            return (
              <Card 
                key={campaign.id}
                className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelectedCampaign(campaign)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold truncate">{campaign.campaign_name}</h3>
                  <Badge variant={campaign.is_active ? "default" : "secondary"} className="text-xs">
                    {campaign.is_active ? "Active" : "Paused"}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Pre-saves
                    </span>
                    <span className="font-bold text-primary">{campaign.total_presaves}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4" />
                      Release
                    </span>
                    <span>{format(new Date(campaign.release_date), "MMM d, yyyy")}</span>
                  </div>

                  {isUpcoming && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Countdown</span>
                        <span className="text-xs font-medium">{daysLeft} days left</span>
                      </div>
                      <Progress value={Math.max(0, 100 - (daysLeft / 30) * 100)} className="h-2" />
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
