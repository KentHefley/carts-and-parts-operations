ALTER TABLE "SalesOrder"
ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "deletedById" UUID,
ADD COLUMN "purgeAfter" TIMESTAMP(3),
ADD COLUMN "purgingAt" TIMESTAMP(3),
ADD COLUMN "purgedAt" TIMESTAMP(3);

CREATE INDEX "SalesOrder_deletedAt_purgeAfter_purgedAt_idx" ON "SalesOrder"("deletedAt", "purgeAfter", "purgedAt");
