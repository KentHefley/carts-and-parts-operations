import { Prisma, type PrismaClient } from "../generated/prisma/client";
import { normalizeSavedName, personalDescriptionField } from "./saved-name-model";

export async function personalDescriptionSuggestions(db: PrismaClient, actorId: string, field: unknown, query: unknown): Promise<string[]> {
  const actor = await db.appUser.findUnique({ where: { id: actorId } });
  if (!actor?.active || actor.loginDeletionRequestedAt || actor.loginDeletedAt) throw new Error("Approved employee access required.");
  if (!personalDescriptionField(field) || typeof query !== "string" || query.length > 200) throw new Error("Invalid description search.");
  const search = normalizeSavedName(query);
  if (search.length < 2) return [];
  const source = field === "text_32__1" ? Prisma.sql`
    SELECT e.changes -> 'text_32__1' ->> 'after' AS saved_text, e."createdAt"
    FROM "OrderEvent" e JOIN "SalesOrder" o ON o.id = e."orderId"
    WHERE e."actorId" = ${actorId}::uuid AND o."deletedAt" IS NULL AND btrim(coalesce(o.name, '')) <> ''
      AND o.fields ->> 'status' IN ('Pending', 'In Progress', 'Expedite', 'Complete')
      AND jsonb_typeof(e.changes -> 'text_32__1' -> 'after') = 'string'
      AND coalesce(e.changes -> 'text_32__1' ->> 'before', '') <> e.changes -> 'text_32__1' ->> 'after'
      AND o.fields ->> 'text_32__1' = e.changes -> 'text_32__1' ->> 'after'`
    : Prisma.sql`
    SELECT item.value ->> 'description' AS saved_text, e."createdAt"
    FROM "OrderEvent" e JOIN "SalesOrder" o ON o.id = e."orderId"
    CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(e.changes -> 'items' -> 'after') = 'array' THEN e.changes -> 'items' -> 'after' ELSE '[]'::jsonb END) WITH ORDINALITY AS item(value, position)
    WHERE e."actorId" = ${actorId}::uuid AND o."deletedAt" IS NULL AND btrim(coalesce(o.name, '')) <> ''
      AND o.fields ->> 'status' IN ('Pending', 'In Progress', 'Expedite', 'Complete')
      AND jsonb_typeof(item.value -> 'description') = 'string'
      AND coalesce(e.changes -> 'items' -> 'before' -> (item.position::int - 1) ->> 'description', '') <> item.value ->> 'description'
      AND EXISTS (SELECT 1 FROM "OrderItem" current_item WHERE current_item."orderId" = o.id AND current_item.description = item.value ->> 'description')`;
  const rows = await db.$queryRaw<{ name: string }[]>`
    WITH candidates AS (${source})
    SELECT saved_text AS name FROM candidates
    WHERE length(saved_text) BETWEEN 1 AND 10000
      AND position(${search} IN lower(btrim(regexp_replace(translate(saved_text, ${"'‘’ʼ＇"}, ''), '[[:space:]]+', ' ', 'g')))) > 0
    GROUP BY saved_text
    ORDER BY count(*) DESC, max("createdAt") DESC, saved_text
    LIMIT 100`;
  const seen = new Set<string>();
  return rows.map(row => row.name).filter(name => {
    const key = normalizeSavedName(name);
    if (!key || seen.has(key)) return false;
    seen.add(key); return true;
  }).slice(0, 10);
}
