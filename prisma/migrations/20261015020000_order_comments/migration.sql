CREATE TABLE "OrderComment" (
  "id" UUID NOT NULL,
  "orderId" UUID NOT NULL,
  "authorId" UUID NOT NULL,
  "authorName" TEXT NOT NULL,
  "requestKey" UUID NOT NULL,
  "requestHash" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "mentions" JSONB NOT NULL DEFAULT '[]',
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "editedAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "OrderComment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "OrderComment_orderId_authorId_requestKey_key" ON "OrderComment"("orderId", "authorId", "requestKey");
CREATE INDEX "OrderComment_orderId_deletedAt_createdAt_idx" ON "OrderComment"("orderId", "deletedAt", "createdAt");
ALTER TABLE "OrderComment" ADD CONSTRAINT "OrderComment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderComment" ADD CONSTRAINT "OrderComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "AppUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
