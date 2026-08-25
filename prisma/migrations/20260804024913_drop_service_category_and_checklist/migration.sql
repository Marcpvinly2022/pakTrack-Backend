/*
  Warnings:

  - You are about to drop the column `serviceCategoryId` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `checklistTemplateId` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the `ChecklistItemTemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServiceCategory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ChecklistItemTemplate" DROP CONSTRAINT "ChecklistItemTemplate_serviceCategoryId_fkey";

-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_serviceCategoryId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_checklistTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceCategory" DROP CONSTRAINT "ServiceCategory_tenantId_fkey";

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "serviceCategoryId";

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "checklistTemplateId";

-- DropTable
DROP TABLE "ChecklistItemTemplate";

-- DropTable
DROP TABLE "ServiceCategory";
