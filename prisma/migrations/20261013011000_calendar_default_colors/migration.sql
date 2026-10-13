-- Give initial account-directory entries distinct defaults; preserve edited colors.
WITH defaults AS (
 SELECT "id", row_number() OVER (ORDER BY "name", "id") AS position
 FROM "CalendarPerson" WHERE "revision" = 0 AND "color" = '#1764A0'
)
UPDATE "CalendarPerson" p SET "color" = (ARRAY['#1764A0','#A04B16','#6446A0','#14765C','#A02E5C','#566817'])[((d.position - 1) % 6 + 1)::int]
FROM defaults d WHERE p."id" = d."id";
