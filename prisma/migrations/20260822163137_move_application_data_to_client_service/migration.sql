/*
  Warnings:

  - You are about to drop the column `masterStatus` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `clientId` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `clientId` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `clientServiceId` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientServiceId` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_clientId_fkey";

-- DropIndex
DROP INDEX "Client_masterStatus_idx";

-- DropIndex
DROP INDEX "Document_clientId_idx";

-- DropIndex
DROP INDEX "Transaction_clientId_idx";

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "masterStatus";

-- AlterTable
ALTER TABLE "ClientService" ADD COLUMN     "masterStatus" "MasterStatus" NOT NULL DEFAULT 'DOCUMENT_GATHERING';

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "clientId",
ADD COLUMN     "clientServiceId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "clientId",
ADD COLUMN     "clientServiceId" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "ClientService_masterStatus_idx" ON "ClientService"("masterStatus");

-- CreateIndex
CREATE INDEX "Document_clientServiceId_idx" ON "Document"("clientServiceId");

-- CreateIndex
CREATE INDEX "Transaction_clientServiceId_idx" ON "Transaction"("clientServiceId");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_clientServiceId_fkey" FOREIGN KEY ("clientServiceId") REFERENCES "ClientService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_clientServiceId_fkey" FOREIGN KEY ("clientServiceId") REFERENCES "ClientService"("id") ON DELETE CASCADE ON UPDATE CASCADE;
