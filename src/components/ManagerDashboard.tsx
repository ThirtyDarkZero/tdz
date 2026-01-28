import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { UserPlus, Users, TrendingUp, DollarSign, Music, Upload, ChevronRight, Image, X, Check, Lock, HardDrive } from "lucide-react";
import { CatalogImport } from "@/components/CatalogImport";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";

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
  streaming_revenue: number;
  download_revenue: number;
  total_earnings: number;
  created_at: string;
  profile_image?: string;
}

export const ManagerDashboard = () => {
  const { user } = useAuth();
  const { getPlan, loading: subLoading } = useSubscription(user);
  const navigate = useNavigate();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [createProfileOpen, setCreateProfileOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [newArtistName, setNewArtistName] = useState("");
  const [newArtistEmail, setNewArtistEmail] = useState("");
  const [newArtistBio, setNewArtistBio] = useState("");
  const [notes, setNotes] = useState("");
  const [commissionRate, setCommissionRate] = useState("15");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  
  // Upload for artist state
  const [uploadTrackTitle, setUploadTrackTitle] = useState("");
  const [uploadTrackGenre, setUploadTrackGenre] = useState("Hip-Hop");
  const [uploadTrackFile, setUploadTrackFile] = useState<File | null>(null);
  const [uploadCoverFile, setUploadCoverFile] = useState<File | null>(null);
  const [uploadCoverPreview, setUploadCoverPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Enterprise-only gating
  const plan = getPlan();
  const isEnterprise = plan === 'enterprise';

  const genres = [
    "Hip-Hop", "R&B", "Pop", "Rock", "Electronic", "Jazz", "Classical",
    "Country", "Reggae", "Latin", "Soul", "Folk", "Metal", "Ambient", "Spoken Word"
  ];

  // Gate non-enterprise users
  if (!subLoading && !isEnterprise) {
    return (
      <Card className="glass-card p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold mb-2">Enterprise Feature</h3>
        <p className="text-muted-foreground mb-4">
          Artist Management is exclusively available to Enterprise subscribers.
        </p>
        <div className="flex items-center justify-center gap-2 mb-6">
          <Badge variant="outline">{plan.charAt(0).toUpperCase() + plan.slice(1)}</Badge>
          <span className="text-muted-foreground">→</span>
          <Badge className="bg-accent/20 text-accent border-accent/30">Enterprise $49.99/mo</Badge>
        </div>
        <Button onClick={() => navigate("/pricing")} className="bg-gradient-to-r from-primary to-secondary">
          Upgrade to Enterprise
        </Button>
      </Card>
    );
  }

  useEffect(() => {
    loadArtists();
  }, []);

  const loadArtists = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: managedArtists, error: managedError } = await supabase
        .from('manager_artists')
        .select('*')
        .eq('manager_id', user.id);

      if (managedError) throw managedError;

      const artistsWithStats = await Promise.all(
        (managedArtists || []).map(async (ma) => {
          const { data: profile } = await supabase
            .from('artist_profiles')
            .select('artist_name, profile_image_path')
            .eq('user_id', ma.artist_id)
            .single();

          const { data: tracks } = await supabase
            .from('tracks')
            .select('id, play_count')
            .eq('user_id', ma.artist_id);

          const totalTracks = tracks?.length || 0;
          const totalPlays = tracks?.reduce((sum, t) => sum + (t.play_count || 0), 0) || 0;
          const streamingRevenue = totalPlays * 1;

          const { data: downloads } = await supabase
            .from('download_purchases')
            .select('artist_revenue')
            .eq('artist_id', ma.artist_id);

          const downloadRevenue = downloads?.reduce((sum, d) => sum + (d.artist_revenue || 0), 0) || 0;

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
            commission_rate: Number(ma.commission_rate) || 15,
            contract_start_date: ma.contract_start_date,
            contract_end_date: ma.contract_end_date,
            total_tracks: totalTracks,
            total_plays: totalPlays,
            monthly_listeners: monthlyListeners,
            streaming_revenue: streamingRevenue,
            download_revenue: downloadRevenue,
            total_earnings: streamingRevenue + downloadRevenue,
            created_at: ma.created_at,
            profile_image: profile?.profile_image_path
          };
        })
      );

      setArtists(artistsWithStats);
      if (artistsWithStats.length > 0 && !selectedArtist) {
        setSelectedArtist(artistsWithStats[0]);
      }
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

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreateArtistProfile = async () => {
    if (!newArtistName) {
      toast({
        title: "Missing Information",
        description: "Please enter an artist name",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const artistUserId = crypto.randomUUID();
      let profileImagePath = null;

      // Upload profile image if provided
      if (profileImage) {
        const fileExt = profileImage.name.split('.').pop();
        const fileName = `${artistUserId}/profile.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('artist-images')
          .upload(fileName, profileImage);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('artist-images')
            .getPublicUrl(fileName);
          profileImagePath = urlData.publicUrl;
        }
      }

      // Create artist profile
      const { error: profileError } = await supabase
        .from('artist_profiles')
        .insert({
          user_id: artistUserId,
          artist_name: newArtistName,
          bio: newArtistBio || null,
          profile_image_path: profileImagePath
        });

      if (profileError) throw profileError;

      // Link artist to manager
      const { error: linkError } = await supabase
        .from('manager_artists')
        .insert({
          manager_id: user.id,
          artist_id: artistUserId,
          commission_rate: parseFloat(commissionRate),
          notes: notes || null
        });

      if (linkError) throw linkError;

      toast({
        title: "Artist Profile Created",
        description: `${newArtistName} has been added to your roster`
      });

      setCreateProfileOpen(false);
      resetCreateForm();
      loadArtists();
    } catch (error: any) {
      toast({
        title: "Failed to create artist",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const resetCreateForm = () => {
    setNewArtistName("");
    setNewArtistEmail("");
    setNewArtistBio("");
    setNotes("");
    setCommissionRate("15");
    setProfileImage(null);
    setProfileImagePreview(null);
  };

  const handleUploadForArtist = async () => {
    if (!selectedArtist || !uploadTrackTitle || !uploadTrackFile) {
      toast({
        title: "Missing Information",
        description: "Please fill in track title and select an audio file",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      // Upload audio file
      const audioExt = uploadTrackFile.name.split('.').pop();
      const audioFileName = `${selectedArtist.artist_id}/${Date.now()}.${audioExt}`;
      
      const { error: audioUploadError } = await supabase.storage
        .from('track-files')
        .upload(audioFileName, uploadTrackFile);

      if (audioUploadError) throw audioUploadError;

      const { data: audioUrl } = supabase.storage
        .from('track-files')
        .getPublicUrl(audioFileName);

      // Upload cover art if provided
      let coverArtPath = null;
      if (uploadCoverFile) {
        const coverExt = uploadCoverFile.name.split('.').pop();
        const coverFileName = `${selectedArtist.artist_id}/${Date.now()}_cover.${coverExt}`;
        
        const { error: coverUploadError } = await supabase.storage
          .from('album-covers')
          .upload(coverFileName, uploadCoverFile);

        if (!coverUploadError) {
          const { data: coverUrl } = supabase.storage
            .from('album-covers')
            .getPublicUrl(coverFileName);
          coverArtPath = coverUrl.publicUrl;
        }
      }

      // Create track record
      const { error: trackError } = await supabase
        .from('tracks')
        .insert([{
          user_id: selectedArtist.artist_id,
          title: uploadTrackTitle,
          artist_name: selectedArtist.artist_name,
          genre: uploadTrackGenre,
          file_path: audioFileName,
          album_cover_path: coverArtPath,
          is_published: false,
          play_count: 0,
          duration: 0 // Will be updated when audio is processed
        }]);

      if (trackError) throw trackError;

      toast({
        title: "Track Uploaded",
        description: `"${uploadTrackTitle}" has been uploaded for ${selectedArtist.artist_name}`
      });

      setUploadDialogOpen(false);
      resetUploadForm();
      loadArtists();
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadTrackTitle("");
    setUploadTrackGenre("Hip-Hop");
    setUploadTrackFile(null);
    setUploadCoverFile(null);
    setUploadCoverPreview(null);
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadCoverFile(file);
      setUploadCoverPreview(URL.createObjectURL(file));
    }
  };

  const totalRevenue = artists.reduce((sum, artist) => sum + (artist.total_earnings * artist.commission_rate / 100), 0);
  const totalPlays = artists.reduce((sum, artist) => sum + artist.total_plays, 0);
  const totalTracks = artists.reduce((sum, artist) => sum + artist.total_tracks, 0);

  const generateHistoricalData = (artist: Artist) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, i) => ({
      month,
      streams: Math.floor(artist.total_plays * (0.1 + Math.random() * 0.3) * (i + 1) / 6),
      revenue: Math.floor(artist.total_earnings * (0.1 + Math.random() * 0.3) * (i + 1) / 6)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Manager Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage your roster like a sports team</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <HardDrive className="h-4 w-4" />
                Catalog Import
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <CatalogImport 
                artistId={selectedArtist?.artist_id}
                artistName={selectedArtist?.artist_name}
                onComplete={loadArtists}
              />
            </DialogContent>
          </Dialog>
          <Dialog open={createProfileOpen} onOpenChange={setCreateProfileOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Create Artist Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Artist Profile</DialogTitle>
                <DialogDescription>
                  Create and manage an artist profile on their behalf
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Profile Image Upload */}
                <div className="flex justify-center">
                  <div 
                    className="relative w-24 h-24 rounded-full border-2 border-dashed border-muted cursor-pointer hover:border-primary transition-colors overflow-hidden"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {profileImagePreview ? (
                      <img src={profileImagePreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.heic,.heif"
                      className="hidden"
                      onChange={handleProfileImageChange}
                    />
                  </div>
                </div>
                <p className="text-xs text-center text-muted-foreground">Click to upload profile photo</p>
                
                <div>
                  <Label htmlFor="artist-name">Artist Name *</Label>
                  <Input
                    id="artist-name"
                    placeholder="Enter artist name"
                    value={newArtistName}
                    onChange={(e) => setNewArtistName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="artist-email">Contact Email</Label>
                  <Input
                    id="artist-email"
                    type="email"
                    placeholder="artist@example.com"
                    value={newArtistEmail}
                    onChange={(e) => setNewArtistEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="artist-bio">Bio</Label>
                  <Textarea
                    id="artist-bio"
                    placeholder="Artist biography..."
                    value={newArtistBio}
                    onChange={(e) => setNewArtistBio(e.target.value)}
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
                <Button onClick={handleCreateArtistProfile} className="w-full">
                  Create Artist Profile
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:border-primary/60 hover:scale-105 transition-all group cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Artists</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{artists.length}</div>
            <p className="text-xs text-muted-foreground">Active roster</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/60 hover:scale-105 transition-all group cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tracks</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all">
              <Music className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTracks}</div>
            <p className="text-xs text-muted-foreground">Across all artists</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/60 hover:scale-105 transition-all group cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Streams</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg group-hover:scale-110 transition-all">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPlays.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Combined plays</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/60 hover:scale-105 transition-all group cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Your Commission</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Based on earnings</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Artist Roster Sidebar */}
        <Card className="glass-card lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Your Roster
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="space-y-1 p-4 pt-0">
                {artists.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No artists yet</p>
                  </div>
                ) : (
                  artists.map((artist) => (
                    <button
                      key={artist.id}
                      onClick={() => setSelectedArtist(artist)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                        selectedArtist?.id === artist.id 
                          ? 'bg-primary/20 border border-primary/50' 
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={artist.profile_image} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                          {artist.artist_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-medium truncate">{artist.artist_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {artist.total_tracks} tracks • ${artist.total_earnings.toLocaleString()}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Artist Detail View */}
        <div className="lg:col-span-3 space-y-6">
          {selectedArtist ? (
            <>
              {/* Artist Header */}
              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-20 h-20 border-4 border-primary/30">
                      <AvatarImage src={selectedArtist.profile_image} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-2xl">
                        {selectedArtist.artist_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold">{selectedArtist.artist_name}</h2>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary">{selectedArtist.total_tracks} Tracks</Badge>
                        <Badge variant="secondary">{selectedArtist.commission_rate}% Commission</Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-2xl font-bold">{selectedArtist.total_plays.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Total Streams</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{selectedArtist.monthly_listeners.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Monthly Listeners</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-500">${selectedArtist.total_earnings.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Total Earnings</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-primary">
                            ${(selectedArtist.total_earnings * selectedArtist.commission_rate / 100).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">Your Commission</p>
                        </div>
                      </div>
                    </div>
                    <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2">
                          <Upload className="w-4 h-4" />
                          Upload for Artist
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Upload Track for {selectedArtist.artist_name}</DialogTitle>
                          <DialogDescription>
                            Upload music on behalf of your artist
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          {/* Cover Art */}
                          <div className="flex justify-center">
                            <div 
                              className="relative w-32 h-32 rounded-lg border-2 border-dashed border-muted cursor-pointer hover:border-primary transition-colors overflow-hidden"
                              onClick={() => coverInputRef.current?.click()}
                            >
                              {uploadCoverPreview ? (
                                <img src={uploadCoverPreview} alt="Cover" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center">
                                  <Image className="w-8 h-8 text-muted-foreground mb-2" />
                                  <span className="text-xs text-muted-foreground">Cover Art</span>
                                </div>
                              )}
                              <input
                                ref={coverInputRef}
                                type="file"
                                accept="image/*,.heic,.heif"
                                className="hidden"
                                onChange={handleCoverImageChange}
                              />
                            </div>
                          </div>

                          <div>
                            <Label>Track Title *</Label>
                            <Input
                              placeholder="Enter track title"
                              value={uploadTrackTitle}
                              onChange={(e) => setUploadTrackTitle(e.target.value)}
                            />
                          </div>

                          <div>
                            <Label>Genre</Label>
                            <Select value={uploadTrackGenre} onValueChange={setUploadTrackGenre}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {genres.map(g => (
                                  <SelectItem key={g} value={g}>{g}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Audio File *</Label>
                            <div 
                              className="border-2 border-dashed border-muted rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                              onClick={() => audioInputRef.current?.click()}
                            >
                              {uploadTrackFile ? (
                                <div className="flex items-center justify-center gap-2">
                                  <Check className="w-5 h-5 text-green-500" />
                                  <span className="text-sm">{uploadTrackFile.name}</span>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setUploadTrackFile(null);
                                    }}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div>
                                  <Music className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                  <p className="text-sm text-muted-foreground">Click to select audio file</p>
                                  <p className="text-xs text-muted-foreground">MP3, WAV, FLAC up to 500MB</p>
                                </div>
                              )}
                              <input
                                ref={audioInputRef}
                                type="file"
                                accept="audio/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) setUploadTrackFile(file);
                                }}
                              />
                            </div>
                          </div>

                          <Button 
                            onClick={handleUploadForArtist} 
                            className="w-full"
                            disabled={uploading || !uploadTrackFile || !uploadTrackTitle}
                          >
                            {uploading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Track
                              </>
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              {/* Analytics */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Streaming Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={generateHistoricalData(selectedArtist)}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <Tooltip />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="hsl(var(--primary))" 
                          fillOpacity={1} 
                          fill="url(#colorRevenue)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Stream Growth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={generateHistoricalData(selectedArtist)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="streams" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Breakdown */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                      <p className="text-sm text-muted-foreground">Streaming Revenue</p>
                      <p className="text-2xl font-bold text-green-500">${selectedArtist.streaming_revenue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-1">$1 per stream × {selectedArtist.total_plays.toLocaleString()} streams</p>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <p className="text-sm text-muted-foreground">Download Revenue</p>
                      <p className="text-2xl font-bold text-blue-500">${selectedArtist.download_revenue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-1">From direct purchases</p>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                      <p className="text-sm text-muted-foreground">Your Commission ({selectedArtist.commission_rate}%)</p>
                      <p className="text-2xl font-bold text-primary">
                        ${(selectedArtist.total_earnings * selectedArtist.commission_rate / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">From total earnings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Artist Selected</h3>
                <p className="text-muted-foreground">Select an artist from your roster to view their analytics</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
