/*
  Warnings:

  - You are about to drop the column `assignedStaffId` on the `Client` table. All the data in the column will be lost.
  - Added the required column `assignedDeskAgencyId` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdByUserId` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `Client` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ClientAccountStatus" AS ENUM ('INVITED', 'ACTIVE', 'DISABLED');

-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_assignedStaffId_fkey";

-- DropIndex
DROP INDEX "Client_assignedStaffId_idx";

-- DropIndex
DROP INDEX "Client_tenantId_phoneNumber_idx";

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "assignedStaffId",
ADD COLUMN     "accountStatus" "ClientAccountStatus" NOT NULL DEFAULT 'INVITED',
ADD COLUMN     "assignedDeskAgencyId" UUID NOT NULL,
ADD COLUMN     "createdByUserId" UUID NOT NULL,
ADD COLUMN     "email" VARCHAR(255) NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastLoginAt" TIMESTAMPTZ(6),
ADD COLUMN     "passwordHash" VARCHAR(255);

-- CreateIndex
CREATE INDEX "Client_assignedDeskAgencyId_idx" ON "Client"("assignedDeskAgencyId");

-- CreateIndex
CREATE INDEX "Client_createdByUserId_idx" ON "Client"("createdByUserId");

-- CreateIndex
CREATE INDEX "Client_accountStatus_idx" ON "Client"("accountStatus");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_assignedDeskAgencyId_fkey" FOREIGN KEY ("assignedDeskAgencyId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
