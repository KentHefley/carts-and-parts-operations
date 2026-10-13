CREATE TABLE "CalendarPerson" (
 "id" UUID NOT NULL, "name" TEXT NOT NULL, "userId" UUID, "color" TEXT NOT NULL DEFAULT '#1764A0', "active" BOOLEAN NOT NULL DEFAULT true, "revision" INTEGER NOT NULL DEFAULT 0,
 CONSTRAINT "CalendarPerson_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CalendarPerson_userId_key" ON "CalendarPerson"("userId");
CREATE TABLE "CalendarCategory" (
 "id" UUID NOT NULL, "name" TEXT NOT NULL, "color" TEXT NOT NULL, "active" BOOLEAN NOT NULL DEFAULT true, "revision" INTEGER NOT NULL DEFAULT 0,
 CONSTRAINT "CalendarCategory_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CalendarEntry" (
 "id" UUID NOT NULL, "kind" TEXT NOT NULL, "creatorId" UUID NOT NULL, "payload" JSONB NOT NULL, "exceptions" JSONB NOT NULL DEFAULT '{}', "revision" INTEGER NOT NULL DEFAULT 0, "deletedAt" TIMESTAMP(3), "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "CalendarEntry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CalendarEntry_kind_deletedAt_idx" ON "CalendarEntry"("kind", "deletedAt");
CREATE TABLE "CalendarAudit" (
 "id" UUID NOT NULL, "actorId" UUID NOT NULL, "recordId" UUID NOT NULL, "recordType" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "changes" JSONB NOT NULL,
 CONSTRAINT "CalendarAudit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CalendarAudit_recordId_createdAt_idx" ON "CalendarAudit"("recordId", "createdAt");
INSERT INTO "CalendarCategory" ("id", "name", "color") VALUES
 ('a1000000-0000-4000-8000-000000000001', 'Time Off', '#097C78'),
 ('a1000000-0000-4000-8000-000000000002', 'Birthday', '#8345B9'),
 ('a1000000-0000-4000-8000-000000000003', 'Work Anniversary', '#AB4B10'),
 ('a1000000-0000-4000-8000-000000000004', 'Holiday', '#2457AA');
INSERT INTO "CalendarPerson" ("id", "name", "userId") SELECT gen_random_uuid(), COALESCE(NULLIF("displayName", ''), "email"), "id" FROM "AppUser" WHERE "active" = true;
