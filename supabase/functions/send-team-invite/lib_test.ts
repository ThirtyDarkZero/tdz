import assert from "node:assert/strict";
import { inviteUrl, parseInvite } from "./lib.ts";

Deno.test("rejects bad and self emails", () => {
  assert.deepEqual(parseInvite({ email: "nope" }), { error: "Enter a valid email address." });
  assert.deepEqual(parseInvite({ email: "Me@x.com", permissions: ["view_tracks"] }, "me@x.com"), { error: "You can't invite yourself." });
});

Deno.test("collaborator permissions are filtered and include view", () => {
  const r = parseInvite({ email: " A@B.co ", permissions: ["edit_tracks", "hack", "edit_tracks"] });
  assert.ok("value" in r);
  assert.equal(r.value.email, "a@b.co");
  assert.deepEqual(r.value.permissions, ["view_tracks", "edit_tracks"]);
  assert.deepEqual(parseInvite({ email: "a@b.co", permissions: ["hack"] }), { error: "Choose at least one permission." });
});

Deno.test("roster invites carry the manager flag", () => {
  const r = parseInvite({ email: "artist@b.co", kind: "roster" });
  assert.ok("value" in r);
  assert.equal(r.value.kind, "roster");
  assert.deepEqual(r.value.permissions, { manager: true, upload: true, analytics: true });
});

Deno.test("invite links", () => {
  assert.equal(inviteUrl("https://www.thirtydarkzero.net/", "t1"), "https://www.thirtydarkzero.net/invite/t1");
});
