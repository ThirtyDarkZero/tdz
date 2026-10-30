import { describe, expect, it } from "vitest";
import { withDefaults, type TrackMetadata } from "./TrackMetadataForm";

const base = {
  title: "Song", artistName: "Nova Reign", label: "", copyrightOwner: "", copyrightYear: 2026, releaseType: "single",
  upc: "", genre: "Hip-Hop", isrc: "", language: "English", releaseVersion: "Original", originalReleaseDate: null,
  preorderDate: null, explicit: false, pLine: "", cLine: "", appleMotionArt1x1: "", appleMotionArt3x4: "",
  credits: { writers: [], producers: [], performers: [], featured_artists: [] },
  publishingInfo: { pro: null, youtube_monetization: false, sound_exchange: false },
} as unknown as TrackMetadata;

describe("upload metadata defaults", () => {
  it("fills business fields from the artist name", () => {
    const m = withDefaults(base);
    expect(m.label).toBe("Nova Reign");
    expect(m.copyrightOwner).toBe("Nova Reign");
    expect(m.pLine).toBe("℗ 2026 Nova Reign");
    expect(m.credits.writers[0].name).toBe("Nova Reign");
    expect(m.publishingInfo.pro).toBe("other");
  });
  it("keeps what the artist typed", () => {
    const m = withDefaults({ ...base, label: "TDZ Records", publishingInfo: { ...base.publishingInfo, pro: "bmi" } });
    expect(m.label).toBe("TDZ Records");
    expect(m.publishingInfo.pro).toBe("bmi");
  });
});
