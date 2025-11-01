import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, Image as ImageIcon, Loader2, Eye } from "lucide-react";

export const ListenerProfileEditor = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setUserId(user.id);

    const { data, error } = await supabase
      .from("listener_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setProfile(data);
      setDisplayName(data.display_name || "");
      setBio(data.bio || "");
      setLocation(data.location || "");
      setProfilePreview(data.profile_image_path || "");
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

  const uploadImage = async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/profile/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("artist-images")
      .upload(fileName, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("artist-images")
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSave = async () => {
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      let profileImageUrl = profile?.profile_image_path;

      if (profileImage) {
        profileImageUrl = await uploadImage(profileImage);
      }

      const profileData: any = {
        user_id: user.id,
        display_name: displayName,
        bio: bio,
        location: location,
        profile_image_path: profileImageUrl,
      };

      if (profile?.id) {
        profileData.id = profile.id;
      }

      const { error } = await supabase
        .from("listener_profiles")
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
              <CardTitle>Edit Your Profile</CardTitle>
              <CardDescription>Update your public listener profile</CardDescription>
            </div>
            {userId && (
              <Button
                onClick={() => navigate(`/listener/${userId}`)}
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
                  accept="image/*"
                  onChange={handleProfileImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, Country"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about yourself..."
              rows={4}
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
    </div>
  );
};
