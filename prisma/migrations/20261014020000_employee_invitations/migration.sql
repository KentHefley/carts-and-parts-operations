CREATE TABLE "EmployeeInvitation" (
  "id" UUID NOT NULL, "email" TEXT NOT NULL, "actorId" UUID NOT NULL,
  "state" TEXT NOT NULL DEFAULT 'SENDING', "providerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL, "acceptedUserId" UUID,
  CONSTRAINT "EmployeeInvitation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EmployeeInvitation_providerId_key" ON "EmployeeInvitation"("providerId");
CREATE INDEX "EmployeeInvitation_email_state_idx" ON "EmployeeInvitation"("email", "state");
CREATE INDEX "EmployeeInvitation_createdAt_idx" ON "EmployeeInvitation"("createdAt");
CREATE TABLE "InvitationAudit" (
  "id" UUID NOT NULL, "invitationId" UUID NOT NULL, "actorId" TEXT NOT NULL,
  "action" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InvitationAudit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "InvitationAudit_invitationId_createdAt_idx" ON "InvitationAudit"("invitationId", "createdAt");
