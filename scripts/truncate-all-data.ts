import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function truncateAllTables() {
  try {
    // Deshabilitar restricciones temporalmente
    await prisma.$executeRaw`SET CONSTRAINTS ALL DEFERRED;`

    // Truncar todas las tablas
    await prisma.$transaction([
      prisma.$executeRaw`DELETE FROM "SaleItemCostAllocation";`,
      prisma.$executeRaw`DELETE FROM "ShiftStockSnapshot";`,
      prisma.$executeRaw`DELETE FROM "InventoryMovement";`,
      prisma.$executeRaw`DELETE FROM "InventoryAdjustment";`,
      prisma.$executeRaw`DELETE FROM "SaleItem";`,
      prisma.$executeRaw`DELETE FROM "PurchaseItem";`,
      prisma.$executeRaw`DELETE FROM "Sale";`,
      prisma.$executeRaw`DELETE FROM "Purchase";`,
      prisma.$executeRaw`DELETE FROM "Shift";`,
      prisma.$executeRaw`DELETE FROM "WarehouseStock";`,
      prisma.$executeRaw`DELETE FROM "UserStockLocation";`,
      prisma.$executeRaw`DELETE FROM "Post";`,
      prisma.$executeRaw`DELETE FROM "PaymentMethod";`,
      prisma.$executeRaw`DELETE FROM "StockLocation";`,
      prisma.$executeRaw`DELETE FROM "Product";`,
      prisma.$executeRaw`DELETE FROM "User";`,
    ])

    // Rehabilitar restricciones
    await prisma.$executeRaw`SET CONSTRAINTS ALL IMMEDIATE;`

    console.log('✅ Todas las tablas han sido vaciadas exitosamente')
  } catch (error) {
    console.error('❌ Error al vaciar las tablas:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

truncateAllTables()
// ponerlo en los script del package.json y luego ejecutar con: npm run truncate-db
// "truncate-db": "tsx scripts/truncate-all-data.ts"