CREATE TABLE "UserAccessAudit" (
  "id" UUID NOT NULL,
  "actorId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "changes" JSONB NOT NULL,
  CONSTRAINT "UserAccessAudit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "UserAccessAudit_createdAt_idx" ON "UserAccessAudit"("createdAt");
CREATE INDEX "UserAccessAudit_userId_createdAt_idx" ON "UserAccessAudit"("userId", "createdAt");
