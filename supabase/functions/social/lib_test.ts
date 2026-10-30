import assert from "node:assert/strict";
import { ayrshareDate, overallStatus, postProblems } from "./lib.ts";

const now = new Date("2026-10-30T20:00:00Z");

Deno.test("posts need a network and content", () => {
  assert.deepEqual(postProblems({ body: "", platforms: [], mediaUrls: [], scheduledAt: null }, now),
    ["Choose at least one network.", "Write something or add a photo or video."]);
});

Deno.test("network rules", () => {
  assert.ok(postProblems({ body: "x".repeat(300), platforms: ["twitter"], mediaUrls: [], scheduledAt: null }, now)[0].startsWith("Too long for twitter"));
  assert.ok(postProblems({ body: "hi", platforms: ["instagram"], mediaUrls: [], scheduledAt: null }, now)
    .includes("Instagram, TikTok and YouTube need a photo or video."));
  assert.ok(postProblems({ body: "hi", platforms: ["tiktok"], mediaUrls: ["https://x.co/a.jpg"], scheduledAt: null }, now)
    .includes("TikTok and YouTube need a video."));
  assert.deepEqual(postProblems({ body: "hi", platforms: ["tiktok", "instagram"], mediaUrls: ["https://x.co/a.mp4"], scheduledAt: null }, now), []);
});

Deno.test("scheduling", () => {
  assert.ok(postProblems({ body: "hi", platforms: ["facebook"], mediaUrls: [], scheduledAt: "2026-10-30T20:01:00Z" }, now)[0].startsWith("Schedule at least"));
  assert.deepEqual(postProblems({ body: "hi", platforms: ["facebook"], mediaUrls: [], scheduledAt: "2026-10-31T20:00:00Z" }, now), []);
  assert.equal(ayrshareDate("2026-10-31T20:00:00.000Z"), "2026-10-31T20:00:00Z");
});

Deno.test("status", () => {
  assert.equal(overallStatus(true, [], []), "scheduled");
  assert.equal(overallStatus(false, [{ status: "success" }, { status: "error" }], []), "partial");
  assert.equal(overallStatus(false, [{ status: "success" }], []), "posted");
  assert.equal(overallStatus(false, [], [{}]), "failed");
});
