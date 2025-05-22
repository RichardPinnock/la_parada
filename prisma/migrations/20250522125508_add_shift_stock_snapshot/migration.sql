-- CreateTable
CREATE TABLE "ShiftStockSnapshot" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "locationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShiftStockSnapshot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ShiftStockSnapshot" ADD CONSTRAINT "ShiftStockSnapshot_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftStockSnapshot" ADD CONSTRAINT "ShiftStockSnapshot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftStockSnapshot" ADD CONSTRAINT "ShiftStockSnapshot_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "StockLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
