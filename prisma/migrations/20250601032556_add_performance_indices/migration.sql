-- CreateIndex
CREATE INDEX "InventoryMovement_locationId_createdAt_idx" ON "InventoryMovement"("locationId", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryMovement_productId_movementType_idx" ON "InventoryMovement"("productId", "movementType");

-- CreateIndex
CREATE INDEX "Purchase_createdAt_idx" ON "Purchase"("createdAt");

-- CreateIndex
CREATE INDEX "PurchaseItem_locationId_productId_idx" ON "PurchaseItem"("locationId", "productId");

-- CreateIndex
CREATE INDEX "PurchaseItem_purchaseId_idx" ON "PurchaseItem"("purchaseId");

-- CreateIndex
CREATE INDEX "Sale_createdAt_idx" ON "Sale"("createdAt");

-- CreateIndex
CREATE INDEX "SaleItem_locationId_productId_idx" ON "SaleItem"("locationId", "productId");

-- CreateIndex
CREATE INDEX "SaleItem_saleId_idx" ON "SaleItem"("saleId");

-- CreateIndex
CREATE INDEX "ShiftStockSnapshot_locationId_type_createdAt_idx" ON "ShiftStockSnapshot"("locationId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "ShiftStockSnapshot_shiftId_idx" ON "ShiftStockSnapshot"("shiftId");
