import { registerInventoryMovementForTransfer } from "@/lib/inventory-utils"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma";
import { withRole } from "@/lib/guardRole";
import { CreateShiftToday } from "../sales/route";


export const POST = withRole(async (req, token) => {
  try {
    const body = await req.json()
    const {
      productId,
      fromLocationId,
      toLocationId,
      quantity,
      userId
    } = body

    if (!productId || !fromLocationId || !toLocationId || !quantity) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    if (fromLocationId === toLocationId) {
      return NextResponse.json({ error: 'Las ubicaciones no pueden ser iguales' }, { status: 400 })
    }

    if (quantity <= 0) {
      return NextResponse.json({ error: 'La cantidad debe ser mayor que 0' }, { status: 400 })
    }

    // Aquí puedes agregar una validación opcional de stock antes de transferir
    const fromLocationStock = await prisma.product.findFirst({
      where: {
        id: productId,
      },
      select: {
        id: true,
        warehouseStocks: {
          where: {
            locationId: fromLocationId,
          },
        },
      }
    })
    if(!fromLocationStock || fromLocationStock.warehouseStocks.length === 0) {
      return NextResponse.json({ error: 'Producto no encontrado en la ubicación de origen' }, { status: 400 })
    }
    const fromLocationQuantity = fromLocationStock.warehouseStocks[0].quantity
    if (fromLocationQuantity < quantity) {
      return NextResponse.json({ error: `Stock insuficiente en la ubicación de origen: solo hay ${fromLocationQuantity} unidades disponibles.` }, { status: 400 })
    }

    const shiftFromLocation = await CreateShiftToday(userId, fromLocationId)
    if (!shiftFromLocation) {
      return NextResponse.json({ error: 'No se encontró un turno activo en la ubicación de origen' }, { status: 400 })
    }
    const shiftToLocation = await CreateShiftToday(userId, toLocationId)
    if (!shiftToLocation) {
      return NextResponse.json({ error: 'No se encontró un turno activo en la ubicación de destino' }, { status: 400 })
    }

    const transferId = await registerInventoryMovementForTransfer({
      productId,
      fromLocationId,
      toLocationId,
      quantity,
      userId
    })

    return NextResponse.json({ message: 'Transferencia realizada', transferId }, { status: 201 })
  } catch (error) {
    console.log('[TRANSFER_ERROR]', error)
    return NextResponse.json({ error: 'Error al procesar la transferencia' }, { status: 500 })
  }
})