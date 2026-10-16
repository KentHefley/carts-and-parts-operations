CREATE TABLE "OrderFieldLayout" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "version" INTEGER NOT NULL DEFAULT 1,
  "definitions" JSONB NOT NULL
);
CREATE TABLE "OrderFieldAudit" (
  "id" UUID NOT NULL PRIMARY KEY,
  "actorId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "changes" JSONB NOT NULL
);
CREATE INDEX "OrderFieldAudit_createdAt_idx" ON "OrderFieldAudit"("createdAt");
