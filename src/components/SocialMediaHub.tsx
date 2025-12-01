import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Instagram, Youtube, Music2, Twitter, 
  Globe, Link2, Save, ExternalLink, Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SocialLink {
  platform: string;
  url: string;
}

const platformsConfig = [
  { 
    id: "website", 
    name: "Website", 
    icon: Globe, 
    color: "from-gray-500 to-slate-500",
    placeholder: "https://yourwebsite.com"
  },
  { 
    id: "instagram", 
    name: "Instagram", 
    icon: Instagram, 
    color: "from-purple-500 to-pink-500",
    placeholder: "https://instagram.com/yourhandle"
  },
  { 
    id: "youtube", 
    name: "YouTube", 
    icon: Youtube, 
    color: "from-red-500 to-orange-500",
    placeholder: "https://youtube.com/@yourchannel"
  },
  { 
    id: "twitter", 
    name: "Twitter/X", 
    icon: Twitter, 
    color: "from-blue-400 to-cyan-400",
    placeholder: "https://twitter.com/yourhandle"
  },
  { 
    id: "soundcloud", 
    name: "SoundCloud", 
    icon: Music2, 
    color: "from-orange-500 to-yellow-500",
    placeholder: "https://soundcloud.com/yourprofile"
  },
  { 
    id: "tiktok", 
    name: "TikTok", 
    icon: Music2, 
    color: "from-pink-500 to-red-500",
    placeholder: "https://tiktok.com/@yourhandle"
  },
];

export const SocialMediaHub = () => {
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSocialLinks();
  }, []);

  const loadSocialLinks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("artist_profiles")
        .select("social_links")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data?.social_links) {
        setSocialLinks(data.social_links as Record<string, string>);
      }
    } catch (error) {
      console.error("Error loading social links:", error);
      toast.error("Failed to load social links");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Filter out empty links
      const filteredLinks = Object.fromEntries(
        Object.entries(socialLinks).filter(([_, url]) => url.trim() !== "")
      );

      const { error } = await supabase
        .from("artist_profiles")
        .update({ social_links: filteredLinks })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Social links saved!", {
        description: "Your links are now visible on your artist profile"
      });
    } catch (error: any) {
      console.error("Error saving social links:", error);
      toast.error("Failed to save", { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const updateLink = (platform: string, url: string) => {
    setSocialLinks(prev => ({ ...prev, [platform]: url }));
  };

  const removeLink = (platform: string) => {
    setSocialLinks(prev => {
      const updated = { ...prev };
      delete updated[platform];
      return updated;
    });
  };

  if (loading) {
    return (
      <Card className="glass-card p-12 text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading social links...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link2 className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-2xl font-display font-bold">Social Links</h2>
            <p className="text-sm text-muted-foreground">
              Connect your social profiles to your artist page
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Links"}
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {platformsConfig.map((platform, idx) => (
          <Card 
            key={platform.id} 
            className="glass-card p-4 hover:border-primary/40 transition-all animate-fade-in"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center`}>
                    <platform.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">{platform.name}</p>
                    {socialLinks[platform.id] && (
                      <Badge variant="secondary" className="text-[10px]">Connected</Badge>
                    )}
                  </div>
                </div>
                {socialLinks[platform.id] && (
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => window.open(socialLinks[platform.id], '_blank')}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeLink(platform.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
              
              <Input
                value={socialLinks[platform.id] || ""}
                onChange={(e) => updateLink(platform.id, e.target.value)}
                placeholder={platform.placeholder}
                className="text-sm"
              />
            </div>
          </Card>
        ))}
      </div>

      {/* Preview Card */}
      <Card className="glass-card p-6">
        <h3 className="font-semibold mb-4">How it appears on your profile</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(socialLinks)
            .filter(([_, url]) => url.trim() !== "")
            .map(([platformId, url]) => {
              const platform = platformsConfig.find(p => p.id === platformId);
              if (!platform) return null;
              return (
                <Button
                  key={platformId}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => window.open(url, '_blank')}
                >
                  <platform.icon className="w-4 h-4" />
                  {platform.name}
                </Button>
              );
            })}
          {Object.keys(socialLinks).filter(k => socialLinks[k]?.trim()).length === 0 && (
            <p className="text-sm text-muted-foreground">
              No links added yet. Add your social profiles above.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}