import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Music2, Play } from "lucide-react";
import tdzBadge from "@/assets/tdz-distribution-badge.webp";

/** Brand colour per streaming service, used for the small tile beside each link. */
const PLATFORM_COLORS: Record<string, string> = {
  spotify: "#1DB954",
  "apple music": "#FA243C",
  youtube: "#FF0000",
  "youtube music": "#FF0000",
  "amazon music": "#25D1DA",
  tidal: "#FFFFFF",
  soundcloud: "#FF5500",
  deezer: "#A238FF",
  audiomack: "#FFA200",
  bandcamp: "#629AA9",
};

export interface CardLink {
  name: string;
  /** Outside URL, or an in-app path when `internal` is set. */
  href: string;
  internal?: boolean;
  onClick?: () => void;
}

interface ReleaseCardProps {
  art: string | null;
  title: string;
  artist?: string | null;
  /** Short line under the artist, e.g. "Out March 3". */
  status?: string | null;
  description?: string | null;
  /** In-app TDZ player link, shown first. */
  tdz?: CardLink | null;
  links?: CardLink[];
  /** Extra content under the links (the pre-save form). */
  children?: ReactNode;
  /** Builder preview: links don't navigate. */
  preview?: boolean;
  /** Button text on outside links. */
  action?: string;
}

const Row = ({ link, tdz, preview, action = "Listen" }: { link: CardLink; tdz?: boolean; preview?: boolean; action?: string }) => {
  const color = PLATFORM_COLORS[link.name.toLowerCase()] ?? "#94a3b8";
  const body = (
    <>
      <span className="flex items-center gap-3 min-w-0">
        {tdz ? (
          <img src={tdzBadge} alt="" className="w-9 h-9 shrink-0 object-contain" />
        ) : (
          <span className="w-9 h-9 shrink-0 rounded-lg grid place-items-center" style={{ background: `${color}22`, color }}>
            <Music2 className="w-4 h-4" aria-hidden />
          </span>
        )}
        <span className="font-medium truncate">{tdz ? "TDZ" : link.name}</span>
      </span>
      <span
        className={
          tdz
            ? "flex items-center gap-1 shrink-0 rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-sm font-semibold"
            : "shrink-0 rounded-full border border-white/25 px-4 py-1.5 text-sm"
        }
      >
        {tdz && <Play className="w-3.5 h-3.5" fill="currentColor" aria-hidden />}
        {tdz ? "Play" : action}
      </span>
    </>
  );
  const cls = "flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-white/5 focus-visible:bg-white/10 outline-none";
  if (preview) return <div className={cls}>{body}</div>;
  return link.internal
    ? <Link to={link.href} onClick={link.onClick} className={cls}>{body}</Link>
    : <a href={link.href} target="_blank" rel="noopener noreferrer" onClick={link.onClick} className={cls}>{body}</a>;
};

/** The card fans see on smart links and pre-save pages: artwork, every link, TDZ Distribution badge. */
export function ReleaseCard({ art, title, artist, status, description, tdz, links = [], children, preview, action }: ReleaseCardProps) {
  const label = `${title}${artist ? ` by ${artist}` : ""}`;
  return (
    <article aria-label={label} className="w-full max-w-sm rounded-3xl border border-white/10 bg-black/55 backdrop-blur-2xl shadow-2xl overflow-hidden text-white">
      <div className="p-3">
        {art
          ? <img src={art} alt={`${title} artwork`} className="w-full aspect-square rounded-2xl object-cover" />
          : <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-primary/30 to-white/5 grid place-items-center"><Music2 className="w-12 h-12 text-white/40" aria-hidden /></div>}
      </div>
      <div className="px-5 pt-2 pb-4 text-center">
        <h1 className="text-5xl leading-none tracking-wide break-words" style={{ fontFamily: "'Six Caps', sans-serif" }}>{title || "Untitled"}</h1>
        {artist && <p className="mt-2 text-white/80">{artist}</p>}
        {status && <p className="mt-1 text-sm text-primary">{status}</p>}
        {description && <p className="mt-3 text-sm text-white/60">{description}</p>}
      </div>
      {(tdz || links.length > 0) && (
        <nav aria-label="Listen on" className="mx-3 rounded-2xl bg-white/[0.06] divide-y divide-white/10 overflow-hidden">
          {tdz && <Row link={tdz} tdz preview={preview} />}
          {links.map((l) => <Row key={l.name} link={l} preview={preview} action={action} />)}
        </nav>
      )}
      {children && <div className="px-4 pt-4">{children}</div>}
      <footer className="mt-4 border-t border-white/10">
        {preview ? (
          <span className="flex items-center justify-center gap-2 py-3 text-sm text-white/70">
            <img src={tdzBadge} alt="" className="w-8 h-8 object-contain" />TDZ Distribution
          </span>
        ) : (
          <Link to="/" className="flex items-center justify-center gap-2 py-3 text-sm text-white/70 hover:text-white">
            <img src={tdzBadge} alt="" className="w-8 h-8 object-contain" />TDZ Distribution
          </Link>
        )}
      </footer>
    </article>
  );
}

/** Full-screen backdrop: the artwork, blurred, behind the card. */
export function ReleaseCardPage({ art, children }: { art: string | null; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-black relative overflow-hidden grid place-items-center px-4 py-8">
      {art && <img src={art} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-50 scale-125" />}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/80" aria-hidden />
      <div className="relative w-full flex justify-center">{children}</div>
    </main>
  );
}
