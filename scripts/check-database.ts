import { config } from "dotenv";
import { createDatabaseClient } from "../lib/database-client";

config({ path: ".env.local", quiet: true });
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is missing.");
const database = createDatabaseClient(connectionString);

async function main() {
  try {
    const result = await database.$queryRaw<{ connected: number }[]>`SELECT 1 AS connected`;
    console.log(JSON.stringify({ connected: result[0]?.connected === 1 }));
  } catch {
    console.error("Database connection check failed; credentials were not logged.");
    process.exitCode = 1;
  } finally {
    await database.$disconnect();
  }
}

void main();
