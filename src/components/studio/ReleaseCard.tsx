import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Copy, Download, Loader2, Share2 } from "lucide-react";
import { sfx, haptic } from "@/lib/gameSfx";
import { exportShower } from "@/lib/celebrate";
import { cn } from "@/lib/utils";

const body = { fontFamily: "'Raleway', sans-serif" } as const;

export type ReleaseCardData = {
  title: string;
  artistName: string;
  coverUrl?: string | null;
  trackCount: number;
  releaseType: string;
  shareUrl: string;
};

const W = 1080;
const H = 1350;

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function ReleaseCard({ data, onExported }: { data: ReleaseCardData; onExported?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [rendering, setRendering] = useState(true);
  const [exported, setExported] = useState(false);

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const c = canvas.getContext("2d");
    if (!c) return;

    try {
      await (document as any).fonts?.ready;
    } catch {
      /* ignore */
    }

    // Background
    c.fillStyle = "#0D0D0D";
    c.fillRect(0, 0, W, H);
    const glow = c.createRadialGradient(W / 2, 120, 40, W / 2, 300, 900);
    glow.addColorStop(0, "rgba(255,99,71,0.45)");
    glow.addColorStop(1, "rgba(13,13,13,0)");
    c.fillStyle = glow;
    c.fillRect(0, 0, W, H);

    // Star field
    for (let i = 0; i < 160; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const r = Math.random() * 1.6;
      c.fillStyle = `rgba(255,255,255,${0.1 + Math.random() * 0.5})`;
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
    }

    // Cover art
    const size = 720;
    const cx = (W - size) / 2;
    const cy = 190;
    c.save();
    roundRect(c, cx, cy, size, size, 36);
    c.clip();
    let drewCover = false;
    if (data.coverUrl) {
      try {
        const img = await loadImage(data.coverUrl);
        const scale = Math.max(size / img.width, size / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        c.drawImage(img, cx + (size - dw) / 2, cy + (size - dh) / 2, dw, dh);
        drewCover = true;
      } catch {
        drewCover = false;
      }
    }
    if (!drewCover) {
      const g = c.createLinearGradient(cx, cy, cx + size, cy + size);
      g.addColorStop(0, "#1a1a1a");
      g.addColorStop(0.5, "#FF6347");
      g.addColorStop(1, "#0D0D0D");
      c.fillStyle = g;
      c.fillRect(cx, cy, size, size);
    }
    c.restore();
    c.strokeStyle = "rgba(255,99,71,0.55)";
    c.lineWidth = 3;
    roundRect(c, cx, cy, size, size, 36);
    c.stroke();

    // Top label
    c.textAlign = "center";
    c.fillStyle = "#FF6347";
    c.font = "600 26px Raleway, sans-serif";
    c.letterSpacing = "10px" as any;
    c.fillText("NEW RELEASE ON TDZ", W / 2, 110);
    c.letterSpacing = "0px" as any;

    // Title
    c.fillStyle = "#FFFFFF";
    c.font = "120px 'Six Caps', sans-serif";
    const title = data.title.toUpperCase();
    let t = title;
    while (c.measureText(t).width > W - 120 && t.length > 4) t = t.slice(0, -1);
    if (t !== title) t = `${t.trimEnd()}…`;
    c.fillText(t, W / 2, cy + size + 130);

    // Artist
    c.fillStyle = "rgba(255,255,255,0.72)";
    c.font = "500 34px Raleway, sans-serif";
    c.fillText(data.artistName || "TDZ Artist", W / 2, cy + size + 180);

    // Meta pill
    const meta = `${data.releaseType.toUpperCase()} · ${data.trackCount} TRACK${data.trackCount === 1 ? "" : "S"}`;
    c.font = "600 24px Raleway, sans-serif";
    const mw = c.measureText(meta).width + 56;
    c.fillStyle = "rgba(255,99,71,0.14)";
    roundRect(c, (W - mw) / 2, cy + size + 210, mw, 58, 29);
    c.fill();
    c.strokeStyle = "rgba(255,99,71,0.5)";
    c.lineWidth = 2;
    roundRect(c, (W - mw) / 2, cy + size + 210, mw, 58, 29);
    c.stroke();
    c.fillStyle = "#FF6347";
    c.fillText(meta, W / 2, cy + size + 248);

    // $1/stream footer
    c.fillStyle = "#FFFFFF";
    c.font = "96px 'Six Caps', sans-serif";
    c.fillText("$1 PER INTENTIONAL PLAY", W / 2, H - 96);
    c.fillStyle = "rgba(255,255,255,0.55)";
    c.font = "500 24px Raleway, sans-serif";
    c.fillText(data.shareUrl.replace(/^https?:\/\//, ""), W / 2, H - 52);

    setPreview(canvas.toDataURL("image/png"));
    setRendering(false);
  }, [data]);

  useEffect(() => {
    void draw();
  }, [draw]);

  const fileName = `${(data.title || "tdz-release").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-tdz.png`;

  const handleExported = () => {
    setExported(true);
    sfx.exportDone();
    haptic([10, 40, 16]);
    exportShower();
    onExported?.();
    window.setTimeout(() => setExported(false), 1800);
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) {
        sfx.error();
        toast({ title: "Export failed", description: "Could not generate the card image.", variant: "destructive" });
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      handleExported();
      toast({ title: "Release card saved", description: "Share it anywhere — the link is baked in." });
    }, "image/png");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(data.shareUrl);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = data.shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    sfx.click();
    haptic();
    toast({ title: "Link copied", description: data.shareUrl });
  };

  const share = async () => {
    const canvas = canvasRef.current;
    const text = `${data.title} is live on TDZ — every intentional play pays the artist $1.`;
    try {
      const blob: Blob | null = await new Promise((res) => canvas?.toBlob(res, "image/png"));
      const file = blob ? new File([blob], fileName, { type: "image/png" }) : null;
      const nav = navigator as any;
      if (file && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: data.title, text, url: data.shareUrl });
        handleExported();
        return;
      }
      if (nav.share) {
        await nav.share({ title: data.title, text, url: data.shareUrl });
        handleExported();
        return;
      }
      await copyLink();
    } catch {
      /* user dismissed the share sheet */
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} width={W} height={H} className="hidden" />
      <div
        className={cn(
          "relative w-full max-w-[280px] overflow-hidden rounded-xl border border-primary/40 shadow-[0_0_60px_-20px_hsl(var(--primary))] transition-transform duration-500",
          exported ? "scale-105" : "hover:scale-[1.03]",
        )}
      >
        {rendering ? (
          <div className="flex aspect-[4/5] items-center justify-center bg-background/60">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <img src={preview ?? ""} alt={`${data.title} release card`} className="block w-full animate-fade-in" />
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <Button style={body} onClick={download} disabled={rendering} className="hover-scale">
          <Download className="mr-2 h-4 w-4" /> Download card
        </Button>
        <Button style={body} variant="outline" onClick={share} disabled={rendering} className="hover-scale">
          <Share2 className="mr-2 h-4 w-4" /> Share
        </Button>
        <Button style={body} variant="outline" onClick={copyLink} className="hover-scale">
          <Copy className="mr-2 h-4 w-4" /> Copy link
        </Button>
      </div>
    </div>
  );
}
