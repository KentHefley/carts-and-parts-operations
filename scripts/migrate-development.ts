import { spawnSync } from "node:child_process";
import { createDatabaseClient } from "../lib/database-client";
import { developmentCredentials } from "./development-target";

async function main() {
  const { databaseUrl } = developmentCredentials();
  const database = createDatabaseClient(databaseUrl);
  try {
    const unexpected = await database.$queryRaw<{ count: bigint }[]>`
      SELECT count(*) FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        AND table_name NOT IN ('AppUser', '_prisma_migrations', 'SalesOrder', 'OrderItem', 'OrderEvent')
    `;
    if (unexpected[0].count !== BigInt(0)) throw new Error("Unexpected existing tables; migration stopped.");
    console.log("Verified development database and expected table scope.");
  } finally {
    await database.$disconnect();
  }
  const result = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.error || result.status !== 0) throw new Error("Development migration failed.");
}

main().catch(() => {
  console.error("Development migration failed or target checks refused it. No credentials logged.");
  process.exitCode = 1;
});
