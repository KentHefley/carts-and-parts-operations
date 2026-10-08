CREATE TABLE "OrderEmail" (
  "id" UUID NOT NULL,
  "orderId" UUID NOT NULL,
  "actorId" UUID NOT NULL,
  "requestKey" UUID NOT NULL,
  "payload" JSONB NOT NULL,
  "state" TEXT NOT NULL DEFAULT 'PENDING',
  "providerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "firstAttemptAt" TIMESTAMP(3),
  "lastAttemptAt" TIMESTAMP(3),
  "acceptedAt" TIMESTAMP(3),
  CONSTRAINT "OrderEmail_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OrderEmail_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "OrderEmail_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "AppUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "OrderEmail_orderId_actorId_requestKey_key" ON "OrderEmail"("orderId", "actorId", "requestKey");
CREATE INDEX "OrderEmail_orderId_createdAt_idx" ON "OrderEmail"("orderId", "createdAt");
