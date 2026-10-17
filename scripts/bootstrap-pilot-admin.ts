import assert from "node:assert/strict";
import { createClerkClient } from "@clerk/backend";
import { pilotCredentials } from "./pilot-target";
import { runtimeEnvironment } from "../lib/environment-policy";
import { createDatabaseClient } from "../lib/database-client";

async function main() {
  const env = pilotCredentials();
  assert.equal(runtimeEnvironment(env).mode, "pilot");
  const email = "kent@cartsandparts.com";
  const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
  const result = await clerk.users.getUserList({ emailAddress: [email], limit: 2 });
  const matches = result.data.filter(user => !user.banned && !user.locked && user.firstName?.trim() && user.lastName?.trim()
    && user.emailAddresses.some(address => address.id === user.primaryEmailAddressId && address.emailAddress.toLowerCase() === email && address.verification?.status === "verified"));
  assert.equal(result.totalCount, 1); assert.equal(matches.length, 1);
  const identity = matches[0];
  const database = createDatabaseClient(env.DATABASE_URL);
  try {
    await database.$transaction(async transaction => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(740071)`;
      const existing = await transaction.appUser.findUnique({ where: { clerkUserId: identity.id } });
      if (existing) {
        assert.ok(existing.email === email && existing.active && existing.role === "ADMIN" && !existing.loginDeletionRequestedAt && !existing.loginDeletedAt);
        return;
      }
      assert.equal(await transaction.appUser.count(), 0, "Initial pilot provisioning requires an empty user directory.");
      await transaction.appUser.create({ data: { clerkUserId: identity.id, email, displayName: `${identity.firstName!.trim()} ${identity.lastName!.trim()}`, role: "ADMIN" } });
    });
    console.log("Verified Kent pilot Super Admin provisioned; no other accounts changed.");
  } finally { await database.$disconnect(); }
}
main().catch(() => { console.error("Pilot admin provisioning stopped: check verified primary email, required name and empty-directory requirements. Credentials withheld."); process.exitCode = 1; });
