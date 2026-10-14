import test from "node:test";
import assert from "node:assert/strict";
import { invitationConfiguration, invitationEmail, invitationSignupReturn } from "../lib/invitation-policy";
test("signup return preserves invitation context and ignores untrusted redirects", () => {
  const result = invitationSignupReturn({ __clerk_ticket: "synthetic&ticket=123", __clerk_status: "sign_up", redirect_url: "https://example.invalid" });
  const parsed = new URL(result, "http://localhost:3000");
  assert.equal(parsed.pathname, "/sign-up");
  assert.equal(parsed.searchParams.get("__clerk_ticket"), "synthetic&ticket=123");
  assert.equal(parsed.searchParams.get("__clerk_status"), "sign_up");
  assert.equal(parsed.searchParams.has("redirect_url"), false);
  assert.equal(invitationSignupReturn({ __clerk_ticket: ["ambiguous", "ticket"] }), "/sign-up");
});
test("invitation policy normalizes exact email and denies malformed or live configuration", () => {
  assert.equal(invitationEmail(" Test@Example.com "), "test@example.com");
  for (const email of ["bad", "a@b", "a@b.com\nBcc:x@y.com", null]) assert.throws(() => invitationEmail(email));
  assert.throws(() => invitationConfiguration({ CLERK_SECRET_KEY: "sk_live_placeholder" }));
  assert.throws(() => invitationConfiguration({ CLERK_SECRET_KEY: "sk_test_placeholder", APP_URL: "https://example.com/evil" }));
  const config = invitationConfiguration({ CLERK_SECRET_KEY: "sk_test_placeholder", INVITATION_ALLOWED_RECIPIENTS: "Test@Example.com" });
  assert.deepEqual(config.allowed, ["test@example.com"]);
  assert.equal(config.redirectUrl, "http://localhost:3000/sign-up");
  assert.deepEqual(invitationConfiguration({ CLERK_SECRET_KEY: "sk_test_placeholder" }).allowed, []);
});
