import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

export function createDatabaseClient(connectionString: string) {
  const databaseUrl = new URL(connectionString);
  // Keep certificate and hostname verification explicit for future pg releases.
  databaseUrl.searchParams.set("sslmode", "verify-full");
  const adapter = new PrismaPg({
    connectionString: databaseUrl.toString(),
    connectionTimeoutMillis: 10_000,
    max: 3,
  });
  return new PrismaClient({ adapter });
}
