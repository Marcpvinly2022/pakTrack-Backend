/*
  Warnings:

  - You are about to drop the column `assignedDeskAgencyId` on the `Client` table. All the data in the column will be lost.
  - Added the required column `assignedDeskAgentId` to the `Client` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ClientServiceStatus" AS ENUM ('ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_assignedDeskAgencyId_fkey";

-- DropIndex
DROP INDEX "Client_assignedDeskAgencyId_idx";

-- =========================================================================
-- CUSTOM CHANGELOG: Safe Data Migration for Renamed Column
-- =========================================================================

-- 1. Add the new column as nullable first so the database allows it
ALTER TABLE "Client" ADD COLUMN "assignedDeskAgentId" UUID;

-- 2. COPY THE DATA: Move the old values over to the new column
UPDATE "Client" SET "assignedDeskAgentId" = "assignedDeskAgencyId";

-- 3. Enforce the NOT NULL constraint now that the data is safely copied
ALTER TABLE "Client" ALTER COLUMN "assignedDeskAgentId" SET NOT NULL;

-- 4. Safely drop the old column without losing your records
ALTER TABLE "Client" DROP COLUMN "assignedDeskAgencyId";

-- =========================================================================

-- CreateTable
CREATE TABLE "ClientService" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "serviceId" UUID NOT NULL,
    "status" "ClientServiceStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "ClientService_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientService_tenantId_idx" ON "ClientService"("tenantId");

-- CreateIndex
CREATE INDEX "ClientService_clientId_idx" ON "ClientService"("clientId");

-- CreateIndex
CREATE INDEX "ClientService_serviceId_idx" ON "ClientService"("serviceId");

-- CreateIndex
CREATE INDEX "ClientService_status_idx" ON "ClientService"("status");

-- CreateIndex
CREATE INDEX "ClientService_tenantId_clientId_idx" ON "ClientService"("tenantId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientService_clientId_serviceId_key" ON "ClientService"("clientId", "serviceId");

-- CreateIndex
CREATE INDEX "Client_assignedDeskAgentId_idx" ON "Client"("assignedDeskAgentId");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_assignedDeskAgentId_fkey" FOREIGN KEY ("assignedDeskAgentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientService" ADD CONSTRAINT "ClientService_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientService" ADD CONSTRAINT "ClientService_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientService" ADD CONSTRAINT "ClientService_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientService" ADD CONSTRAINT "ClientService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
