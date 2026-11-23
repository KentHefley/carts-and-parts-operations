import { spawnSync } from "node:child_process";
import { createDatabaseClient } from "../lib/database-client";
import { productionCredentials } from "./production-target";

async function main() {
  const env = productionCredentials();
  const direct = new URL(env.DATABASE_URL);
  direct.hostname = direct.hostname.replace("-pooler", "");
  const migration = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], {
    windowsHide: true, stdio: "pipe", timeout: 180_000,
    env: { ...process.env, ...env, DATABASE_URL: direct.toString() },
  });
  if (migration.error || migration.status !== 0) throw new Error("Migration failed.");
  const db = createDatabaseClient(env.DATABASE_URL);
  try {
    await db.$transaction(async tx => {
      await tx.$executeRaw`LOCK TABLE "SalesOrder" IN ACCESS EXCLUSIVE MODE`;
      const orders = await tx.salesOrder.count();
      const state = await tx.$queryRaw<{ last_value: bigint; is_called: boolean }[]>`SELECT last_value, is_called FROM "SalesOrder_number_seq"`;
      // Initial setup only. Reruns never rewind a used or already configured sequence.
      if (orders === 0 && !state[0].is_called && Number(state[0].last_value) === 1) {
        await tx.$queryRaw`SELECT setval('"SalesOrder_number_seq"'::regclass, 25000, false)`;
      }
      const verified = await tx.$queryRaw<{ last_value: bigint; is_called: boolean }[]>`SELECT last_value, is_called FROM "SalesOrder_number_seq"`;
      if (!orders && (!verified[0].is_called && Number(verified[0].last_value) !== 25000)) throw new Error("Unexpected initial sequence.");
      console.log(JSON.stringify({ productionSchemaReady: true, orders, sequenceValue: String(verified[0].last_value), sequenceCalled: verified[0].is_called }));
    });
  } finally { await db.$disconnect(); }
}
main().catch(() => { console.error("Production migration or sequence verification failed. Credentials withheld."); process.exitCode = 1; });
