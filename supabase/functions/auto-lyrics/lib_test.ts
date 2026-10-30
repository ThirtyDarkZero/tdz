import assert from "node:assert/strict";
import { audioFormat, cleanLyrics, extractJson, toBase64 } from "./lib.ts";

Deno.test("reads JSON from fenced and chatty replies", () => {
  assert.deepEqual(extractJson('Sure!\n```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(extractJson('Here you go {"a":2} hope that helps'), { a: 2 });
  assert.throws(() => extractJson("no json here"));
});

Deno.test("cleans lines: labels dropped, times ordered and clamped", () => {
  const out = cleanLyrics({
    instrumental: false, language: "EN",
    lines: [
      { time: 1.234, text: "  First   line " },
      { time: 0.5, text: "goes back in time" },
      { time: "x", text: "no time" },
      { time: 5, text: "[Chorus]" },
      { time: 999, text: "past the end" },
      { time: 3, text: "" },
    ],
  }, 200);
  assert.equal(out.language, "en");
  assert.deepEqual(out.lines.map((l) => l.time), [1.23, 1.23, 1.23, 200]);
  assert.equal(out.lines[0].text, "First line");
  assert.equal(out.instrumental, false);
});

Deno.test("no lines means instrumental", () => {
  assert.equal(cleanLyrics({ lines: [] }).instrumental, true);
  assert.equal(cleanLyrics(null).instrumental, true);
});

Deno.test("base64 works on large files without blowing the stack", () => {
  const big = new Uint8Array(3_000_000).fill(65);
  const b = toBase64(big);
  assert.equal(b.length, 4_000_000);
  assert.equal(b.slice(0, 4), "QUFB");
});

Deno.test("audio formats", () => {
  assert.equal(audioFormat("u/x/song.WAV"), "wav");
  assert.equal(audioFormat("u/x/song"), "mp3");
});
