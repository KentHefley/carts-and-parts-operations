import "server-only";
import { createDatabaseClient } from "./database-client";

const globalDatabase = globalThis as unknown as {
  database?: ReturnType<typeof createDatabaseClient>;
};

export function getDatabase() {
  if (!process.env.DATABASE_URL) throw new Error("Database configuration missing.");
  globalDatabase.database ??= createDatabaseClient(process.env.DATABASE_URL);
  return globalDatabase.database;
}
