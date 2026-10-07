import { createDatabaseClient } from "../lib/database-client";
import { developmentCredentials } from "./development-target";

type ClerkUser = {
  id: string;
  banned: boolean;
  locked: boolean;
  primary_email_address_id: string | null;
  email_addresses: { id: string; email_address: string; verification: { status: string } | null }[];
};

async function main() {
  const { databaseUrl, secretKey } = developmentCredentials();
  const email = "kent@cartsandparts.com";
  const url = new URL("https://api.clerk.com/v1/users");
  url.searchParams.append("email_address[]", email);
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${secretKey}` },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error("Clerk identity lookup failed.");
  const users = await response.json() as ClerkUser[];
  const matches = users.filter((user) => !user.banned && !user.locked && user.email_addresses.some(
    (address) => address.id === user.primary_email_address_id && address.email_address.toLowerCase() === email && address.verification?.status === "verified",
  ));
  if (matches.length !== 1) throw new Error("Exactly one active verified primary email match is required.");
  const database = createDatabaseClient(databaseUrl);
  try {
    await database.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(740071)`;
      const existing = await transaction.appUser.findUnique({ where: { clerkUserId: matches[0].id } });
      if (existing) {
        if (existing.email !== email || !existing.active || existing.role !== "ADMIN") {
          throw new Error("Existing account differs; bootstrap cannot change existing permissions.");
        }
        return;
      }
      if (await transaction.appUser.count() !== 0) throw new Error("Bootstrap is allowed only in an empty user directory.");
      await transaction.appUser.create({ data: { clerkUserId: matches[0].id, email, role: "ADMIN" } });
    });
    console.log("Verified initial administrator provisioned: kent@cartsandparts.com");
  } finally {
    await database.$disconnect();
  }
}

main().catch(() => {
  console.error("Admin bootstrap failed identity/target checks or database operation. No credentials logged.");
  process.exitCode = 1;
});
