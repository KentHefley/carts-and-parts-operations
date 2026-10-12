CREATE TABLE "PriceBook" (
  "key" TEXT NOT NULL, "currentFileId" UUID, "edition" TEXT NOT NULL DEFAULT '',
  "revision" INTEGER NOT NULL DEFAULT 0, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PriceBook_pkey" PRIMARY KEY ("key")
);
CREATE TABLE "PriceBookFile" (
  "id" UUID NOT NULL, "bookKey" TEXT NOT NULL, "uploaderId" UUID NOT NULL,
  "requestKey" UUID NOT NULL, "baseRevision" INTEGER NOT NULL, "edition" TEXT NOT NULL,
  "filename" TEXT NOT NULL, "size" INTEGER NOT NULL, "pages" INTEGER,
  "stagingKey" TEXT NOT NULL, "storageKey" TEXT NOT NULL, "state" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "expiresAt" TIMESTAMP(3) NOT NULL,
  "uploadedAt" TIMESTAMP(3), "stagingCleanedAt" TIMESTAMP(3), "objectCleanedAt" TIMESTAMP(3),
  CONSTRAINT "PriceBookFile_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PriceBookEvent" (
  "id" UUID NOT NULL, "bookKey" TEXT NOT NULL, "actorId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "changes" JSONB NOT NULL,
  CONSTRAINT "PriceBookEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PriceBookFile_stagingKey_key" ON "PriceBookFile"("stagingKey");
CREATE UNIQUE INDEX "PriceBookFile_storageKey_key" ON "PriceBookFile"("storageKey");
CREATE UNIQUE INDEX "PriceBookFile_uploaderId_requestKey_key" ON "PriceBookFile"("uploaderId", "requestKey");
CREATE INDEX "PriceBookFile_state_expiresAt_idx" ON "PriceBookFile"("state", "expiresAt");
CREATE INDEX "PriceBookEvent_bookKey_createdAt_idx" ON "PriceBookEvent"("bookKey", "createdAt");
ALTER TABLE "PriceBookFile" ADD CONSTRAINT "PriceBookFile_bookKey_fkey" FOREIGN KEY ("bookKey") REFERENCES "PriceBook"("key") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PriceBookFile" ADD CONSTRAINT "PriceBookFile_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "AppUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PriceBookEvent" ADD CONSTRAINT "PriceBookEvent_bookKey_fkey" FOREIGN KEY ("bookKey") REFERENCES "PriceBook"("key") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PriceBookEvent" ADD CONSTRAINT "PriceBookEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "AppUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
