-- DropIndex
DROP INDEX "Client_magicToken_key";

-- AlterTable
ALTER TABLE "Client" ALTER COLUMN "magicToken" DROP NOT NULL,
ALTER COLUMN "magicToken" DROP DEFAULT,
ALTER COLUMN "tokenExpiredAt" DROP NOT NULL;
