import { describe, expect, it } from "vitest";
import { cleanUrl, isValidCode, toCode } from "./smartLinks";

describe("smart links", () => {
  it("makes clean codes", () => {
    expect(toCode("Beyoncé — Run The World!")).toBe("beyonce-run-the-world");
    expect(isValidCode("my-new-single")).toBe(true);
    expect(isValidCode("a")).toBe(false);
    expect(isValidCode("bad code")).toBe(false);
  });
  it("only allows web links", () => {
    expect(cleanUrl("open.spotify.com/track/1")).toBe("https://open.spotify.com/track/1");
    expect(cleanUrl("javascript:alert(1)")).toBeNull();
    expect(cleanUrl("")).toBeNull();
  });
});
