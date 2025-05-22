import { registerInventoryMovementFromPurchase } from '@/lib/inventory-utils';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';


export async function GET() {
    try {
        // Obtiene todas las compras (purchase)
        const purchases = await prisma.purchase.findMany();
        return NextResponse.json(purchases, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Error al obtener las compras' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            userId,
            total,
            locationId,
            items,
        }: {
            userId: string
            total: number
            locationId: string
            items: { productId: string; quantity: number; unitPrice: number }[]
        } = body
        if (!userId || !total || !locationId || !items) {
            return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
        }
        if (items.length === 0) {
            return NextResponse.json({ error: 'No se han proporcionado productos' }, { status: 400 });
        }
        // validar q existen las cantidades de los productos en el locationId q se esta pasando
        const products = await prisma.product.findMany({
            where: {
                id: {
                    in: items.map((item: any) => item.productId) as number[],
                },
            },
            include: {
                warehouseStocks: {
                    where: {
                        locationId,
                    },
                },
            },
        })
        const insufficientStock = products.filter((product) => {
            const stock = product.warehouseStocks[0]?.quantity || 0;
            const item = items.find((item: any) => item.productId === product.id);
            return item && item.quantity > stock;
        });
        if (insufficientStock.length > 0) {
            const details = insufficientStock.map((product) => {
            const available = product.warehouseStocks[0]?.quantity || 0;
            const item = items.find((i: any) => i.productId === product.id);
            const productName = product.name || 'Producto desconocido';
            return {
                productId: product.id,
                productName,
                message: `El producto ${productName} no tiene suficiente cantidad en el almacén. Se solicitó ${item?.quantity} y solo hay ${available} disponible.`,
                requested: item?.quantity,
                available,
            };
            });
            return NextResponse.json({
            error: 'Stock insuficiente para algunos productos',
            details
            }, { status: 400 });
        }


        const newPurchase = await prisma.purchase.create({
            data: {
                userId,
                total,
                items: {
                    create: items.map((item: any) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitCost: item.unitPrice,
                        totalCost: item.quantity * item.unitPrice,
                        locationId,
                    })),
                },
            },
        });
        await registerInventoryMovementFromPurchase(newPurchase.id);
        return NextResponse.json(newPurchase, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Error al crear la compra' }, { status: 500 });
    }
}