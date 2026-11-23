import assert from "node:assert/strict";
import test from "node:test";
import { freshIdentity } from "../lib/clerk-identity";

const fixture = { object: "user", id: "user_fixture", first_name: "Kent", last_name: "Fixture", banned: false, locked: true,
  primary_email_address_id: "email_fixture", public_metadata: { operationsInvitationId: "invite_fixture" },
  email_addresses: [{ id: "email_fixture", email_address: "employee@example.com", verification: { status: "verified" } }] };

test("fresh identity GET bypasses caching and preserves authorization facts", async () => {
  const request: typeof fetch = async (url, options) => {
    assert.equal(url, "https://api.clerk.com/v1/users/user_fixture");
    assert.equal(options?.cache, "no-store");
    assert.ok(options?.signal instanceof AbortSignal);
    assert.equal(new Headers(options?.headers).get("Authorization"), "Bearer sk_fixture");
    return Response.json(fixture);
  };
  const identity = await freshIdentity("user_fixture", "sk_fixture", request);
  assert.equal(identity.locked, true);
  assert.equal(identity.banned, false);
  assert.equal(identity.emailAddresses[0].verification?.status, "verified");
  assert.equal(identity.publicMetadata.operationsInvitationId, "invite_fixture");
});

test("fresh identity rejects a mismatched account, malformed flags and failed HTTP response", async () => {
  for (const value of [{ ...fixture, id: "another_user" }, { ...fixture, banned: undefined }, { ...fixture, object: "session" }]) {
    await assert.rejects(freshIdentity("user_fixture", "sk_fixture", async () => Response.json(value)));
  }
  await assert.rejects(freshIdentity("user_fixture", "sk_fixture", async () => new Response("secret upstream error", { status: 503 })),
    /Employee identity service unavailable/);
});
