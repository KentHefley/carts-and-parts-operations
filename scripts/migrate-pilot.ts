import { spawnSync } from "node:child_process";
import { createDatabaseClient } from "../lib/database-client";
import { pilotCredentials } from "./pilot-target";

const expected = new Set(["AppUser", "_prisma_migrations", "SalesOrder", "OrderItem", "OrderEvent", "OrderAssignment", "Notification", "OrderEmail", "OrderAttachment", "PriceBook", "PriceBookFile", "PriceBookEvent", "CalendarPerson", "CalendarCategory", "CalendarEntry", "CalendarAudit", "UserAccessAudit", "EmployeeInvitation", "InvitationAudit", "OrderChoice", "OrderChoiceAudit", "OrderComment", "OrderFieldLayout", "OrderFieldAudit", "OrderFieldAmount"]);

async function main() {
  const env = pilotCredentials();
  const database = createDatabaseClient(env.DATABASE_URL);
  try {
    const tables = await database.$queryRaw<{ tablename: string }[]>`SELECT tablename FROM pg_tables WHERE schemaname='public'`;
    if (tables.some((table) => !expected.has(table.tablename))) throw new Error("Unexpected pilot tables.");
  } finally { await database.$disconnect(); }
  const direct = new URL(env.DATABASE_URL);
  direct.hostname = direct.hostname.replace("-pooler", "");
  const result = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], { windowsHide: true, stdio: "pipe", encoding: "utf8", timeout: 180_000, env: { ...process.env, ...env, DATABASE_URL: direct.toString() } });
  if (result.error || result.status !== 0) throw new Error("Pilot migration failed.");
  const check = createDatabaseClient(env.DATABASE_URL);
  try {
    const migrations = await check.$queryRaw<{ count: number }[]>`SELECT count(*)::int AS count FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`;
    const tables = await check.$queryRaw<{ count: number }[]>`SELECT count(*)::int AS count FROM pg_tables WHERE schemaname='public'`;
    console.log(JSON.stringify({ pilotSchemaReady: true, tables: tables[0].count, completedMigrations: migrations[0].count, users: await check.appUser.count(), orders: await check.salesOrder.count() }));
  } finally { await check.$disconnect(); }
}
main().catch(() => { console.error("Pilot migration failed or target validation refused it; credentials withheld. No reset attempted."); process.exitCode = 1; });
