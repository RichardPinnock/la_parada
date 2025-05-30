/*
  Warnings:

  - The primary key for the `Purchase` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Purchase` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `purchaseId` on the `PurchaseItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "PurchaseItem" DROP CONSTRAINT "PurchaseItem_purchaseId_fkey";

-- AlterTable
ALTER TABLE "Purchase" DROP CONSTRAINT "Purchase_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "PurchaseItem" DROP COLUMN "purchaseId",
ADD COLUMN     "purchaseId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
