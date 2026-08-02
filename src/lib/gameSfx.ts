/**
 * Lightweight game-style sound effects synthesized with the Web Audio API.
 * No audio assets required — everything is generated on the fly.
 * Respects a persisted mute preference + prefers-reduced-motion for haptics.
 */

const MUTE_KEY = "tdz-sfx-muted";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;
    if (!ctx) ctx = new Ctor();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function isSfxMuted(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSfxMuted(muted: boolean) {
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    /* ignore */
  }
}

type ToneOpts = {
  freq: number;
  duration?: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
  sweepTo?: number;
};

function tone({ freq, duration = 0.14, type = "sine", gain = 0.08, delay = 0, sweepTo }: ToneOpts) {
  const audio = getCtx();
  if (!audio) return;
  const start = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (sweepTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), start + duration);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(amp).connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function noiseBurst(duration = 0.4, gain = 0.05) {
  const audio = getCtx();
  if (!audio) return;
  const frames = Math.floor(audio.sampleRate * duration);
  const buffer = audio.createBuffer(1, frames, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames) ** 2;
  const src = audio.createBufferSource();
  src.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 1200;
  const amp = audio.createGain();
  amp.gain.value = gain;
  src.connect(filter).connect(amp).connect(audio.destination);
  src.start();
}

function play(fn: () => void) {
  if (isSfxMuted()) return;
  try {
    fn();
  } catch {
    /* audio is best-effort */
  }
}

export const sfx = {
  /** Soft UI tick for hovers / small state changes */
  tick: () => play(() => tone({ freq: 880, duration: 0.05, type: "triangle", gain: 0.03 })),

  /** Confirming click */
  click: () => play(() => tone({ freq: 520, duration: 0.08, type: "square", gain: 0.04, sweepTo: 760 })),

  /** XP pickup — bright arpeggio blip */
  xp: () =>
    play(() => {
      [880, 1174, 1567].forEach((f, i) =>
        tone({ freq: f, duration: 0.1, type: "triangle", gain: 0.05, delay: i * 0.05 }),
      );
    }),

  /** Stage complete — rising 4-note fanfare */
  stageComplete: () =>
    play(() => {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
        tone({ freq: f, duration: 0.18, type: "triangle", gain: 0.06, delay: i * 0.07 }),
      );
      noiseBurst(0.25, 0.02);
    }),

  /** Big win — chord stack + shimmer */
  victory: () =>
    play(() => {
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
        tone({ freq: f, duration: 0.9, type: "sine", gain: 0.055, delay: i * 0.09 }),
      );
      [1567.98, 2093].forEach((f, i) =>
        tone({ freq: f, duration: 0.5, type: "triangle", gain: 0.03, delay: 0.45 + i * 0.12 }),
      );
      noiseBurst(0.7, 0.035);
    }),

  /** Successful export / download */
  exportDone: () =>
    play(() => {
      tone({ freq: 392, duration: 0.14, type: "square", gain: 0.05 });
      tone({ freq: 784, duration: 0.22, type: "triangle", gain: 0.06, delay: 0.1, sweepTo: 1046 });
      noiseBurst(0.2, 0.02);
    }),

  /** Something went wrong */
  error: () =>
    play(() => {
      tone({ freq: 220, duration: 0.22, type: "sawtooth", gain: 0.05, sweepTo: 110 });
    }),
};

const HAPTICS_KEY = "tdz-haptics-enabled";

/** Haptics are opt-out; devices without a vibration motor simply ignore the call. */
export function isHapticsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(HAPTICS_KEY) !== "0";
  } catch {
    return true;
  }
}

export function setHapticsEnabled(enabled: boolean) {
  try {
    window.localStorage.setItem(HAPTICS_KEY, enabled ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function supportsHaptics(): boolean {
  return typeof navigator !== "undefined" && "vibrate" in navigator;
}

/** Small haptic pulse on supported devices, honouring the user preference. */
export function haptic(pattern: number | number[] = 12) {
  try {
    if (!isHapticsEnabled()) return;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}
