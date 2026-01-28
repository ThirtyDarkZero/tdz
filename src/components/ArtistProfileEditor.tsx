import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, Image as ImageIcon, Loader2, Eye, Youtube, Music, Link as LinkIcon, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const ArtistProfileEditor = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [artistName, setArtistName] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string>("");
  const [bannerPreview, setBannerPreview] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  
  // Social links
  const [socialLinks, setSocialLinks] = useState<any>({
    youtube_music: '',
    spotify: '',
    apple_music: '',
    soundcloud: '',
    instagram: '',
    twitter: '',
    website: ''
  });
  
  // External discography state
  const [externalDiscography, setExternalDiscography] = useState<any[]>([]);
  const [loadingDiscography, setLoadingDiscography] = useState(false);
  const [discographyLinked, setDiscographyLinked] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setUserId(user.id);

    const { data, error } = await supabase
      .from("artist_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setProfile(data);
      setArtistName(data.artist_name || "");
      setBio(data.bio || "");
      setProfilePreview(data.profile_image_path || "");
      setBannerPreview(data.banner_image_path || "");
      
      // Load social links
      if (data.social_links) {
        const links = typeof data.social_links === 'string' 
          ? JSON.parse(data.social_links) 
          : data.social_links;
        setSocialLinks({
          youtube_music: links.youtube_music || '',
          spotify: links.spotify || '',
          apple_music: links.apple_music || '',
          soundcloud: links.soundcloud || '',
          instagram: links.instagram || '',
          twitter: links.twitter || '',
          website: data.website || links.website || '' // Prefer dedicated column
        });
        
        // Check if discography is linked
        if (links.youtube_music || links.spotify) {
          setDiscographyLinked(true);
        }
      }
    }
    setLoading(false);
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File, bucket: string, folder: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${folder}/${Date.now()}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  };

  // Fetch external discography from YouTube Music channel URL or artist name
  const fetchExternalDiscography = async () => {
    const youtubeUrl = socialLinks.youtube_music?.trim();
    
    setLoadingDiscography(true);
    try {
      // First try to fetch from YouTube Music channel URL if provided
      if (youtubeUrl && youtubeUrl.includes('youtube.com')) {
        console.log('Fetching from YouTube Music URL:', youtubeUrl);
        
        const { data: ytData, error: ytError } = await supabase.functions.invoke('youtube-search', {
          body: { 
            type: 'channel',
            channelUrl: youtubeUrl,
            maxResults: 50
          }
        });
        
        if (ytError) {
          console.error('YouTube channel fetch error:', ytError);
        } else if (ytData?.results?.length > 0) {
          setExternalDiscography(ytData.results);
          setDiscographyLinked(true);
          toast.success(`Found ${ytData.results.length} tracks from ${ytData.channelInfo?.title || 'YouTube Music'}!`);
          return;
        } else if (ytData?.channelInfo) {
          // Channel found but no videos
          toast.info(`Channel "${ytData.channelInfo.title}" found but no public videos available.`);
        } else if (ytData?.error === 'Channel not found') {
          toast.error("Could not find YouTube channel. Please check the URL format.");
        }
      }
      
      // Fallback: Search by artist name if no URL or URL failed
      if (!artistName) {
        toast.error("Please enter your artist name or YouTube Music channel URL");
        return;
      }
      
      // Try AllMusic first for professional catalog
      const { data: amData, error: amError } = await supabase.functions.invoke('allmusic-artist', {
        body: { artistName, includeDiscography: true }
      });
      
      if (!amError && amData?.artist?.discography?.length > 0) {
        setExternalDiscography(amData.artist.discography);
        setDiscographyLinked(true);
        toast.success(`Found ${amData.artist.discography.length} albums/releases from AllMusic!`);
        return;
      }
      
      // Final fallback: YouTube search with artist name
      const { data: ytSearchData } = await supabase.functions.invoke('youtube-search', {
        body: { 
          query: `${artistName} - Topic`,
          maxResults: 20,
          type: 'search',
          officialOnly: true
        }
      });
      
      if (ytSearchData?.results?.length > 0) {
        setExternalDiscography(ytSearchData.results);
        setDiscographyLinked(true);
        toast.success(`Found ${ytSearchData.results.length} tracks for "${artistName}"!`);
      } else {
        toast.info("No external discography found. Your TDZ music will still appear on your profile.");
      }
    } catch (error: any) {
      console.error("Error fetching discography:", error);
      toast.error("Failed to fetch external discography. Please try again.");
    } finally {
      setLoadingDiscography(false);
    }
  };

  const handleSocialLinkChange = (key: string, value: string) => {
    setSocialLinks((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      let profileImageUrl = profile?.profile_image_path;
      let bannerImageUrl = profile?.banner_image_path;

      if (profileImage) {
        profileImageUrl = await uploadImage(profileImage, "artist-images", "profile");
      }

      if (bannerImage) {
        bannerImageUrl = await uploadImage(bannerImage, "artist-images", "banner");
      }

      const profileData: any = {
        user_id: user.id,
        artist_name: artistName,
        bio: bio,
        profile_image_path: profileImageUrl,
        banner_image_path: bannerImageUrl,
        social_links: socialLinks,
        website: socialLinks.website || null, // Also store website in dedicated column
      };

      // Include ID if profile exists for proper update
      if (profile?.id) {
        profileData.id = profile.id;
      }

      const { error } = await supabase
        .from("artist_profiles")
        .upsert(profileData);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      loadProfile();
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading profile...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card-premium">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Edit Artist Profile</CardTitle>
              <CardDescription>Update your public artist profile</CardDescription>
            </div>
            {userId && (
              <Button
                onClick={() => navigate(`/artist/${userId}`)}
                variant="outline"
                size="sm"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Banner Image */}
          <div className="space-y-2">
            <Label>Banner Image</Label>
            <div className="relative h-48 rounded-xl overflow-hidden bg-gradient-to-br from-primary/30 to-secondary/30">
              {bannerPreview ? (
                <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
              <label className="absolute bottom-4 right-4">
                <Button size="sm" className="shadow-glow cursor-pointer" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Banner
                  </span>
                </Button>
                <input
                  type="file"
                  accept="image/*,.heic,.heif"
                  onChange={handleBannerImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Profile Image */}
          <div className="space-y-2">
            <Label>Profile Picture</Label>
            <div className="flex items-center gap-6">
              <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-primary to-primary-glow">
                {profilePreview ? (
                  <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="w-12 h-12 text-primary-foreground" />
                  </div>
                )}
              </div>
              <label>
                <Button variant="outline" asChild className="cursor-pointer">
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photo
                  </span>
                </Button>
                <input
                  type="file"
                  accept="image/*,.heic,.heif"
                  onChange={handleProfileImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Artist Name */}
          <div className="space-y-2">
            <Label htmlFor="artistName">Artist Name</Label>
            <Input
              id="artistName"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="Your artist name"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell your fans about yourself..."
              rows={6}
            />
          </div>

          <Button 
            onClick={handleSave} 
            disabled={uploading}
            className="w-full shadow-glow"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Profile"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Social Links & Music Platforms */}
      <Card className="glass-card-premium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-primary" />
            Social Links & Music Platforms
          </CardTitle>
          <CardDescription>
            Link your music platforms to import your discography
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* YouTube Music - Primary for discography import */}
          <div className="space-y-2">
            <Label htmlFor="youtube_music" className="flex items-center gap-2">
              <Youtube className="w-4 h-4 text-red-500" />
              YouTube Music Channel
              {discographyLinked && (
                <Badge variant="outline" className="ml-2 bg-green-500/10 text-green-500 border-green-500/20">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Linked
                </Badge>
              )}
            </Label>
            <div className="flex gap-2">
              <Input
                id="youtube_music"
                value={socialLinks.youtube_music}
                onChange={(e) => handleSocialLinkChange('youtube_music', e.target.value)}
                placeholder="https://music.youtube.com/channel/..."
                className="flex-1"
              />
              <Button 
                variant="outline" 
                onClick={fetchExternalDiscography}
                disabled={loadingDiscography}
              >
                {loadingDiscography ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Music className="w-4 h-4 mr-2" />
                    Import Discography
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Link your YouTube Music to automatically show your existing catalog on your TDZ profile
            </p>
          </div>

          {/* Other platforms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="spotify">Spotify</Label>
              <Input
                id="spotify"
                value={socialLinks.spotify}
                onChange={(e) => handleSocialLinkChange('spotify', e.target.value)}
                placeholder="https://open.spotify.com/artist/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apple_music">Apple Music</Label>
              <Input
                id="apple_music"
                value={socialLinks.apple_music}
                onChange={(e) => handleSocialLinkChange('apple_music', e.target.value)}
                placeholder="https://music.apple.com/artist/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="soundcloud">SoundCloud</Label>
              <Input
                id="soundcloud"
                value={socialLinks.soundcloud}
                onChange={(e) => handleSocialLinkChange('soundcloud', e.target.value)}
                placeholder="https://soundcloud.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={socialLinks.instagram}
                onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                placeholder="https://instagram.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter/X</Label>
              <Input
                id="twitter"
                value={socialLinks.twitter}
                onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                placeholder="https://twitter.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={socialLinks.website}
                onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Social Links"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* External Discography Preview */}
      {externalDiscography.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="w-5 h-5 text-primary" />
              Imported Discography Preview
            </CardTitle>
            <CardDescription>
              These releases will appear on your TDZ artist profile, sourced from YouTube Music
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {externalDiscography.slice(0, 10).map((item: any, idx: number) => (
                <div key={idx} className="space-y-2">
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    {item.coverArt || item.thumbnail ? (
                      <img 
                        src={item.coverArt || item.thumbnail} 
                        alt={item.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  {item.year && (
                    <p className="text-xs text-muted-foreground">{item.year}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
