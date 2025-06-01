-- CreateTable
CREATE TABLE "SaleItemCostAllocation" (
    "id" TEXT NOT NULL,
    "saleItemId" TEXT NOT NULL,
    "purchaseItemId" TEXT NOT NULL,
    "quantityUsed" INTEGER NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "SaleItemCostAllocation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SaleItemCostAllocation" ADD CONSTRAINT "SaleItemCostAllocation_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItemCostAllocation" ADD CONSTRAINT "SaleItemCostAllocation_purchaseItemId_fkey" FOREIGN KEY ("purchaseItemId") REFERENCES "PurchaseItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
