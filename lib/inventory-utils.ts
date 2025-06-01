import prisma from "./prisma"

export enum MovementType {
  SALE = 'SALE',
  PURCHASE = 'PURCHASE',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER = 'TRANSFER',
}

export interface RegisterMovementParams {
  productId: number
  locationId: string
  quantity: number // puede ser positivo (compra, entrada) o negativo (venta, salida)
  movementType: MovementType
  reference?: string // ID relacionado a venta, compra, ajuste, transferencia
  userId: string    // opcional si quieres registrar trazabilidad
}

export async function registerInventoryMovement({
  productId,
  locationId,
  quantity,
  movementType,
  reference,
  userId,
}: RegisterMovementParams) {
  try {
    await prisma.inventoryMovement.create({
      data: {
        productId,
        locationId,
        quantity,
        movementType,
        reference,
        userId,
      }
    })
    // Actualizar el stock del producto en la ubicación
    await prisma.warehouseStock.upsert({
      where: {
        productId_locationId: {
          productId,
          locationId
        }
      },
      update: {
        quantity: {
          increment: quantity
        }
      },
      create: {
        productId,
        locationId,
        quantity
      }
    })
  } catch (error) {
    console.log('Error al registrar movimiento de inventario:', error)
    throw error
  }
}

export async function registerInventoryMovementFromSale(saleId: string, tx: any) {
  const sale = await tx.sale.findUnique({
    where: { id: saleId },
    include: {
      items: true,
      shift: {
        include: { stockLocation: true }
      }
    }
  });

  if (!sale || !sale.items.length) {
    throw new Error('Venta no encontrada o sin productos');
  }

  await Promise.all(
    sale.items.map(async (item: any) => {
      // 1. Crear el movimiento de inventario
      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          quantity: -item.quantity, // Negativo porque es una salida
          locationId: item.locationId,
          movementType: 'SALE',
          reference: sale.id,
          userId: sale.userId,
        },
      });

      // 2. Actualizar el stock en warehouse
      await tx.warehouseStock.update({
        where: {
          productId_locationId: {
            productId: item.productId,
            locationId: item.locationId,
          },
        },
        data: {
          quantity: {
            decrement: item.quantity, // Decrementar la cantidad vendida
          },
        },
      });
    })
  );
}

export async function registerInventoryMovementFromPurchase(purchaseId: number) {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      items: true,
    }
  })

  if (!purchase || !purchase.items.length) {
    throw new Error('Compra no encontrada o sin productos')
  }

  for (const item of purchase.items) {
    await registerInventoryMovement({
      productId: item.productId,
      locationId: item.locationId,
      quantity: item.quantity,
      movementType: MovementType.PURCHASE,
      reference: purchase.id.toString(),
      userId: purchase.userId
    })
  }
}

export async function registerInventoryMovementForTransfer({
  productId,
  fromLocationId,
  toLocationId,
  quantity,
  userId
}: {
  productId: number
  fromLocationId: string
  toLocationId: string
  quantity: number
  userId: string
}) {
  const transferId = crypto.randomUUID()

  await registerInventoryMovement({
    productId,
    locationId: fromLocationId,
    quantity: -quantity,
    movementType: MovementType.TRANSFER,
    reference: transferId,
    userId
  })

  await registerInventoryMovement({
    productId,
    locationId: toLocationId,
    quantity: quantity,
    movementType: MovementType.TRANSFER,
    reference: transferId,
    userId
  })

  return transferId
}

export async function registerInventoryAdjustment(idAdjustment: string) {
  const adjustment = await prisma.inventoryAdjustment.findUnique({
    where: { id: idAdjustment },
  })

  if (!adjustment) {
    throw new Error('Ajuste no encontrado')
  }

  await registerInventoryMovement({
    productId: adjustment.productId,
    locationId: adjustment.locationId,
    quantity: -adjustment.quantity,
    movementType: MovementType.ADJUSTMENT,
    reference: adjustment.id,
    userId: adjustment.userId
  })

}
