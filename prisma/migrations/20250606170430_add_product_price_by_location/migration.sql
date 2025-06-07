-- CreateTable
CREATE TABLE "ProductPriceByLocation" (
    "id" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "locationId" TEXT NOT NULL,
    "salePrice" DOUBLE PRECISION NOT NULL,
    "customerType" TEXT,
    "isPromo" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductPriceByLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductPriceByLocation_productId_locationId_idx" ON "ProductPriceByLocation"("productId", "locationId");

-- CreateIndex
CREATE INDEX "ProductPriceByLocation_locationId_startDate_endDate_idx" ON "ProductPriceByLocation"("locationId", "startDate", "endDate");

-- AddForeignKey
ALTER TABLE "ProductPriceByLocation" ADD CONSTRAINT "ProductPriceByLocation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPriceByLocation" ADD CONSTRAINT "ProductPriceByLocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "StockLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
