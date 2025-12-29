import { useState } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Link2, Code, Copy, Check, ExternalLink, 
  Share2, Twitter, Facebook, Mail, Calendar
} from "lucide-react";
import { toast } from "sonner";

interface ArtistShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "track" | "album" | "playlist" | "artist";
  id: string;
  title: string;
  artistName?: string;
  coverUrl?: string;
  releaseDate?: string;
}

export function ArtistShareDialog({
  open,
  onOpenChange,
  type,
  id,
  title,
  artistName,
  coverUrl,
  releaseDate
}: ArtistShareDialogProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [embedSize, setEmbedSize] = useState<"small" | "medium" | "large">("medium");

  const baseUrl = window.location.origin;
  const shareUrl = `${baseUrl}/${type}/${id}`;
  const presaveUrl = `${baseUrl}/presave/${type}/${id}`;

  // Generate embed dimensions based on size
  const embedDimensions = {
    small: { width: 300, height: type === "track" ? 80 : 152 },
    medium: { width: 400, height: type === "track" ? 100 : 200 },
    large: { width: 500, height: type === "track" ? 120 : 280 },
  };

  const { width, height } = embedDimensions[embedSize];

  // Generate embed code
  const embedCode = `<iframe 
  src="${shareUrl}/embed" 
  width="${width}" 
  height="${height}" 
  frameborder="0" 
  allow="autoplay; encrypted-media" 
  loading="lazy"
  style="border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);"
></iframe>`;

  // Social share URLs
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out "${title}"${artistName ? ` by ${artistName}` : ""} on TDZ`)}&url=${encodeURIComponent(shareUrl)}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const emailShareUrl = `mailto:?subject=${encodeURIComponent(`Check out "${title}" on TDZ`)}&body=${encodeURIComponent(`I wanted to share this with you: ${shareUrl}`)}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  const isUpcoming = releaseDate && new Date(releaseDate) > new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Share {type.charAt(0).toUpperCase() + type.slice(1)}
          </DialogTitle>
          <DialogDescription>
            Share "{title}" with your fans and followers
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="links" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="links" className="gap-1.5">
              <Link2 className="w-3.5 h-3.5" />
              Links
            </TabsTrigger>
            <TabsTrigger value="embed" className="gap-1.5">
              <Code className="w-3.5 h-3.5" />
              Embed
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-1.5">
              <Share2 className="w-3.5 h-3.5" />
              Social
            </TabsTrigger>
          </TabsList>

          {/* Links Tab */}
          <TabsContent value="links" className="space-y-4 mt-4">
            {/* Direct Link */}
            <div className="space-y-2">
              <Label>Direct Link</Label>
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="font-mono text-sm" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(shareUrl, "Link")}
                >
                  {copied === "Link" ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Pre-save Link (for upcoming releases) */}
            {isUpcoming && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Pre-save Link</Label>
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="w-3 h-3 mr-1" />
                    Releases {new Date(releaseDate!).toLocaleDateString()}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Input value={presaveUrl} readOnly className="font-mono text-sm" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(presaveUrl, "Pre-save link")}
                  >
                    {copied === "Pre-save link" ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this link so fans can save your release before it drops
                </p>
              </div>
            )}

            {/* Open in new tab */}
            <Button 
              variant="outline" 
              className="w-full gap-2"
              onClick={() => window.open(shareUrl, "_blank")}
            >
              <ExternalLink className="w-4 h-4" />
              Open in New Tab
            </Button>
          </TabsContent>

          {/* Embed Tab */}
          <TabsContent value="embed" className="space-y-4 mt-4">
            {/* Size selector */}
            <div className="space-y-2">
              <Label>Embed Size</Label>
              <div className="flex gap-2">
                {(["small", "medium", "large"] as const).map((size) => (
                  <Button
                    key={size}
                    variant={embedSize === size ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEmbedSize(size)}
                    className="flex-1 capitalize"
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div 
                className="bg-muted/50 rounded-lg p-4 flex items-center justify-center border"
                style={{ minHeight: height + 32 }}
              >
                <div 
                  className="bg-background rounded-xl border border-border/50 overflow-hidden shadow-lg"
                  style={{ width, height }}
                >
                  <div className="w-full h-full flex items-center gap-3 p-3 bg-gradient-to-r from-primary/10 to-secondary/10">
                    {coverUrl && (
                      <img 
                        src={coverUrl} 
                        alt={title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate text-sm">{title}</p>
                      {artistName && (
                        <p className="text-xs text-muted-foreground truncate">{artistName}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Embed code */}
            <div className="space-y-2">
              <Label>Embed Code</Label>
              <Textarea 
                value={embedCode} 
                readOnly 
                className="font-mono text-xs h-24 resize-none" 
              />
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => copyToClipboard(embedCode, "Embed code")}
              >
                {copied === "Embed code" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                Copy Embed Code
              </Button>
            </div>
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 gap-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12"
                onClick={() => window.open(twitterShareUrl, "_blank", "width=600,height=400")}
              >
                <div className="w-8 h-8 rounded-full bg-[#1DA1F2]/10 flex items-center justify-center">
                  <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                </div>
                Share on X (Twitter)
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12"
                onClick={() => window.open(facebookShareUrl, "_blank", "width=600,height=400")}
              >
                <div className="w-8 h-8 rounded-full bg-[#1877F2]/10 flex items-center justify-center">
                  <Facebook className="w-4 h-4 text-[#1877F2]" />
                </div>
                Share on Facebook
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12"
                onClick={() => window.open(emailShareUrl)}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                Share via Email
              </Button>
            </div>

            {/* Native share (if supported) */}
            {navigator.share && (
              <Button
                className="w-full gap-2 bg-gradient-to-r from-primary to-secondary"
                onClick={async () => {
                  try {
                    await navigator.share({
                      title: `${title}${artistName ? ` by ${artistName}` : ""}`,
                      text: `Check out "${title}" on TDZ`,
                      url: shareUrl,
                    });
                  } catch (err) {
                    console.error("Share failed:", err);
                  }
                }}
              >
                <Share2 className="w-4 h-4" />
                Share via Device
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
