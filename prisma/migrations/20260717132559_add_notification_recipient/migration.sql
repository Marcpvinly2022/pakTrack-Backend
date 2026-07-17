/*
  Warnings:

  - Added the required column `recipient` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "recipient" VARCHAR(255) NOT NULL;
