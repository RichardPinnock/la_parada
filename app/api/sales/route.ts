import { registerInventoryMovementFromSale } from "@/lib/inventory-utils";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    // Get the paginated sales and the total count concurrently
    const [sales, total] = await Promise.all([
        prisma.sale.findMany({
            skip,
            take: limit,
            where: {
                
                user: {
                    name: {
                        contains: searchParams.get("search") || "",
                        mode: "insensitive",
                    },
                },
                paymentMethod: {
                    name: {
                        contains: searchParams.get("search") || "",
                        mode: "insensitive",
                    },
                },
                items: {
                    some: {
                        product: {
                            name: {
                                contains: searchParams.get("search") || "",
                                mode: "insensitive",
                            },
                        },
                        location: {
                            name: {
                                contains: searchParams.get("search") || "",
                                mode: "insensitive",
                            },
                        }
                    },
                    
                },
                
            }
        }),
        prisma.sale.count(),
    ]);

    return NextResponse.json({
        sales,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { 
            userId, 
            paymentMethodId, 
            items,
            total,
            shiftId,
        }: {
            shiftId: string
            userId: string
            paymentMethodId: string
            items: { productId: string; quantity: number; unitPrice: number }[]
            total: number
        } = body

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'No se proporcionaron items' }, { status: 400 })
        }
        if (!userId || !paymentMethodId || !total || !shiftId) {
            return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
        }
        const shift = await prisma.shift.findUnique({
            where: { id: shiftId },
            include: {
                stockLocation: true,
            },
        });
        if (!shift) {
            return NextResponse.json({ error: 'Turno no encontrado' }, { status: 404 })
        }
        
        // const totalAmount = items.reduce((sum, item) => {
        //   return sum + item.quantity * item.unitPrice
        // }, 0)

        const sale = await prisma.sale.create({
            data: {
                userId,
                paymentMethodId,
                total,
                shiftId,
                items: {
                    create: items.map((item: any) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        locationId: shift.stockLocationId,
                        unitPrice: item.unitPrice,
                        total: item.quantity * item.unitPrice,
                    })),
                },
            },
        });

        await registerInventoryMovementFromSale(sale.id);

        return NextResponse.json(sale);
    } catch (error) {
        console.log("error al crear la venta", error);
        return NextResponse.json({ error: "Error al crear la venta" }, { status: 500 });
    }
}