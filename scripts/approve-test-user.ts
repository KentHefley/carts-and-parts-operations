import { execFileSync } from "node:child_process";
import { createDatabaseClient } from "../lib/database-client";
import { developmentCredentials } from "./development-target";

type Identity = {
  id: string; banned: boolean; locked: boolean;
  first_name: string | null; last_name: string | null;
  primary_email_address_id: string | null;
  email_addresses: { id: string; email_address: string; verification: { status: string } | null }[];
};

async function main() {
  // Explicitly approved test account only; this is not general user administration.
  const email = "jleo3140@gmail.com";
  const { databaseUrl, secretKey } = developmentCredentials();
  if (!/^sk_test_[A-Za-z0-9]+$/.test(secretKey)) throw new Error("Invalid development key format.");
  const url = new URL("https://api.clerk.com/v1/users");
  url.searchParams.append("email_address[]", email);
  url.searchParams.set("limit", "10");
  url.searchParams.set("offset", "0");
  // Pass authentication through stdin rather than exposing it in process arguments.
  const raw = execFileSync("curl.exe", ["--silent", "--show-error", "--fail", "--max-time", "20", "--config", "-"], {
    input: `url = "${url.toString()}"\nheader = "Authorization: Bearer ${secretKey}"\n`,
    encoding: "utf8", stdio: ["pipe", "pipe", "pipe"],
  });
  const users = JSON.parse(raw) as Identity[];
  const matches = users.filter(user => !user.banned && !user.locked && user.email_addresses.some(address =>
    address.id === user.primary_email_address_id && address.email_address.toLowerCase() === email && address.verification?.status === "verified"));
  if (matches.length !== 1) throw new Error("Account must first accept its invitation and have a verified primary email. No database changes made.");
  const identity = matches[0];
  const displayName = [identity.first_name, identity.last_name].filter(Boolean).join(" ").trim() || null;
  const database = createDatabaseClient(databaseUrl);
  try {
    await database.$transaction(async transaction => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(740071)`;
      const existing = await transaction.appUser.findFirst({ where: { OR: [{ clerkUserId: identity.id }, { email }] } });
      if (existing) {
        if (existing.clerkUserId !== identity.id || existing.email !== email || !existing.active || existing.role !== "USER") {
          throw new Error("Existing account differs; this script cannot change existing permissions.");
        }
        return;
      }
      await transaction.appUser.create({ data: { clerkUserId: identity.id, email, displayName, role: "USER", active: true } });
    });
    const account = await database.appUser.findUniqueOrThrow({ where: { email } });
    console.log(JSON.stringify({ email: account.email, displayName: account.displayName, role: account.role, active: account.active, environment: "development" }));
  } finally { await database.$disconnect(); }
}

main().catch(error => {
  console.error(error instanceof Error && !("stderr" in error) ? error.message : "Identity lookup failed; no credentials displayed.");
  process.exitCode = 1;
});
