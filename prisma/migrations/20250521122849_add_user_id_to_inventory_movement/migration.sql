/*
  Warnings:

  - Added the required column `userId` to the `InventoryMovement` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "InventoryMovement" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Shift" ALTER COLUMN "stockLocationId" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
