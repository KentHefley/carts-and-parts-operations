ALTER TABLE "AppUser" ADD COLUMN "displayName" TEXT;
-- Confirmed initial administrator, using the name in the supplied order reference.
UPDATE "AppUser" SET "displayName" = 'Kent Hefley'
WHERE "email" = 'kent@cartsandparts.com' AND "displayName" IS NULL;
