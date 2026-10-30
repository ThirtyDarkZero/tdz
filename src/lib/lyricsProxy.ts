import { supabase } from "@/integrations/supabase/client";

const RATE = 16000;
const MAX_SECONDS = 15 * 60;

/** 16-bit PCM mono WAV from float samples. */
export function encodeWav(samples: Float32Array, sampleRate = RATE): Blob {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const str = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, "RIFF"); v.setUint32(4, 36 + samples.length * 2, true); str(8, "WAVE");
  str(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, "data"); v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buf], { type: "audio/wav" });
}

/**
 * A small speech-quality copy (16 kHz mono WAV, ~2 MB a minute) of a song, so
 * lyrics can be transcribed even when the master is a large WAV or FLAC.
 * Returns null if the browser can't decode the file.
 */
export async function makeLyricsProxy(file: File): Promise<Blob | null> {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const decoded = await ctx.decodeAudioData(await file.arrayBuffer());
    void ctx.close();
    const seconds = Math.min(decoded.duration, MAX_SECONDS);
    const offline = new OfflineAudioContext(1, Math.ceil(seconds * RATE), RATE);
    const src = offline.createBufferSource();
    src.buffer = decoded;
    src.connect(offline.destination);
    src.start();
    const rendered = await offline.startRendering();
    return encodeWav(rendered.getChannelData(0));
  } catch (e) {
    console.warn("Couldn't make a lyrics copy of", file.name, e);
    return null;
  }
}

/**
 * Start automatic lyrics for a just-uploaded track. Never throws: lyrics are a
 * bonus, and the server retries anything that doesn't finish.
 */
export async function startAutoLyrics(trackId: string, ownerId: string, file: File): Promise<void> {
  try {
    const proxy = await makeLyricsProxy(file);
    if (proxy) {
      const path = `${ownerId}/lyrics-proxy/${trackId}.wav`;
      const { error } = await supabase.storage.from("track-files").upload(path, proxy, { contentType: "audio/wav", upsert: true });
      if (!error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table not in generated types yet
        await (supabase as any).from("lyrics_jobs").update({ proxy_path: path }).eq("track_id", trackId);
      }
    }
    await supabase.functions.invoke("auto-lyrics", { body: { track_id: trackId } });
  } catch (e) {
    console.warn("Auto lyrics will retry in the background", e);
  }
}
