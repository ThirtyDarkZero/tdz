import { describe, expect, it } from "vitest";
import { encodeWav } from "./lyricsProxy";

describe("encodeWav", () => {
  it("writes a valid 16 kHz mono header", async () => {
    const blob = encodeWav(new Float32Array([0, 1, -1, 0.5]));
    const b = new DataView(await blob.arrayBuffer());
    const tag = (o: number) => String.fromCharCode(b.getUint8(o), b.getUint8(o + 1), b.getUint8(o + 2), b.getUint8(o + 3));
    expect(tag(0)).toBe("RIFF");
    expect(tag(8)).toBe("WAVE");
    expect(b.getUint16(22, true)).toBe(1);
    expect(b.getUint32(24, true)).toBe(16000);
    expect(b.getUint32(40, true)).toBe(8);
    expect(b.getInt16(46, true)).toBe(32767);
    expect(b.getInt16(48, true)).toBe(-32768);
  });
});
