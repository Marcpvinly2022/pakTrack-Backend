-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PLATFORM_GLOBAL_ADMIN', 'AGENCY_ADMIN', 'DESK_AGENT');

-- CreateEnum
CREATE TYPE "MasterStatus" AS ENUM ('DOCUMENT_GATHERING', 'PAYMENT_PENDING', 'PAYMENT_VERIFIED', 'SUBMITTED', 'PROCESSING', 'PASSPORT_READY', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DocStatus" AS ENUM ('PENDING_UPLOAD', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TxStatus" AS ENUM ('PENDING_VERIFICATION', 'SUCCESSFUL', 'REJECTED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'CASH', 'POS', 'CARD', 'MOBILE_MONEY');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" UUID NOT NULL,
    "agencyName" VARCHAR(255) NOT NULL,
    "subdomain" VARCHAR(100) NOT NULL,
    "bankName" VARCHAR(100),
    "accountNo" VARCHAR(20),
    "accountName" VARCHAR(255),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "tenantId" UUID,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'DESK_AGENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "serviceName" VARCHAR(255) NOT NULL,
    "baseCostNaira" DECIMAL(12,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistItemTemplate" (
    "id" UUID NOT NULL,
    "serviceCategoryId" UUID NOT NULL,
    "documentName" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ChecklistItemTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "assignedStaffId" UUID NOT NULL,
    "serviceCategoryId" UUID NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "phoneNumber" VARCHAR(30) NOT NULL,
    "magicToken" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tokenExpiredAt" TIMESTAMPTZ(6) NOT NULL,
    "masterStatus" "MasterStatus" NOT NULL DEFAULT 'DOCUMENT_GATHERING',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "isTokenUsed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "checklistTemplateId" UUID NOT NULL,
    "status" "DocStatus" NOT NULL DEFAULT 'PENDING_UPLOAD',
    "storageKey" VARCHAR(512),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "amountPaid" DECIMAL(12,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "receiptStorageKey" VARCHAR(512),
    "paymentReference" VARCHAR(255),
    "status" "TxStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "notes" TEXT,
    "verifiedById" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" UUID NOT NULL,
    "eventType" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "processedAt" TIMESTAMPTZ(6),
    "errorLog" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_subdomain_key" ON "Tenant"("subdomain");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");

-- CreateIndex
CREATE INDEX "ServiceCategory_tenantId_idx" ON "ServiceCategory"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_tenantId_serviceName_key" ON "ServiceCategory"("tenantId", "serviceName");

-- CreateIndex
CREATE INDEX "ChecklistItemTemplate_serviceCategoryId_idx" ON "ChecklistItemTemplate"("serviceCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistItemTemplate_serviceCategoryId_documentName_key" ON "ChecklistItemTemplate"("serviceCategoryId", "documentName");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistItemTemplate_serviceCategoryId_displayOrder_key" ON "ChecklistItemTemplate"("serviceCategoryId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Client_magicToken_key" ON "Client"("magicToken");

-- CreateIndex
CREATE INDEX "Client_tenantId_idx" ON "Client"("tenantId");

-- CreateIndex
CREATE INDEX "Client_assignedStaffId_idx" ON "Client"("assignedStaffId");

-- CreateIndex
CREATE INDEX "Client_masterStatus_idx" ON "Client"("masterStatus");

-- CreateIndex
CREATE INDEX "Client_tenantId_phoneNumber_idx" ON "Client"("tenantId", "phoneNumber");

-- CreateIndex
CREATE INDEX "Document_clientId_idx" ON "Document"("clientId");

-- CreateIndex
CREATE INDEX "Document_status_idx" ON "Document"("status");

-- CreateIndex
CREATE INDEX "Transaction_clientId_idx" ON "Transaction"("clientId");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "Transaction_verifiedById_idx" ON "Transaction"("verifiedById");

-- CreateIndex
CREATE INDEX "OutboxEvent_status_idx" ON "OutboxEvent"("status");

-- CreateIndex
CREATE INDEX "OutboxEvent_createdAt_idx" ON "OutboxEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCategory" ADD CONSTRAINT "ServiceCategory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItemTemplate" ADD CONSTRAINT "ChecklistItemTemplate_serviceCategoryId_fkey" FOREIGN KEY ("serviceCategoryId") REFERENCES "ServiceCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_serviceCategoryId_fkey" FOREIGN KEY ("serviceCategoryId") REFERENCES "ServiceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_checklistTemplateId_fkey" FOREIGN KEY ("checklistTemplateId") REFERENCES "ChecklistItemTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
