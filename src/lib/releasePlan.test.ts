import { describe, expect, it } from "vitest";
import { releaseFields } from "./releasePlan";

const now = new Date(2026, 9, 30, 15, 0);

describe("releaseFields", () => {
  it("releases now", () => {
    expect(releaseFields("now", null, now)).toEqual({ is_published: true, release_date: "2026-10-30", scheduled_release_date: null });
  });
  it("schedules a future date", () => {
    expect(releaseFields("scheduled", new Date(2026, 10, 7), now)).toEqual({
      is_published: false, release_date: "2026-11-07", scheduled_release_date: "2026-11-07",
    });
  });
  it("treats today as now (the old picker blocked today)", () => {
    expect(releaseFields("scheduled", new Date(2026, 9, 30), now).is_published).toBe(true);
  });
  it("drafts stay private", () => {
    expect(releaseFields("draft", new Date(2026, 10, 7), now)).toEqual({ is_published: false, release_date: null, scheduled_release_date: null });
  });
});
