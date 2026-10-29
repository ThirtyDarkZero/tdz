import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/** Seconds a paid subscriber must listen before a play counts and the artist earns $1. */
export const COUNTS_AT = 30;

type Track = { title: string; artist_name: string | null; file_path: string };
type Phase = "idle" | "playing" | "paused" | "counted";

const R = 52;
const C = 2 * Math.PI * R;

/**
 * The landing page's "press play" moment: plays a real TDZ track and fills a
 * ring for 30 seconds, the point at which a paid subscriber's play counts.
 * The dollar figure then flips from $0.00 to $1.00.
 */
export function PlayMeter() {
  const [track, setTrack] = useState<Track | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const audio = useRef<HTMLAudioElement | null>(null);
  const raf = useRef(0);
  const clock = useRef<{ start: number; base: number }>({ start: 0, base: 0 });

  useEffect(() => {
    let live = true;
    supabase
      .from("tracks")
      .select("title, artist_name, file_path")
      .eq("is_published", true)
      .not("file_path", "is", null)
      .order("play_count", { ascending: false })
      .limit(1)
      .then(({ data }) => { if (live && data?.[0]) setTrack(data[0] as Track); });
    return () => { live = false; };
  }, []);

  const stopLoop = () => cancelAnimationFrame(raf.current);

  const tick = useCallback(() => {
    const a = audio.current;
    // Follow the audio when it plays; otherwise a wall clock, so the meter
    // still demonstrates the rule if the preview can't load.
    const t = a && !a.paused && a.currentTime > 0
      ? a.currentTime
      : clock.current.base + (performance.now() - clock.current.start) / 1000;
    if (t >= COUNTS_AT) {
      setElapsed(COUNTS_AT);
      setPhase("counted");
      return;
    }
    setElapsed(t);
    raf.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => () => { stopLoop(); audio.current?.pause(); }, []);

  const start = () => {
    if (track && !audio.current) {
      const url = supabase.storage.from("tracks").getPublicUrl(track.file_path).data.publicUrl;
      audio.current = new Audio(url);
    }
    audio.current?.play().catch(() => { /* meter keeps running on the clock */ });
    clock.current = { start: performance.now(), base: elapsed };
    setPhase("playing");
    raf.current = requestAnimationFrame(tick);
  };

  const pause = () => {
    stopLoop();
    audio.current?.pause();
    setPhase("paused");
  };

  const replay = () => {
    if (audio.current) audio.current.currentTime = 0;
    setElapsed(0);
    clock.current = { start: performance.now(), base: 0 };
    audio.current?.play().catch(() => {});
    setPhase("playing");
    raf.current = requestAnimationFrame(tick);
  };

  const onPress = () => {
    if (phase === "playing") pause();
    else if (phase === "counted") replay();
    else start();
  };

  const left = Math.max(0, Math.ceil(COUNTS_AT - elapsed));
  const counted = phase === "counted";
  const label =
    phase === "playing" ? "Pause" : counted ? "Play again" : phase === "paused" ? "Resume" : "Press play";

  let status: string;
  if (counted) status = track?.artist_name ? `That play just paid ${track.artist_name} $1.00.` : "That play just paid the artist $1.00.";
  else if (phase === "idle") status = "A play counts once a paying fan listens for 30 seconds.";
  else status = `${left} seconds until this play counts.`;

  return (
    <div className="sr-meter" data-phase={phase}>
      <button
        type="button"
        className="sr-meter__button"
        onClick={onPress}
        aria-label={label}
      >
        <svg className="sr-meter__ring" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r={R} className="sr-meter__track" />
          <circle
            cx="60" cy="60" r={R}
            className="sr-meter__fill"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - elapsed / COUNTS_AT)}
          />
        </svg>
        {phase === "playing" ? <Pause className="sr-meter__icon" aria-hidden="true" /> : <Play className="sr-meter__icon" aria-hidden="true" />}
      </button>

      <div className="sr-meter__readout">
        <p className="sr-meter__amount" aria-hidden="true">
          {counted ? "$1.00" : "$0.00"}
        </p>
        <p className="sr-meter__status" role="status" aria-live="polite">{status}</p>
        {track && phase !== "idle" && (
          <p className="sr-meter__track-name">
            {track.title}{track.artist_name ? `, ${track.artist_name}` : ""}
          </p>
        )}
      </div>
    </div>
  );
}
