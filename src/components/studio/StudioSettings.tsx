import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArtistProfileEditor } from "@/components/ArtistProfileEditor";
import { ArtistPayoutSettings } from "@/components/ArtistPayoutSettings";
import { CollaboratorsList } from "@/components/CollaboratorsList";
import { CollaboratorInviteDialog } from "@/components/CollaboratorInviteDialog";
import { SupportTicketSystem } from "@/components/SupportTicketSystem";
import { FeatureGate } from "@/components/FeatureGate";
import { 
  Users, Shield, Bell, Palette, Globe, Lock, 
  Download, Trash2, AlertTriangle, Zap, LifeBuoy
} from "lucide-react";
import { toast } from "sonner";
import { hardSignOut } from "@/lib/auth";

export const StudioSettings = () => {
  const navigate = useNavigate();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [collaboratorsKey, setCollaboratorsKey] = useState(0);
  
  // Advanced settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [newFollowerNotif, setNewFollowerNotif] = useState(true);
  const [playlistAddNotif, setPlaylistAddNotif] = useState(true);
  const [commentNotif, setCommentNotif] = useState(true);
  const [earningsNotif, setEarningsNotif] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState("public");
  const [allowDMs, setAllowDMs] = useState(true);
  const [showStreamCount, setShowStreamCount] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [audioQuality, setAudioQuality] = useState("high");
  const [autoPlay, setAutoPlay] = useState(true);

  const handleExportData = () => {
    toast.success("Data export request submitted. You'll receive an email with your data within 24 hours.");
  };

  const handleDeleteAccount = () => {
    toast.error("Please contact support@thirtydarkzero.com to delete your account.");
  };

  const handleLogout = async () => {
    await hardSignOut({ redirectTo: "/" });
    navigate("/");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-black tracking-tight mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your profile, payouts, team, and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 flex-wrap h-auto">
          <TabsTrigger value="profile" className="data-[state=active]:bg-background">
            Artist Profile
          </TabsTrigger>
          <TabsTrigger value="payouts" className="data-[state=active]:bg-background">
            Payouts
          </TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-background">
            Team
          </TabsTrigger>
          <TabsTrigger value="support" className="data-[state=active]:bg-background">
            <LifeBuoy className="h-4 w-4 mr-1" />
            Support
          </TabsTrigger>
          <TabsTrigger value="advanced" className="data-[state=active]:bg-background">
            Advanced
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-0">
          <ArtistProfileEditor />
        </TabsContent>

        <TabsContent value="payouts" className="mt-0">
          <ArtistPayoutSettings />
        </TabsContent>

        <TabsContent value="team" className="mt-0">
          <FeatureGate feature="collaborationTools">
            <div className="space-y-6">
              <div className="flex justify-end">
                <Button onClick={() => setShowInviteDialog(true)} className="gap-2">
                  <Users className="h-4 w-4" />
                  Invite Collaborator
                </Button>
              </div>
              <CollaboratorsList key={collaboratorsKey} />
            </div>
          </FeatureGate>

          <CollaboratorInviteDialog 
            open={showInviteDialog} 
            onOpenChange={setShowInviteDialog}
            onInviteSent={() => setCollaboratorsKey(prev => prev + 1)}
          />
        </TabsContent>

        <TabsContent value="support" className="mt-0">
          <SupportTicketSystem />
        </TabsContent>

        <TabsContent value="advanced" className="mt-0 space-y-6">
          {/* Notifications */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notifications
              </CardTitle>
              <CardDescription>
                Manage how you receive updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">Receive updates via email</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Push Notifications</Label>
                  <p className="text-xs text-muted-foreground">Receive browser notifications</p>
                </div>
                <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
              </div>
              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium mb-3">Notify me about:</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-normal">New followers</Label>
                    <Switch checked={newFollowerNotif} onCheckedChange={setNewFollowerNotif} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-normal">Playlist additions</Label>
                    <Switch checked={playlistAddNotif} onCheckedChange={setPlaylistAddNotif} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-normal">Comments on my tracks</Label>
                    <Switch checked={commentNotif} onCheckedChange={setCommentNotif} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-normal">Earnings updates</Label>
                    <Switch checked={earningsNotif} onCheckedChange={setEarningsNotif} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Privacy
              </CardTitle>
              <CardDescription>
                Control your profile visibility
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Profile Visibility</Label>
                <Select value={profileVisibility} onValueChange={setProfileVisibility}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public - Anyone can view</SelectItem>
                    <SelectItem value="followers">Followers Only</SelectItem>
                    <SelectItem value="private">Private - Only you</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow Direct Messages</Label>
                  <p className="text-xs text-muted-foreground">Let fans message you directly</p>
                </div>
                <Switch checked={allowDMs} onCheckedChange={setAllowDMs} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Stream Count</Label>
                  <p className="text-xs text-muted-foreground">Display play counts on your tracks</p>
                </div>
                <Switch checked={showStreamCount} onCheckedChange={setShowStreamCount} />
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Security
              </CardTitle>
              <CardDescription>
                Protect your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Login Alerts</Label>
                  <p className="text-xs text-muted-foreground">Get notified of new logins</p>
                </div>
                <Switch checked={loginAlerts} onCheckedChange={setLoginAlerts} />
              </div>
              <Button variant="outline" className="w-full mt-2">
                <Lock className="w-4 h-4 mr-2" />
                Change Password
              </Button>
            </CardContent>
          </Card>

          {/* Playback */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Playback
              </CardTitle>
              <CardDescription>
                Audio and playback preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Audio Quality</Label>
                <Select value={audioQuality} onValueChange={setAudioQuality}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (Adaptive)</SelectItem>
                    <SelectItem value="low">Low (96 kbps)</SelectItem>
                    <SelectItem value="medium">Medium (160 kbps)</SelectItem>
                    <SelectItem value="high">High (320 kbps)</SelectItem>
                    <SelectItem value="lossless">Lossless (FLAC)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-Play</Label>
                  <p className="text-xs text-muted-foreground">Automatically play next track</p>
                </div>
                <Switch checked={autoPlay} onCheckedChange={setAutoPlay} />
              </div>
            </CardContent>
          </Card>

          {/* Data & Account */}
          <Card className="glass-card border-destructive/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Data & Account
              </CardTitle>
              <CardDescription>
                Export your data or delete your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full" onClick={handleExportData}>
                <Download className="w-4 h-4 mr-2" />
                Export My Data
              </Button>
              <Button variant="destructive" className="w-full" onClick={handleDeleteAccount}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
              <Button variant="outline" className="w-full" onClick={handleLogout}>
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};