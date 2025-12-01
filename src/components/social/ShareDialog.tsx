import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Copy, 
  Check, 
  Twitter, 
  Facebook, 
  Link2, 
  QrCode, 
  Send,
  Music,
  ListMusic,
  User,
  Disc,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareType: 'track' | 'album' | 'playlist' | 'artist';
  shareData: {
    id: string;
    title: string;
    subtitle?: string;
    imageUrl?: string;
  };
}

export function ShareDialog({ open, onOpenChange, shareType, shareData }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const { toast } = useToast();

  const shareUrl = `${window.location.origin}/${shareType}/${shareData.id}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({ title: 'Link copied!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareToFeed = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: 'Please sign in to share', variant: 'destructive' });
      return;
    }

    setIsPosting(true);

    const postTypeMap = {
      track: 'share_track',
      album: 'share_album',
      playlist: 'share_playlist',
      artist: 'share_artist'
    };

    const sharedIdField = {
      track: 'shared_track_id',
      album: 'shared_album_id',
      playlist: 'shared_playlist_id',
      artist: 'shared_artist_id'
    };

    await supabase.from('posts').insert({
      user_id: user.id,
      content: postContent || `Check out this ${shareType}!`,
      post_type: postTypeMap[shareType],
      [sharedIdField[shareType]]: shareData.id
    });

    await supabase.from('user_shares').insert({
      user_id: user.id,
      share_type: shareType,
      [`${shareType}_id`]: shareData.id,
      share_method: 'internal'
    });

    await supabase.from('activity_log').insert({
      user_id: user.id,
      activity_type: 'shared',
      target_type: shareType,
      target_id: shareData.id
    });

    setIsPosting(false);
    toast({ title: 'Shared to your feed!' });
    onOpenChange(false);
  };

  const handleExternalShare = (platform: 'twitter' | 'facebook') => {
    const text = `Check out "${shareData.title}" on TDZ!`;
    let url = '';

    if (platform === 'twitter') {
      url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    } else if (platform === 'facebook') {
      url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    }

    window.open(url, '_blank', 'width=600,height=400');
  };

  const getIcon = () => {
    switch (shareType) {
      case 'track': return <Music className="w-8 h-8 text-primary" />;
      case 'album': return <Disc className="w-8 h-8 text-primary" />;
      case 'playlist': return <ListMusic className="w-8 h-8 text-primary" />;
      case 'artist': return <User className="w-8 h-8 text-primary" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle>Share {shareType}</DialogTitle>
        </DialogHeader>

        {/* Preview */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-accent/30 border border-border/50">
          <div className="w-16 h-16 rounded-lg bg-primary/20 flex items-center justify-center overflow-hidden">
            {shareData.imageUrl ? (
              <img src={shareData.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              getIcon()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold truncate">{shareData.title}</h4>
            {shareData.subtitle && (
              <p className="text-sm text-muted-foreground truncate">{shareData.subtitle}</p>
            )}
          </div>
        </div>

        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="feed">Feed</TabsTrigger>
            <TabsTrigger value="link">Link</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Add a message</Label>
              <Textarea
                placeholder="What do you think about this?"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                className="bg-background/50 border-border/50 resize-none"
              />
            </div>
            <Button onClick={handleShareToFeed} className="w-full" disabled={isPosting}>
              {isPosting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Share to Feed
            </Button>
          </TabsContent>

          <TabsContent value="link" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Share link</Label>
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="bg-background/50 border-border/50"
                />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2">
                <QrCode className="w-4 h-4" />
                QR Code
              </Button>
              <Button variant="outline" className="flex-1 gap-2" onClick={handleCopy}>
                <Link2 className="w-4 h-4" />
                Copy Link
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="social" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => handleExternalShare('twitter')}
              >
                <Twitter className="w-6 h-6" />
                <span className="text-xs">Twitter</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => handleExternalShare('facebook')}
              >
                <Facebook className="w-6 h-6" />
                <span className="text-xs">Facebook</span>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
