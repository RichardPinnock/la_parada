import { registerInventoryMovementForTransfer } from "@/lib/inventory-utils"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
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
}