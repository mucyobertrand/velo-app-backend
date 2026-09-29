-- CreateEnum
CREATE TYPE "TransactionCategory" AS ENUM ('transfer', 'merchant', 'electricity', 'water', 'government', 'tax', 'withdrawal', 'airtime', 'other');

-- AlterTable
ALTER TABLE "ParsingRule" ADD COLUMN     "category" "TransactionCategory" NOT NULL DEFAULT 'other',
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "sample" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ParsingRule_name_key" ON "ParsingRule"("name");

