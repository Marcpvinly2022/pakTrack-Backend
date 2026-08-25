-- 1. Create the new enums safely
CREATE TYPE "RequirementStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'REPLACED', 'NOT_APPLICABLE', 'COMPLETED');
CREATE TYPE "ReviewDecision" AS ENUM ('APPROVED', 'CORRECTION_REQUIRED', 'REJECTED', 'NOT_APPLICABLE');

-- Recreate DocStatus safely since the old table and its context are clean slats
DROP TYPE IF EXISTS "DocStatus";
CREATE TYPE "DocStatus" AS ENUM ('UPLOADED', 'UNDER_REVIEW', 'CORRECTION_REQUIRED', 'RESUBMITTED', 'APPROVED', 'REJECTED', 'NOT_APPLICABLE');

-- 2. Create the DocumentRequirement Table
CREATE TABLE "DocumentRequirement" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "clientServiceId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "instruction" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "RequirementStatus" NOT NULL DEFAULT 'ACTIVE',
    "replacedByRequirementId" UUID,
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "DocumentRequirement_pkey" PRIMARY KEY ("id")
);

-- 3. Create the Document Table (Now safely matching your new schema layout)
CREATE TABLE "Document" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "requirementId" UUID NOT NULL,
    "clientServiceId" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "DocStatus" NOT NULL DEFAULT 'UPLOADED',
    "cloudinaryPublicId" VARCHAR(512),
    "cloudinarySecureUrl" VARCHAR(1024),
    "originalFileName" VARCHAR(255),
    "mimeType" VARCHAR(100),
    "fileSize" INTEGER,
    "uploadedByClientId" UUID,
    "uploadedByUserId" UUID,
    "lastReviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- 4. Create the DocumentReview Table
CREATE TABLE "DocumentReview" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "reviewerId" UUID NOT NULL,
    "decision" "ReviewDecision" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentReview_pkey" PRIMARY KEY ("id")
);

-- 5. Build Indexes
CREATE UNIQUE INDEX "DocumentRequirement_replacedByRequirementId_key" ON "DocumentRequirement"("replacedByRequirementId");
CREATE INDEX "DocumentRequirement_tenantId_idx" ON "DocumentRequirement"("tenantId");
CREATE INDEX "DocumentRequirement_clientServiceId_idx" ON "DocumentRequirement"("clientServiceId");
CREATE INDEX "DocumentRequirement_status_idx" ON "DocumentRequirement"("status");
CREATE INDEX "DocumentRequirement_clientServiceId_status_idx" ON "DocumentRequirement"("clientServiceId", "status");

CREATE INDEX "Document_tenantId_idx" ON "Document"("tenantId");
CREATE INDEX "Document_requirementId_idx" ON "Document"("requirementId");
CREATE INDEX "Document_clientServiceId_idx" ON "Document"("clientServiceId");
CREATE INDEX "Document_status_idx" ON "Document"("status");
CREATE INDEX "Document_requirementId_version_idx" ON "Document"("requirementId", "version");

CREATE INDEX "DocumentReview_tenantId_idx" ON "DocumentReview"("tenantId");
CREATE INDEX "DocumentReview_documentId_idx" ON "DocumentReview"("documentId");
CREATE INDEX "DocumentReview_reviewerId_idx" ON "DocumentReview"("reviewerId");
CREATE INDEX "DocumentReview_documentId_createdAt_idx" ON "DocumentReview"("documentId", "createdAt");

-- 6. Assign Foreign Key Relations
ALTER TABLE "DocumentRequirement" ADD CONSTRAINT "DocumentRequirement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentRequirement" ADD CONSTRAINT "DocumentRequirement_clientServiceId_fkey" FOREIGN KEY ("clientServiceId") REFERENCES "ClientService"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentRequirement" ADD CONSTRAINT "DocumentRequirement_replacedByRequirementId_fkey" FOREIGN KEY ("replacedByRequirementId") REFERENCES "DocumentRequirement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DocumentRequirement" ADD CONSTRAINT "DocumentRequirement_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Document" ADD CONSTRAINT "Document_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "DocumentRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_clientServiceId_fkey" FOREIGN KEY ("clientServiceId") REFERENCES "ClientService"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedByClientId_fkey" FOREIGN KEY ("uploadedByClientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DocumentReview" ADD CONSTRAINT "DocumentReview_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentReview" ADD CONSTRAINT "DocumentReview_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentReview" ADD CONSTRAINT "DocumentReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
