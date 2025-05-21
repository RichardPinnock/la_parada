-- AlterTable
ALTER TABLE "Shift" ADD COLUMN     "stockLocationId" TEXT NOT NULL DEFAULT '8f75eb94-03da-4a16-9b21-47e88dcbbbb7';

-- CreateTable
CREATE TABLE "UserStockLocation" (
    "userId" TEXT NOT NULL,
    "stockLocationId" TEXT NOT NULL,

    CONSTRAINT "UserStockLocation_pkey" PRIMARY KEY ("userId","stockLocationId")
);

-- AddForeignKey
ALTER TABLE "UserStockLocation" ADD CONSTRAINT "UserStockLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStockLocation" ADD CONSTRAINT "UserStockLocation_stockLocationId_fkey" FOREIGN KEY ("stockLocationId") REFERENCES "StockLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_stockLocationId_fkey" FOREIGN KEY ("stockLocationId") REFERENCES "StockLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
