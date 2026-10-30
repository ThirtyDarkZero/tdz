import { describe, expect, it } from "vitest";
import { platformMap } from "./PlatformLinksEditor";
import { linkError } from "./SmartLinkBuilder";

describe("platformMap", () => {
  it("keeps filled rows, adds https, skips blanks", () => {
    expect(platformMap([{ name: "Spotify", url: "open.spotify.com/t/1" }, { name: "YouTube", url: "" }]))
      .toEqual({ Spotify: "https://open.spotify.com/t/1" });
  });
  it("rejects non-web links", () => {
    expect(typeof platformMap([{ name: "Spotify", url: "javascript:alert(1)" }])).toBe("string");
  });
});

describe("linkError", () => {
  it("explains taken names and a pending schema", () => {
    expect(linkError({ code: "23505", message: "dup" }, "x")).toMatch(/taken/);
    expect(linkError({ message: "Could not find the 'artwork_url' column of 'smart_links' in the schema cache" }, "x")).toMatch(/database update/);
  });
});
