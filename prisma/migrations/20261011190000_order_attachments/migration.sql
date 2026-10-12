CREATE TABLE "OrderAttachment" (
  "id" UUID NOT NULL,
  "orderId" UUID NOT NULL,
  "uploaderId" UUID NOT NULL,
  "requestKey" UUID NOT NULL,
  "filename" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "stagingKey" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "state" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "uploadedAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  "deletedById" UUID,
  "stagingCleanedAt" TIMESTAMP(3),
  "objectCleanedAt" TIMESTAMP(3),
  CONSTRAINT "OrderAttachment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OrderAttachment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "OrderAttachment_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "AppUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "OrderAttachment_size_check" CHECK ("size" > 0 AND "size" <= 20000000)
);
CREATE UNIQUE INDEX "OrderAttachment_stagingKey_key" ON "OrderAttachment"("stagingKey");
CREATE UNIQUE INDEX "OrderAttachment_storageKey_key" ON "OrderAttachment"("storageKey");
CREATE UNIQUE INDEX "OrderAttachment_orderId_uploaderId_requestKey_key" ON "OrderAttachment"("orderId", "uploaderId", "requestKey");
CREATE INDEX "OrderAttachment_orderId_state_uploadedAt_idx" ON "OrderAttachment"("orderId", "state", "uploadedAt");
CREATE INDEX "OrderAttachment_state_expiresAt_idx" ON "OrderAttachment"("state", "expiresAt");
