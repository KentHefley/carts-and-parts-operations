import type { PrismaClient } from "../generated/prisma/client";
import { normalizeSavedName, savedNameField } from "./saved-name-model";

export async function savedNameSuggestions(db: PrismaClient, actorId: string, field: unknown, query: unknown): Promise<string[]> {
  const actor = await db.appUser.findUnique({ where: { id: actorId } });
  if (!actor?.active || actor.loginDeletionRequestedAt || actor.loginDeletedAt) throw new Error("Approved employee access required.");
  if (!savedNameField(field) || typeof query !== "string" || query.length > 200) throw new Error("Invalid name search.");
  const search = normalizeSavedName(query);
  if (search.length < 2) return [];
  // Parameters remain data, including the JSON key and punctuation in the search.
  // Rank actual spellings by frequency, then deduplicate apostrophe/case variants.
  const rows = await db.$queryRaw<{ name: string }[]>`
    WITH candidates AS (
      SELECT btrim(fields ->> ${field}) AS saved_name
      FROM "SalesOrder"
      WHERE "deletedAt" IS NULL AND btrim(coalesce(name, '')) <> ''
        AND fields ->> 'status' IN ('Pending', 'In Progress', 'Expedite', 'Complete')
        AND jsonb_typeof(fields -> ${field}) = 'string'
        AND length(fields ->> ${field}) BETWEEN 1 AND 200
    )
    SELECT saved_name AS name FROM candidates
    WHERE position(${search} IN lower(btrim(regexp_replace(translate(saved_name, ${"'‘’ʼ＇"}, ''), '[[:space:]]+', ' ', 'g')))) > 0
    GROUP BY saved_name
    ORDER BY count(*) DESC, lower(saved_name), saved_name
    LIMIT 100`;
  const seen = new Set<string>();
  return rows.map(row => row.name).filter(name => {
    const key = normalizeSavedName(name);
    if (seen.has(key)) return false;
    seen.add(key); return true;
  }).slice(0, 10);
}
