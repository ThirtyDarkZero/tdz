import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Users, Mail, MessageSquare, Heart, TrendingUp, 
  Target, Zap, Gift, Bell, Send 
} from "lucide-react";
import { toast } from "sonner";

// Pillar 1: Trusted Attention Access
// Pillar 3: Conversion Infrastructure
export const FanEngagementHub = () => {
  const [emailList, setEmailList] = useState(1247);
  const [conversionRate, setConversionRate] = useState(3.2);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Heart className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-2xl font-display font-bold">Fan Engagement Hub</h2>
          <p className="text-sm text-muted-foreground">
            Direct connection with your true fans - no algorithm tolls
          </p>
        </div>
      </div>

      {/* Attention Access Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card hover:border-primary/60 hover:scale-105 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              Email List
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailList.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Direct reach</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:border-primary/60 hover:scale-105 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Open Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">42.3%</div>
            <p className="text-xs text-muted-foreground">Industry avg: 18%</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:border-primary/60 hover:scale-105 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" />
              Conversion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Attention → Sales</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:border-primary/60 hover:scale-105 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              Super Fans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">324</div>
            <p className="text-xs text-muted-foreground">High engagement</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="capture" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="capture">Capture</TabsTrigger>
          <TabsTrigger value="nurture">Nurture</TabsTrigger>
          <TabsTrigger value="convert">Convert</TabsTrigger>
          <TabsTrigger value="superfans">Super Fans</TabsTrigger>
        </TabsList>

        {/* Attention Capture */}
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
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-4 border-primary/30">
                  <h4 className="font-semibold mb-2">Pre-Save Campaign</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Capture emails before release day
                  </p>
                  <div className="space-y-2 mb-3">
                    <Label>Landing Page URL</Label>
                    <Input value="yourartist.tdz.com/presave" readOnly />
                  </div>
                  <Button className="w-full">
                    <Bell className="w-4 h-4 mr-2" />
                    Create Campaign
                  </Button>
                </Card>

                <Card className="p-4 border-primary/30">
                  <h4 className="font-semibold mb-2">Exclusive Content Gate</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Offer exclusive tracks for email signup
                  </p>
                  <div className="space-y-2 mb-3">
                    <Label>Reward Type</Label>
                    <Input placeholder="Demo track, BTS video..." />
                  </div>
                  <Button className="w-full" variant="outline">
                    <Gift className="w-4 h-4 mr-2" />
                    Setup Gate
                  </Button>
                </Card>
              </div>

              <Card className="p-4 bg-primary/10 border-primary/30">
                <div className="flex gap-2 items-start">
                  <Target className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">Why This Matters</h4>
                    <p className="text-sm text-muted-foreground">
                      Algorithms control reach on social platforms. Your email list is yours forever - 
                      direct access to real fans without paying platform tolls.
                    </p>
                  </div>
                </div>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fan Nurturing */}
        <TabsContent value="nurture" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Fan Communication
              </CardTitle>
              <CardDescription>
                Stay connected with your audience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Broadcast Message</Label>
                <Textarea 
                  placeholder="Update your fans on new music, shows, or behind-the-scenes..."
                  rows={4}
                  className="mt-2"
                />
                <div className="flex gap-2 mt-2">
                  <Button className="flex-1">
                    <Send className="w-4 h-4 mr-2" />
                    Send to All Fans
                  </Button>
                  <Button variant="outline">
                    Schedule
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <Card className="p-3 hover:border-primary/60 transition-all cursor-pointer">
                  <p className="text-sm font-medium mb-1">Weekly Update</p>
                  <p className="text-xs text-muted-foreground">Every Friday</p>
                  <Badge className="mt-2" variant="secondary">Active</Badge>
                </Card>
                <Card className="p-3 hover:border-primary/60 transition-all cursor-pointer">
                  <p className="text-sm font-medium mb-1">Release Countdown</p>
                  <p className="text-xs text-muted-foreground">3 days before</p>
                  <Badge className="mt-2" variant="outline">Automated</Badge>
                </Card>
                <Card className="p-3 hover:border-primary/60 transition-all cursor-pointer">
                  <p className="text-sm font-medium mb-1">Milestone Alerts</p>
                  <p className="text-xs text-muted-foreground">On achievements</p>
                  <Badge className="mt-2" variant="outline">Automated</Badge>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversion Tools */}
        <TabsContent value="convert" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Conversion Infrastructure
              </CardTitle>
              <CardDescription>
                Turn attention into revenue - close the bucket leaks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    Smart Links
                    <Badge className="bg-green-500/20 text-green-500">+{conversionRate}%</Badge>
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Optimize every link for maximum conversion
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Pre-save capture</span>
                      <span className="text-green-500">✓</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Multiple CTAs</span>
                      <span className="text-green-500">✓</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Analytics tracking</span>
                      <span className="text-green-500">✓</span>
                    </div>
                  </div>
                  <Button className="w-full mt-3">Generate Link</Button>
                </Card>

                <Card className="p-4">
                  <h4 className="font-semibold mb-2">Direct Sales</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Sell merch, exclusives, experiences
                  </p>
                  <div className="space-y-2 mb-3">
                    <Input placeholder="Product name" />
                    <Input type="number" placeholder="Price" />
                  </div>
                  <Button className="w-full" variant="outline">
                    Add Product
                  </Button>
                </Card>
              </div>

              <Card className="p-4 bg-green-500/10 border-green-500/30">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Conversion Optimization
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Link click-through rate</span>
                    <span className="font-semibold">8.7%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email → Purchase rate</span>
                    <span className="font-semibold">{conversionRate}%</span>
                  </div>
                  <Progress value={32} className="h-2" />
                </div>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Super Fans */}
        <TabsContent value="superfans" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Super Fan Program
              </CardTitle>
              <CardDescription>
                Identify and reward your most engaged supporters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-3">
                <Card className="p-4 border-red-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">Platinum</p>
                      <p className="text-xs text-muted-foreground">Top 1%</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold">47</p>
                  <p className="text-xs text-muted-foreground">$1,200 avg spend</p>
                </Card>

                <Card className="p-4 border-primary/30">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">Gold</p>
                      <p className="text-xs text-muted-foreground">Top 5%</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold">156</p>
                  <p className="text-xs text-muted-foreground">$480 avg spend</p>
                </Card>

                <Card className="p-4 border-muted">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">Silver</p>
                      <p className="text-xs text-muted-foreground">Top 10%</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold">321</p>
                  <p className="text-xs text-muted-foreground">$180 avg spend</p>
                </Card>
              </div>

              <Card className="p-4">
                <h4 className="font-semibold mb-3">Exclusive Perks</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                    <Gift className="w-4 h-4 text-primary" />
                    <span className="text-sm">Early access to all releases</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span className="text-sm">Direct message line</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm">Private virtual hangouts</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-sm">Exclusive merch drops</span>
                  </div>
                </div>
                <Button className="w-full mt-3">Manage Perks</Button>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};