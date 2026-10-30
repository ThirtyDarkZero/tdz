// Pure helpers for automatic lyrics transcription + timing (tested in lib_test.ts).

export interface LyricLine { time: number; text: string }
export interface AutoLyrics { instrumental: boolean; language: string | null; lines: LyricLine[] }

export const PROMPT = `Transcribe the sung or rapped lyrics of this song with line timing.
Return ONLY JSON, no prose:
{"instrumental": boolean, "language": "<ISO 639-1 code or null>",
 "lines": [{"time": <seconds from start when the line begins, 2 decimals>, "text": "<line>"}]}
Rules: one line per sung phrase as it would appear in a lyric booklet; keep the artist's
slang and spelling; no section labels like [Chorus]; write [?] for words you can't make out;
if there are no vocals, return {"instrumental": true, "language": null, "lines": []}.`;

/** Pull the JSON object out of a model reply (handles ```json fences and stray prose). */
export function extractJson(reply: string): unknown {
  const fenced = reply.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : reply;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("No JSON in model reply");
  return JSON.parse(body.slice(start, end + 1));
}

/**
 * Validate and clean model output: drop empty/label lines, clamp times to the
 * track length, and make times non-decreasing so the karaoke view never jumps back.
 */
export function cleanLyrics(raw: unknown, durationSec?: number | null): AutoLyrics {
  const o = (raw ?? {}) as Record<string, unknown>;
  const list = Array.isArray(o.lines) ? o.lines : [];
  const max = durationSec && durationSec > 0 ? durationSec : Infinity;
  const lines: LyricLine[] = [];
  let last = 0;
  for (const item of list) {
    const r = (item ?? {}) as Record<string, unknown>;
    const text = String(r.text ?? "").replace(/\s+/g, " ").trim();
    if (!text || /^\[(?:intro|verse|chorus|hook|bridge|outro|pre-chorus)[^\]]*\]$/i.test(text)) continue;
    let t = Number(r.time);
    if (!Number.isFinite(t) || t < 0) t = last;
    t = Math.min(Math.max(t, last), max);
    last = t;
    lines.push({ time: Math.round(t * 100) / 100, text: text.slice(0, 300) });
  }
  const lang = typeof o.language === "string" && /^[a-z]{2}$/i.test(o.language) ? o.language.toLowerCase() : null;
  return { instrumental: o.instrumental === true || lines.length === 0, language: lang, lines };
}

/** Base64 without spreading the whole buffer onto the call stack. */
export function toBase64(bytes: Uint8Array): string {
  let s = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    s += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(s);
}

/** Audio format name for the model, from a storage path. */
export function audioFormat(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return ({ mp3: "mp3", wav: "wav", flac: "flac", m4a: "m4a", aac: "aac", ogg: "ogg" } as Record<string, string>)[ext] ?? "mp3";
}
