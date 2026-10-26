import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Copy, Check, Twitter, Facebook, Linkedin, 
  Share2, Music, Heart, Clock, Users, Trophy,
  Download, MessageCircle
} from "lucide-react";

interface ShareProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileData: {
    displayName: string;
    totalPlays: number;
    hoursListened: number;
    artistsFollowed: number;
    likedSongs: number;
    playlists: number;
    tasteScore: number;
    achievements: string[];
    topGenres: string[];
  };
}

export function ShareProfileModal({ open, onOpenChange, profileData }: ShareProfileModalProps) {
  const [copied, setCopied] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<'stats' | 'achievements' | 'taste'>('stats');

  const profileUrl = `${window.location.origin}/profile/${encodeURIComponent(profileData.displayName)}`;

  const getShareText = () => {
    switch (selectedTemplate) {
      case 'stats':
        return `🎵 My TDZ Listening Stats!\n\n` +
          `🎧 ${profileData.totalPlays} plays\n` +
          `⏱️ ${profileData.hoursListened}h listened\n` +
          `❤️ ${profileData.likedSongs} liked songs\n` +
          `📋 ${profileData.playlists} playlists\n\n` +
          `Check out TDZ Distribution - where artists earn $1/stream! 🚀`;
      case 'achievements':
        return `🏆 My TDZ Achievements!\n\n` +
          profileData.achievements.map(a => `✨ ${a}`).join('\n') + '\n\n' +
          `Join TDZ Distribution and start your music journey! 🎶`;
      case 'taste':
        return `🎶 My Music Taste on TDZ\n\n` +
          `📊 Taste Score: ${profileData.tasteScore}%\n` +
          `🎸 Top Genres: ${profileData.topGenres.slice(0, 3).join(', ')}\n` +
          `👥 Following ${profileData.artistsFollowed} artists\n\n` +
          `Discover new music on TDZ! 🔥`;
      default:
        return `Check out my profile on TDZ Distribution! 🎵`;
    }
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(getShareText());
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(profileUrl)}`, '_blank');
  };

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}&quote=${encodeURIComponent(getShareText())}`, '_blank');
  };

  const shareToLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`, '_blank');
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(getShareText() + '\n\n' + profileUrl);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getShareText() + '\n\n' + profileUrl);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const downloadStatsImage = () => {
    // Create a canvas to generate shareable image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1200;
    canvas.height = 630;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0f0f23');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add accent line
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(0, 0, canvas.width, 4);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px system-ui';
    ctx.fillText(`${profileData.displayName}'s Music Stats`, 60, 100);

    // Stats
    ctx.font = 'bold 36px system-ui';
    ctx.fillStyle = '#a855f7';
    
    const stats = [
      { icon: '🎧', label: 'Total Plays', value: profileData.totalPlays.toString() },
      { icon: '⏱️', label: 'Hours Listened', value: `${profileData.hoursListened}h` },
      { icon: '❤️', label: 'Liked Songs', value: profileData.likedSongs.toString() },
      { icon: '📋', label: 'Playlists', value: profileData.playlists.toString() },
    ];

    stats.forEach((stat, i) => {
      const x = 60 + (i % 2) * 550;
      const y = 200 + Math.floor(i / 2) * 150;
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 72px system-ui';
      ctx.fillText(stat.value, x, y);
      
      ctx.fillStyle = '#9ca3af';
      ctx.font = '24px system-ui';
      ctx.fillText(`${stat.icon} ${stat.label}`, x, y + 40);
    });

    // Taste score
    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 36px system-ui';
    ctx.fillText(`📊 Taste Score: ${profileData.tasteScore}%`, 60, 520);

    // TDZ branding
    ctx.fillStyle = '#6b7280';
    ctx.font = '24px system-ui';
    ctx.fillText('TDZ Distribution - Where Artists Earn $1/Stream', 60, 590);

    // Download
    const link = document.createElement('a');
    link.download = 'my-tdz-stats.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    toast.success("Stats image downloaded!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Share Your Music Stats
          </DialogTitle>
          <DialogDescription>
            Share your listening achievements with friends and followers
          </DialogDescription>
        </DialogHeader>

        {/* Template Selection */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={selectedTemplate === 'stats' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTemplate('stats')}
              className="flex-1"
            >
              <Music className="w-4 h-4 mr-1" />
              Stats
            </Button>
            <Button
              variant={selectedTemplate === 'achievements' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTemplate('achievements')}
              className="flex-1"
            >
              <Trophy className="w-4 h-4 mr-1" />
              Achievements
            </Button>
            <Button
              variant={selectedTemplate === 'taste' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTemplate('taste')}
              className="flex-1"
            >
              <Heart className="w-4 h-4 mr-1" />
              Taste
            </Button>
          </div>

          {/* Preview Card */}
          <Card className="p-4 bg-muted/50 border-dashed">
            <p className="text-sm whitespace-pre-line">{getShareText()}</p>
          </Card>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={shareToTwitter}
              className="gap-2 bg-[#1DA1F2]/10 border-[#1DA1F2]/30 hover:bg-[#1DA1F2]/20 hover:border-[#1DA1F2]/50"
            >
              <Twitter className="w-4 h-4 text-[#1DA1F2]" />
              Twitter/X
            </Button>
            <Button
              variant="outline"
              onClick={shareToFacebook}
              className="gap-2 bg-[#4267B2]/10 border-[#4267B2]/30 hover:bg-[#4267B2]/20 hover:border-[#4267B2]/50"
            >
              <Facebook className="w-4 h-4 text-[#4267B2]" />
              Facebook
            </Button>
            <Button
              variant="outline"
              onClick={shareToWhatsApp}
              className="gap-2 bg-[#25D366]/10 border-[#25D366]/30 hover:bg-[#25D366]/20 hover:border-[#25D366]/50"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              WhatsApp
            </Button>
            <Button
              variant="outline"
              onClick={shareToLinkedIn}
              className="gap-2 bg-[#0077B5]/10 border-[#0077B5]/30 hover:bg-[#0077B5]/20 hover:border-[#0077B5]/50"
            >
              <Linkedin className="w-4 h-4 text-[#0077B5]" />
              LinkedIn
            </Button>
          </div>

          {/* Additional Actions */}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={copyToClipboard}
              className="flex-1 gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Text'}
            </Button>
            <Button
              variant="secondary"
              onClick={downloadStatsImage}
              className="flex-1 gap-2"
            >
              <Download className="w-4 h-4" />
              Download Image
            </Button>
          </div>

          {/* Profile Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Profile Link</label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={profileUrl}
                className="text-sm bg-muted"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(profileUrl);
                  toast.success("Link copied!");
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
