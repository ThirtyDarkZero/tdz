import { describe, it, expect } from "vitest";
import { pickTodaysMove, nextStreak, currentStreak } from "./todaysMove";

describe("todaysMove", () => {
  it("asks for an upload when no tracks", () => {
    expect(pickTodaysMove({ trackCount: 0, publishedCount: 0, streams7d: 0, streamsPrev7d: 0 }).id).toBe("first-upload");
  });
  it("flags a momentum dip", () => {
    expect(pickTodaysMove({ trackCount: 3, publishedCount: 3, streams7d: 5, streamsPrev7d: 20 }).id).toBe("recover");
  });
  it("extends streak on consecutive days and resets after a gap", () => {
    expect(nextStreak({ streak: 4, last: "2026-10-21" }, new Date("2026-10-22T12:00:00Z")).streak).toBe(5);
    expect(nextStreak({ streak: 4, last: "2026-10-19" }, new Date("2026-10-22T12:00:00Z")).streak).toBe(1);
    expect(currentStreak({ streak: 4, last: "2026-10-19" }, new Date("2026-10-22T12:00:00Z"))).toBe(0);
  });
});
