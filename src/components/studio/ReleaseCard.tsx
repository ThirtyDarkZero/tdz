import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Copy, Download, ImagePlus, Loader2, RotateCcw, Share2 } from "lucide-react";
import { sfx, haptic } from "@/lib/gameSfx";
import { exportShower } from "@/lib/celebrate";
import { useReducedMotion } from "@/hooks/useReducedMotion";
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

export type Palette = {
  id: string;
  label: string;
  bg: string;
  accent: string;
  text: string;
};

export const PALETTES: Palette[] = [
  { id: "coral", label: "TDZ Coral", bg: "#0D0D0D", accent: "#FF6347", text: "#FFFFFF" },
  { id: "nebula", label: "Nebula", bg: "#0A0A18", accent: "#8B5CF6", text: "#FFFFFF" },
  { id: "solar", label: "Solar", bg: "#120A00", accent: "#FFB020", text: "#FFFFFF" },
  { id: "ice", label: "Ice", bg: "#05121A", accent: "#38BDF8", text: "#FFFFFF" },
  { id: "bone", label: "Bone", bg: "#F4F1EA", accent: "#FF6347", text: "#111111" },
];

const W = 1080;
const H = 1350;

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

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
  const fileRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const reducedMotion = useReducedMotion();

  // Customisable fields
  const [title, setTitle] = useState(data.title);
  const [tagline, setTagline] = useState("$1 PER INTENTIONAL PLAY");
  const [coverUrl, setCoverUrl] = useState<string | null>(data.coverUrl ?? null);
  const [paletteId, setPaletteId] = useState(PALETTES[0].id);

  const [preview, setPreview] = useState<string | null>(null);
  const [rendering, setRendering] = useState(true);
  const [exported, setExported] = useState(false);
  const [status, setStatus] = useState("");

  const palette = useMemo(() => PALETTES.find((p) => p.id === paletteId) ?? PALETTES[0], [paletteId]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const c = canvas.getContext("2d");
    if (!c) return;
    setRendering(true);

    try {
      await (document as any).fonts?.ready;
    } catch {
      /* ignore */
    }

    const { bg, accent, text } = palette;

    c.clearRect(0, 0, W, H);
    c.fillStyle = bg;
    c.fillRect(0, 0, W, H);
    const glow = c.createRadialGradient(W / 2, 120, 40, W / 2, 300, 900);
    glow.addColorStop(0, hexToRgba(accent, 0.45));
    glow.addColorStop(1, hexToRgba(bg, 0));
    c.fillStyle = glow;
    c.fillRect(0, 0, W, H);

    // Star field (skipped on light palettes)
    if (text === "#FFFFFF") {
      for (let i = 0; i < 160; i++) {
        const x = Math.random() * W;
        const y = Math.random() * H;
        const r = Math.random() * 1.6;
        c.fillStyle = `rgba(255,255,255,${0.1 + Math.random() * 0.5})`;
        c.beginPath();
        c.arc(x, y, r, 0, Math.PI * 2);
        c.fill();
      }
    }

    // Cover art
    const size = 720;
    const cx = (W - size) / 2;
    const cy = 190;
    c.save();
    roundRect(c, cx, cy, size, size, 36);
    c.clip();
    let drewCover = false;
    if (coverUrl) {
      try {
        const img = await loadImage(coverUrl);
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
      g.addColorStop(0, hexToRgba(text, 0.08));
      g.addColorStop(0.5, accent);
      g.addColorStop(1, bg);
      c.fillStyle = g;
      c.fillRect(cx, cy, size, size);
    }
    c.restore();
    c.strokeStyle = hexToRgba(accent, 0.55);
    c.lineWidth = 3;
    roundRect(c, cx, cy, size, size, 36);
    c.stroke();

    // Top label
    c.textAlign = "center";
    c.fillStyle = accent;
    c.font = "600 26px Raleway, sans-serif";
    c.letterSpacing = "10px" as any;
    c.fillText("NEW RELEASE ON TDZ", W / 2, 110);
    c.letterSpacing = "0px" as any;

    // Title
    c.fillStyle = text;
    c.font = "120px 'Six Caps', sans-serif";
    const upper = (title || "New Release").toUpperCase();
    let t = upper;
    while (c.measureText(t).width > W - 120 && t.length > 4) t = t.slice(0, -1);
    if (t !== upper) t = `${t.trimEnd()}…`;
    c.fillText(t, W / 2, cy + size + 130);

    // Artist
    c.fillStyle = hexToRgba(text, 0.72);
    c.font = "500 34px Raleway, sans-serif";
    c.fillText(data.artistName || "TDZ Artist", W / 2, cy + size + 180);

    // Meta pill
    const meta = `${data.releaseType.toUpperCase()} · ${data.trackCount} TRACK${data.trackCount === 1 ? "" : "S"}`;
    c.font = "600 24px Raleway, sans-serif";
    const mw = c.measureText(meta).width + 56;
    c.fillStyle = hexToRgba(accent, 0.14);
    roundRect(c, (W - mw) / 2, cy + size + 210, mw, 58, 29);
    c.fill();
    c.strokeStyle = hexToRgba(accent, 0.5);
    c.lineWidth = 2;
    roundRect(c, (W - mw) / 2, cy + size + 210, mw, 58, 29);
    c.stroke();
    c.fillStyle = accent;
    c.fillText(meta, W / 2, cy + size + 248);

    // Tagline + link
    c.fillStyle = text;
    c.font = "96px 'Six Caps', sans-serif";
    let tag = (tagline || "").toUpperCase();
    while (c.measureText(tag).width > W - 100 && tag.length > 4) tag = tag.slice(0, -1);
    c.fillText(tag, W / 2, H - 96);
    c.fillStyle = hexToRgba(text, 0.55);
    c.font = "500 24px Raleway, sans-serif";
    c.fillText(data.shareUrl.replace(/^https?:\/\//, ""), W / 2, H - 52);

    setPreview(canvas.toDataURL("image/png"));
    setRendering(false);
  }, [palette, coverUrl, title, tagline, data.artistName, data.releaseType, data.trackCount, data.shareUrl]);

  // Debounced redraw while typing
  useEffect(() => {
    const id = window.setTimeout(() => void draw(), 220);
    return () => window.clearTimeout(id);
  }, [draw]);

  const fileName = `${(title || "tdz-release").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-tdz.png`;

  const handleExported = (label: string) => {
    setExported(true);
    setStatus(label);
    sfx.exportDone();
    haptic([10, 40, 16]);
    if (!reducedMotion) exportShower();
    onExported?.();
    window.setTimeout(() => setExported(false), 1800);
  };

  const pickCover = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      sfx.error();
      toast({ title: "Unsupported file", description: "Choose a PNG or JPG image.", variant: "destructive" });
      return;
    }
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setCoverUrl(url);
    setStatus("Cover art updated");
    sfx.click();
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) {
        sfx.error();
        setStatus("Export failed");
        toast({ title: "Export failed", description: "Could not generate the card image.", variant: "destructive" });
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      handleExported("Release card downloaded");
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
    setStatus("Share link copied to clipboard");
    toast({ title: "Link copied", description: data.shareUrl });
  };

  const share = async () => {
    const canvas = canvasRef.current;
    const text = `${title} is live on TDZ — every intentional play pays the artist $1.`;
    try {
      const blob: Blob | null = await new Promise((res) => canvas?.toBlob(res, "image/png"));
      const file = blob ? new File([blob], fileName, { type: "image/png" }) : null;
      const nav = navigator as any;
      if (file && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title, text, url: data.shareUrl });
        handleExported("Release card shared");
        return;
      }
      if (nav.share) {
        await nav.share({ title, text, url: data.shareUrl });
        handleExported("Release card shared");
        return;
      }
      await copyLink();
    } catch {
      /* user dismissed the share sheet */
    }
  };

  const reset = () => {
    setTitle(data.title);
    setTagline("$1 PER INTENTIONAL PLAY");
    setPaletteId(PALETTES[0].id);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setCoverUrl(data.coverUrl ?? null);
    setStatus("Card reset to defaults");
    sfx.click();
  };

  return (
    <div className="grid gap-6 text-left md:grid-cols-[minmax(0,280px)_minmax(0,1fr)] md:items-start">
      <canvas ref={canvasRef} width={W} height={H} className="hidden" />

      {/* Preview */}
      <div className="mx-auto w-full max-w-[280px]">
        <div
          className={cn(
            "relative overflow-hidden rounded-xl border border-primary/40 shadow-[0_0_60px_-20px_hsl(var(--primary))]",
            !reducedMotion && "transition-transform duration-500 hover:scale-[1.03]",
            !reducedMotion && exported && "scale-105",
          )}
        >
          {rendering && !preview ? (
            <div className="flex aspect-[4/5] items-center justify-center bg-background/60">
              <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
              <span className="sr-only">Generating release card preview</span>
            </div>
          ) : (
            <img
              src={preview ?? ""}
              alt={`Release card for ${title} by ${data.artistName}`}
              className={cn("block w-full", !reducedMotion && "animate-fade-in")}
            />
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="rc-title" style={body} className="text-xs">Card title</Label>
          <Input
            id="rc-title"
            value={title}
            maxLength={60}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Release title"
            style={body}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rc-tagline" style={body} className="text-xs">Tagline</Label>
          <Input
            id="rc-tagline"
            value={tagline}
            maxLength={40}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="$1 per intentional play"
            style={body}
          />
        </div>

        <div className="space-y-1.5">
          <Label style={body} className="text-xs">Cover art</Label>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => pickCover(e.target.files?.[0])}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              style={body}
              className="min-h-11"
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus className="mr-2 h-4 w-4" aria-hidden="true" /> Upload artwork
            </Button>
            <Button type="button" variant="ghost" size="sm" style={body} className="min-h-11" onClick={reset}>
              <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" /> Reset
            </Button>
          </div>
        </div>

        <fieldset className="space-y-2">
          <legend style={body} className="text-xs text-foreground">Palette</legend>
          <div role="radiogroup" aria-label="Card palette" className="flex flex-wrap gap-2">
            {PALETTES.map((p) => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={p.id === paletteId}
                aria-label={p.label}
                onClick={() => {
                  setPaletteId(p.id);
                  setStatus(`${p.label} palette selected`);
                  sfx.tick();
                }}
                className={cn(
                  "flex min-h-11 items-center gap-2 rounded-full border px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  p.id === paletteId ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/50",
                )}
                style={body}
              >
                <span className="flex h-4 w-4 overflow-hidden rounded-full border border-border/60" aria-hidden="true">
                  <span className="h-full w-1/2" style={{ background: p.bg }} />
                  <span className="h-full w-1/2" style={{ background: p.accent }} />
                </span>
                {p.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button style={body} className="min-h-11" onClick={download} disabled={rendering && !preview}>
            <Download className="mr-2 h-4 w-4" aria-hidden="true" /> Download card
          </Button>
          <Button style={body} variant="outline" className="min-h-11" onClick={share} disabled={rendering && !preview}>
            <Share2 className="mr-2 h-4 w-4" aria-hidden="true" /> Share
          </Button>
          <Button style={body} variant="outline" className="min-h-11" onClick={copyLink}>
            <Copy className="mr-2 h-4 w-4" aria-hidden="true" /> Copy link
          </Button>
        </div>

        <p aria-live="polite" role="status" className="sr-only">{status}</p>
      </div>
    </div>
  );
}
