import { developmentCredentials } from "./development-target";
import { createDatabaseClient } from "../lib/database-client";
import { attachmentStorage } from "../lib/attachment-storage";
import { purgeExpiredOrders } from "../lib/trash-store";

async function main() {
  const { databaseUrl } = developmentCredentials();
  const db = createDatabaseClient(databaseUrl);
  try {
    const result = await purgeExpiredOrders(db, attachmentStorage());
    console.log(`Expired development Trash: ${result.purged}/${result.checked} cleaned.`);
    if (result.purged < result.checked) process.exitCode = 1;
  } finally { await db.$disconnect(); }
}
main().catch(() => { console.error("Development cleanup unavailable; no credentials logged."); process.exitCode = 1; });
