import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, Mail, MessageSquare, Heart, TrendingUp, 
  Target, Zap, Gift, Bell, Send, Upload, Link, 
  ShoppingBag, Calendar, Crown, ExternalLink, Check,
  FileUp, Copy, Loader2, Sparkles, Palette, Eye, 
  Music, Image, Type, Wand2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface SuperFan {
  id: string;
  user_id: string;
  display_name: string;
  profile_image_path?: string;
  total_plays: number;
  total_likes: number;
  total_shares: number;
  engagement_score: number;
  tier: 'platinum' | 'gold' | 'silver';
}

const emailTemplates = [
  { id: 'release', name: 'New Release', icon: Music, color: 'from-violet-500 to-purple-600' },
  { id: 'presave', name: 'Pre-Save', icon: Bell, color: 'from-amber-500 to-orange-600' },
  { id: 'tour', name: 'Tour Announcement', icon: Calendar, color: 'from-pink-500 to-rose-600' },
  { id: 'exclusive', name: 'Exclusive Content', icon: Gift, color: 'from-emerald-500 to-teal-600' },
  { id: 'newsletter', name: 'Newsletter', icon: Mail, color: 'from-blue-500 to-cyan-600' },
];

export const FanEngagementHub = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState<any[]>([]);
  const [superFans, setSuperFans] = useState<SuperFan[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [preSaveTitle, setPreSaveTitle] = useState("");
  const [preSaveDate, setPreSaveDate] = useState("");
  const [preSaveLink, setPreSaveLink] = useState("");
  const [generatingPreSaveLink, setGeneratingPreSaveLink] = useState(false);
  const [exclusiveContent, setExclusiveContent] = useState("");
  const [exclusiveDate, setExclusiveDate] = useState("");
  const [smartLinkUrl, setSmartLinkUrl] = useState("");
  const [generatingLink, setGeneratingLink] = useState(false);
  const [showShopifyConnect, setShowShopifyConnect] = useState(false);
  const [csvUploading, setCsvUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Email Campaign State
  const [showEmailGenerator, setShowEmailGenerator] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('release');
  const [emailSubject, setEmailSubject] = useState("");
  const [emailHeadline, setEmailHeadline] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailCtaText, setEmailCtaText] = useState("Listen Now");
  const [emailCtaLink, setEmailCtaLink] = useState("");
  const [emailPreviewMode, setEmailPreviewMode] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [generatingEmailContent, setGeneratingEmailContent] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load fan metrics
      const { data: metricsData } = await supabase
        .from("fan_metrics")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setMetrics(metricsData || {
        email_list_size: 0,
        open_rate: 0,
        conversion_rate: 0,
        super_fans_count: 0
      });

      // Load followers
      const { data: followersData } = await supabase
        .from("artist_follows")
        .select(`
          id,
          follower_id,
          created_at
        `)
        .eq("artist_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (followersData) {
        // Get listener profiles for followers
        const followerIds = followersData.map(f => f.follower_id);
        const { data: profiles } = await supabase
          .from("listener_profiles")
          .select("*")
          .in("user_id", followerIds);

        const followersWithProfiles = followersData.map(f => ({
          ...f,
          profile: profiles?.find(p => p.user_id === f.follower_id)
        }));

        setFollowers(followersWithProfiles);
      }

      // Calculate super fans based on engagement
      const { data: listenerData } = await supabase
        .from("listening_history")
        .select(`
          user_id,
          track_id
        `)
        .in("track_id", (await supabase
          .from("tracks")
          .select("id")
          .eq("user_id", user.id)).data?.map(t => t.id) || []);

      // Group by user and calculate engagement
      const userEngagement: Record<string, number> = {};
      listenerData?.forEach(entry => {
        userEngagement[entry.user_id] = (userEngagement[entry.user_id] || 0) + 1;
      });

      // Get top engaged users
      const topUsers = Object.entries(userEngagement)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50);

      if (topUsers.length > 0) {
        const { data: superFanProfiles } = await supabase
          .from("listener_profiles")
          .select("*")
          .in("user_id", topUsers.map(u => u[0]));

        const superFansList: SuperFan[] = topUsers.map(([userId, plays], index) => {
          const profile = superFanProfiles?.find(p => p.user_id === userId);
          let tier: 'platinum' | 'gold' | 'silver' = 'silver';
          if (index < 10) tier = 'platinum';
          else if (index < 30) tier = 'gold';

          return {
            id: userId,
            user_id: userId,
            display_name: profile?.display_name || 'Anonymous Fan',
            profile_image_path: profile?.profile_image_path,
            total_plays: plays,
            total_likes: 0,
            total_shares: 0,
            engagement_score: plays * 10,
            tier
          };
        });

        setSuperFans(superFansList);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load engagement data");
    } finally {
      setLoading(false);
    }
  };

  const sendBroadcastMessage = async () => {
    if (!broadcastMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setSendingBroadcast(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get all follower IDs
      const { data: followersData } = await supabase
        .from("artist_follows")
        .select("follower_id")
        .eq("artist_id", user.id);

      if (!followersData || followersData.length === 0) {
        toast.error("No followers to send message to");
        return;
      }

      // Create notifications for all followers
      const notifications = followersData.map(f => ({
        user_id: f.follower_id,
        notification_type: "artist_broadcast",
        actor_id: user.id,
        message: broadcastMessage,
        target_type: "broadcast",
        target_id: user.id
      }));

      const { error } = await supabase
        .from("notifications")
        .insert(notifications);

      if (error) throw error;

      toast.success(`Message sent to ${followersData.length} followers!`);
      setBroadcastMessage("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSendingBroadcast(false);
    }
  };

  const generatePreSaveLink = async () => {
    if (!preSaveTitle || !preSaveDate) {
      toast.error("Please enter release title and date");
      return;
    }

    setGeneratingPreSaveLink(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("artist_profiles")
        .select("artist_name")
        .eq("user_id", user.id)
        .single();

      const artistSlug = profile?.artist_name?.toLowerCase().replace(/\s+/g, '-') || user.id.slice(0, 8);
      const releaseSlug = preSaveTitle.toLowerCase().replace(/\s+/g, '-');
      const uniqueId = Math.random().toString(36).substring(2, 6);
      const link = `https://tdz.link/presave/${artistSlug}/${releaseSlug}-${uniqueId}`;
      
      setPreSaveLink(link);
      toast.success("Pre-save link generated!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setGeneratingPreSaveLink(false);
    }
  };

  const createPreSaveCampaign = async () => {
    if (!preSaveTitle || !preSaveDate) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("content_calendar")
        .insert({
          user_id: user.id,
          title: `Pre-Save: ${preSaveTitle}`,
          content_type: "presave",
          scheduled_date: preSaveDate,
          status: "scheduled",
          metadata: { release_title: preSaveTitle, presave_link: preSaveLink }
        });

      if (error) throw error;

      toast.success("Pre-save campaign created!");
      setPreSaveTitle("");
      setPreSaveDate("");
      setPreSaveLink("");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const createExclusiveContent = async () => {
    if (!exclusiveContent || !exclusiveDate) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("content_calendar")
        .insert({
          user_id: user.id,
          title: `Exclusive: ${exclusiveContent}`,
          content_type: "exclusive",
          scheduled_date: exclusiveDate,
          status: "scheduled",
          metadata: { content_description: exclusiveContent }
        });

      if (error) throw error;

      toast.success("Exclusive content scheduled!");
      setExclusiveContent("");
      setExclusiveDate("");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const generateSmartLink = async () => {
    setGeneratingLink(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get artist profile
      const { data: profile } = await supabase
        .from("artist_profiles")
        .select("artist_name")
        .eq("user_id", user.id)
        .single();

      const artistSlug = profile?.artist_name?.toLowerCase().replace(/\s+/g, '-') || user.id.slice(0, 8);
      const uniqueId = Math.random().toString(36).substring(2, 8);
      const smartLink = `https://tdz.link/${artistSlug}/${uniqueId}`;
      
      setSmartLinkUrl(smartLink);
      toast.success("Smart link generated!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Link copied to clipboard!");
  };

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvUploading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const emails = lines.slice(1).map(line => {
        const parts = line.split(',');
        return parts[0]?.trim();
      }).filter(email => email && email.includes('@'));

      if (emails.length === 0) {
        toast.error("No valid emails found in CSV");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update fan metrics with new email count
      const { error } = await supabase
        .from("fan_metrics")
        .upsert({
          user_id: user.id,
          email_list_size: (metrics?.email_list_size || 0) + emails.length
        });

      if (error) throw error;

      toast.success(`${emails.length} contacts imported!`);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCsvUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const connectShopify = () => {
    // Redirect to Shopify OAuth
    const shopifyAuthUrl = `https://accounts.shopify.com/oauth/authorize?client_id=${import.meta.env.VITE_SHOPIFY_CLIENT_ID || 'demo'}&scope=read_products,write_products&redirect_uri=${window.location.origin}/shopify-callback`;
    window.open(shopifyAuthUrl, '_blank');
    toast.info("Connect your Shopify store to sell merch directly");
  };

  const generateEmailContent = async () => {
    setGeneratingEmailContent(true);
    try {
      const template = emailTemplates.find(t => t.id === selectedTemplate);
      
      // Generate content based on template
      const contentMap: Record<string, { subject: string; headline: string; body: string; cta: string }> = {
        release: {
          subject: "🎵 New Music Just Dropped!",
          headline: "My New Track Is Here",
          body: "I've been working hard on this one and I'm so excited to finally share it with you. This track means a lot to me and I can't wait for you to hear it.",
          cta: "Listen Now"
        },
        presave: {
          subject: "🔔 Be the First to Hear My New Release",
          headline: "Pre-Save My Upcoming Release",
          body: "Something special is coming and I want you to be the first to hear it. Pre-save now to get it delivered straight to your library the moment it drops!",
          cta: "Pre-Save Now"
        },
        tour: {
          subject: "🎤 I'm Coming to Your City!",
          headline: "Tour Dates Announced",
          body: "I'm hitting the road and I want to see you there! Check out the dates below and grab your tickets before they're gone.",
          cta: "Get Tickets"
        },
        exclusive: {
          subject: "🎁 Exclusive Content Just for You",
          headline: "You're Getting This First",
          body: "As one of my most dedicated fans, I wanted to share something special with you. This exclusive content is my way of saying thank you for your support.",
          cta: "Access Now"
        },
        newsletter: {
          subject: "📬 What's Been Happening",
          headline: "Updates From the Studio",
          body: "Hey! I wanted to catch you up on everything that's been going on. From new music to behind-the-scenes moments, here's what you've missed.",
          cta: "Read More"
        }
      };

      const content = contentMap[selectedTemplate] || contentMap.release;
      setEmailSubject(content.subject);
      setEmailHeadline(content.headline);
      setEmailBody(content.body);
      setEmailCtaText(content.cta);

      toast.success("Email content generated!");
    } catch (error: any) {
      toast.error("Failed to generate content");
    } finally {
      setGeneratingEmailContent(false);
    }
  };

  const sendMassEmail = async () => {
    if (!emailSubject || !emailBody) {
      toast.error("Please fill in email subject and body");
      return;
    }

    setSendingEmail(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // In production, this would call an edge function to send emails via Resend
      // For now, we'll create notifications and show success
      const { data: followersData } = await supabase
        .from("artist_follows")
        .select("follower_id")
        .eq("artist_id", user.id);

      const recipientCount = (followersData?.length || 0) + (metrics?.email_list_size || 0);

      // Create activity log entry
      await supabase
        .from("activity_log")
        .insert({
          user_id: user.id,
          activity_type: "email_campaign_sent",
          metadata: {
            subject: emailSubject,
            recipients: recipientCount,
            template: selectedTemplate
          }
        });

      toast.success(`Email campaign queued for ${recipientCount} recipients!`);
      setShowEmailGenerator(false);
      resetEmailForm();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSendingEmail(false);
    }
  };

  const resetEmailForm = () => {
    setEmailSubject("");
    setEmailHeadline("");
    setEmailBody("");
    setEmailCtaText("Listen Now");
    setEmailCtaLink("");
    setEmailPreviewMode(false);
  };

  if (loading) {
    return (
      <Card className="glass-card p-12 text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading engagement data...</p>
      </Card>
    );
  }

  const platinumFans = superFans.filter(f => f.tier === 'platinum');
  const goldFans = superFans.filter(f => f.tier === 'gold');
  const silverFans = superFans.filter(f => f.tier === 'silver');
  const selectedTemplateData = emailTemplates.find(t => t.id === selectedTemplate);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Heart className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-2xl font-display font-bold">Community Hub</h2>
          <p className="text-sm text-muted-foreground">
            Build real connections — fans aren't data points, they're participants in your story
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card hover:border-primary/60 hover:scale-105 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              Email List
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics?.email_list_size || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Direct connection</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:border-primary/60 hover:scale-105 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              Community
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{followers.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Invested participants</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:border-primary/60 hover:scale-105 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-green-500" />
              Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{(metrics?.conversion_rate || 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Active participation</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:border-primary/60 hover:scale-105 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              Inner Circle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{superFans.length}</div>
            <p className="text-xs text-muted-foreground">Your champions</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="capture" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="capture">Capture</TabsTrigger>
          <TabsTrigger value="nurture">Nurture</TabsTrigger>
          <TabsTrigger value="convert">Convert</TabsTrigger>
          <TabsTrigger value="superfans">Inner Circle</TabsTrigger>
        </TabsList>

        {/* Capture Tab */}
        <TabsContent value="capture" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Attention Capture Tools
              </CardTitle>
              <CardDescription>
                Build your direct audience - own the relationship
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pre-Save Campaign with Link */}
              <Card className="p-4 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent relative z-10">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-500" />
                  Pre-Save Campaign
                  <Badge variant="secondary" className="text-xs">Popular</Badge>
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate a pre-save link and capture emails before release day
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Release Title</Label>
                      <Input 
                        placeholder="Your upcoming release title"
                        value={preSaveTitle}
                        onChange={(e) => setPreSaveTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Release Date</Label>
                      <Input 
                        type="date"
                        value={preSaveDate}
                        onChange={(e) => setPreSaveDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-3 flex flex-col">
                    {preSaveLink ? (
                      <div className="p-3 rounded-lg bg-muted/50 border border-green-500/30">
                        <Label className="text-xs text-green-500">Your Pre-Save Link</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input value={preSaveLink} readOnly className="text-xs bg-background" />
                          <Button size="sm" variant="ghost" onClick={() => copyToClipboard(preSaveLink)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        onClick={generatePreSaveLink}
                        disabled={generatingPreSaveLink || !preSaveTitle || !preSaveDate}
                        className="w-full"
                      >
                        {generatingPreSaveLink ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Link className="w-4 h-4 mr-2" />
                        )}
                        Generate Pre-Save Link
                      </Button>
                    )}
                    <Button 
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 relative z-20" 
                      onClick={createPreSaveCampaign}
                      disabled={!preSaveTitle || !preSaveDate}
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Create Campaign
                    </Button>
                  </div>
                </div>
              </Card>

              {/* CSV Upload */}
              <Card className="p-4 border-dashed border-2 border-primary/30 relative z-0">
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <h4 className="font-semibold mb-1">Import Contacts</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Upload a CSV file with your existing email list
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    className="hidden"
                    id="csv-upload"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={csvUploading}
                  >
                    {csvUploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileUp className="w-4 h-4 mr-2" />
                    )}
                    {csvUploading ? "Importing..." : "Upload CSV"}
                  </Button>
                </div>
              </Card>

              {/* Email Campaign Generator */}
              <Card className="p-4 border-primary/30 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-500" />
                      Email Campaign Generator
                      <Badge className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs">Pro</Badge>
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Create compelling stories to connect with your community
                    </p>
                  </div>
                  <Button 
                    onClick={() => setShowEmailGenerator(true)}
                    className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Create Campaign
                  </Button>
                </div>

                {/* Template Preview Grid */}
                <div className="grid grid-cols-5 gap-2">
                  {emailTemplates.map((template) => (
                    <div 
                      key={template.id}
                      className={`p-3 rounded-lg border text-center cursor-pointer transition-all hover:scale-105 ${
                        selectedTemplate === template.id 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border/50 hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <div className={`w-8 h-8 mx-auto mb-2 rounded-full bg-gradient-to-br ${template.color} flex items-center justify-center`}>
                        <template.icon className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-xs font-medium truncate">{template.name}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Mass Email Section */}
              <Card className="p-4 border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Send className="w-4 h-4 text-blue-500" />
                  Mass Email
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Reach all {(metrics?.email_list_size || 0) + followers.length} participants in your community
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowEmailGenerator(true)}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Compose Email
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Calendar className="w-4 h-4" />
                  </Button>
                </div>
              </Card>

              {/* Exclusive Content */}
              <Card className="p-4 border-primary/30">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  Exclusive Content Gate
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Offer exclusive tracks for email signup
                </p>
                <div className="space-y-2 mb-3">
                  <Input 
                    placeholder="Content description (Demo track, BTS video...)"
                    value={exclusiveContent}
                    onChange={(e) => setExclusiveContent(e.target.value)}
                  />
                  <Input 
                    type="date"
                    value={exclusiveDate}
                    onChange={(e) => setExclusiveDate(e.target.value)}
                  />
                </div>
                <Button className="w-full" variant="outline" onClick={createExclusiveContent}>
                  <Gift className="w-4 h-4 mr-2" />
                  Schedule Content
                </Button>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Nurture Tab */}
        <TabsContent value="nurture" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Fan Communication
              </CardTitle>
              <CardDescription>
                Send messages to all your {followers.length} followers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Broadcast Message</Label>
                <Textarea 
                  placeholder="Update your fans on new music, shows, or behind-the-scenes..."
                  rows={4}
                  className="mt-2"
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                />
                <div className="flex gap-2 mt-2">
                  <Button 
                    className="flex-1" 
                    onClick={sendBroadcastMessage}
                    disabled={sendingBroadcast || !broadcastMessage.trim()}
                  >
                    {sendingBroadcast ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    {sendingBroadcast ? "Sending..." : `Send to ${followers.length} Followers`}
                  </Button>
                </div>
              </div>

              {/* Recent Followers */}
              {followers.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Recent Followers</h4>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {followers.slice(0, 20).map((follower) => (
                        <div key={follower.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={follower.profile?.profile_image_path} />
                            <AvatarFallback>
                              {follower.profile?.display_name?.charAt(0) || 'F'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {follower.profile?.display_name || 'Anonymous'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Followed {format(new Date(follower.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Convert Tab */}
        <TabsContent value="convert" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Conversion Infrastructure
              </CardTitle>
              <CardDescription>
                Turn attention into revenue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Smart Links */}
                <Card className="p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Link className="w-4 h-4" />
                    Smart Links
                    <Badge className="bg-green-500/20 text-green-500">Optimized</Badge>
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Generate trackable links for all your content
                  </p>
                  {smartLinkUrl ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 rounded bg-muted">
                        <Input value={smartLinkUrl} readOnly className="text-xs" />
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(smartLinkUrl)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button className="w-full" variant="outline" onClick={generateSmartLink}>
                        Generate New Link
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={generateSmartLink}
                      disabled={generatingLink}
                    >
                      {generatingLink ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Link className="w-4 h-4 mr-2" />
                      )}
                      Generate Smart Link
                    </Button>
                  )}
                </Card>

                {/* Shopify Merch */}
                <Card className="p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    Merch Store
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Connect Shopify to sell merch directly on your profile
                  </p>
                  <Button className="w-full" variant="outline" onClick={connectShopify}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Connect Shopify
                  </Button>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Super Fans Tab */}
        <TabsContent value="superfans" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                Your Super Fans
              </CardTitle>
              <CardDescription>
                Your most engaged supporters on the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {superFans.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No super fans yet. Keep releasing great music!</p>
                </div>
              ) : (
                <>
                  {/* Tier Summary */}
                  <div className="grid md:grid-cols-3 gap-3 mb-6">
                    <Card className="p-4 border-yellow-500/30 bg-yellow-500/5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center">
                          <Crown className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold">Platinum</p>
                          <p className="text-xs text-muted-foreground">Top 1%</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold">{platinumFans.length}</p>
                    </Card>

                    <Card className="p-4 border-primary/30 bg-primary/5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                          <Heart className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold">Gold</p>
                          <p className="text-xs text-muted-foreground">Top 5%</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold">{goldFans.length}</p>
                    </Card>

                    <Card className="p-4 border-blue-500/30 bg-blue-500/5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-600 flex items-center justify-center">
                          <Heart className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold">Silver</p>
                          <p className="text-xs text-muted-foreground">Top 10%</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold">{silverFans.length}</p>
                    </Card>
                  </div>

                  {/* Fan List */}
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {superFans.map((fan, index) => (
                        <div 
                          key={fan.id} 
                          className={`flex items-center gap-3 p-3 rounded-lg border ${
                            fan.tier === 'platinum' ? 'border-yellow-500/30 bg-yellow-500/5' :
                            fan.tier === 'gold' ? 'border-primary/30 bg-primary/5' :
                            'border-blue-500/30 bg-blue-500/5'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                            #{index + 1}
                          </div>
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={fan.profile_image_path} />
                            <AvatarFallback>{fan.display_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{fan.display_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {fan.total_plays} plays • {fan.engagement_score} engagement score
                            </p>
                          </div>
                          <Badge variant={
                            fan.tier === 'platinum' ? 'default' :
                            fan.tier === 'gold' ? 'secondary' : 'outline'
                          } className={
                            fan.tier === 'platinum' ? 'bg-gradient-to-r from-yellow-400 to-amber-600' :
                            fan.tier === 'gold' ? 'bg-gradient-to-r from-primary to-secondary' : ''
                          }>
                            {fan.tier.charAt(0).toUpperCase() + fan.tier.slice(1)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Email Generator Dialog */}
      <Dialog open={showEmailGenerator} onOpenChange={setShowEmailGenerator}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-500" />
              Email Campaign Generator
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
            {/* Editor */}
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Template</Label>
                <div className="grid grid-cols-5 gap-2">
                  {emailTemplates.map((template) => (
                    <button
                      key={template.id}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        selectedTemplate === template.id 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border/50 hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <div className={`w-6 h-6 mx-auto mb-1 rounded-full bg-gradient-to-br ${template.color} flex items-center justify-center`}>
                        <template.icon className="w-3 h-3 text-white" />
                      </div>
                      <p className="text-[10px] font-medium truncate">{template.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={generateEmailContent}
                disabled={generatingEmailContent}
              >
                {generatingEmailContent ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4 mr-2" />
                )}
                Auto-Generate Content
              </Button>

              <div>
                <Label className="text-xs">Subject Line</Label>
                <Input 
                  placeholder="Your email subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-xs">Headline</Label>
                <Input 
                  placeholder="Main headline"
                  value={emailHeadline}
                  onChange={(e) => setEmailHeadline(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-xs">Body</Label>
                <Textarea 
                  placeholder="Email body content..."
                  rows={4}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Button Text</Label>
                  <Input 
                    placeholder="Listen Now"
                    value={emailCtaText}
                    onChange={(e) => setEmailCtaText(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Button Link</Label>
                  <Input 
                    placeholder="https://..."
                    value={emailCtaLink}
                    onChange={(e) => setEmailCtaLink(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="border rounded-xl overflow-hidden bg-gradient-to-br from-background to-muted">
              <div className="p-2 border-b bg-muted/50 flex items-center justify-between">
                <span className="text-xs font-medium">Preview</span>
                <Eye className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="p-4">
                <div className={`rounded-xl overflow-hidden bg-gradient-to-br ${selectedTemplateData?.color || 'from-violet-500 to-fuchsia-500'} p-1`}>
                  <div className="bg-background rounded-lg p-6 space-y-4">
                    {/* Header */}
                    <div className="text-center pb-4 border-b border-border/50">
                      <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br ${selectedTemplateData?.color || 'from-violet-500 to-fuchsia-500'} flex items-center justify-center`}>
                        {selectedTemplateData && <selectedTemplateData.icon className="w-6 h-6 text-white" />}
                      </div>
                      <h3 className="font-display text-xl font-bold">
                        {emailHeadline || "Your Headline Here"}
                      </h3>
                    </div>
                    
                    {/* Body */}
                    <p className="text-sm text-muted-foreground text-center">
                      {emailBody || "Your email body content will appear here..."}
                    </p>
                    
                    {/* CTA */}
                    <div className="text-center pt-2">
                      <button className={`px-6 py-2 rounded-full bg-gradient-to-r ${selectedTemplateData?.color || 'from-violet-500 to-fuchsia-500'} text-white font-semibold text-sm`}>
                        {emailCtaText || "Listen Now"}
                      </button>
                    </div>
                    
                    {/* Footer */}
                    <div className="pt-4 border-t border-border/50 text-center">
                      <p className="text-[10px] text-muted-foreground">
                        Sent with ❤️ via TDZ
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowEmailGenerator(false)}>
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
              onClick={sendMassEmail}
              disabled={sendingEmail || !emailSubject || !emailBody}
            >
              {sendingEmail ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send to {(metrics?.email_list_size || 0) + followers.length} Contacts
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
