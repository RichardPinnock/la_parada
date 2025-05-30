import { registerInventoryMovementFromSale } from "@/lib/inventory-utils";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
            items,
            total,
            paymentMethodId = 'Efectivo', // Default to 'efectivo' if not provided (no se usa)
            shiftId = 'today' // Default to 'today' if not provided (no se usa)
        }: {
            shiftId: string
            userId: string
            paymentMethodId: string
            items: { productId: number; quantity: number; unitPrice: number }[]
            total: number
        } = body

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'No se proporcionaron items' }, { status: 400 })
        }
        if (!userId || !paymentMethodId || !total || !shiftId) {
            return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
        }

        const shift = await CreateShiftToday(userId);
        const paymentMethod = await prisma.paymentMethod.findUnique({
            where: { name: 'Efectivo' },
        })
        if (!paymentMethod) {
            return NextResponse.json({ error: 'Método de pago Efectivo no encontrado' }, { status: 404 })
        }
        if (!shift) {
            return NextResponse.json({ error: 'Turno no encontrado' }, { status: 404 })
        }
        
        // const totalAmount = items.reduce((sum, item) => {
        //   return sum + item.quantity * item.unitPrice
        // }, 0)

        const sale = await prisma.sale.create({
            data: {
                userId,
                paymentMethodId: paymentMethod.id,
                total,
                shiftId: shift.id,
                items: {
                    create: items.map((item: { productId: number; quantity: number; unitPrice: number }) => ({
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


async function CreateShiftToday(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { 
                id: userId,
                isActive: true
            },
            select: {
                id: true,
                stockLocations: {
                    select: {
                        stockLocationId: true,
                    }
                },
            }
        })

        if (!user) {
            throw new Error("No se encontró el usuario o no está activo para crear un turno");
        }

        if (user.stockLocations.length === 0) {
            throw new Error("El usuario no tiene ubicaciones de stock asignadas");
        }

        const stockLocation = user.stockLocations[0]; // Usar la primera ubicación de stock del usuario
        // buscar si ya existe un turno para el dia de hoy
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        const existingShift = await prisma.shift.findFirst({
            where: {
                userId: user.id,
                stockLocationId: stockLocation.stockLocationId,
                startTime: {
                    gte: startOfDay,
                    lt: endOfDay,
                },
            },
        });
        if (existingShift) {
            return existingShift; // Si ya existe un turno para hoy, lo retornamos
        }
        // Si no existe, creamos un nuevo turno
        // Obtener los snapshots(productos para el turno) iniciales de los productos en la ubicación de stock
        const snapshots = await StartSnapshots(stockLocation.stockLocationId);
        const newShift = await prisma.shift.create({
            data: {
                userId: user.id,
                stockLocationId: stockLocation.stockLocationId,
                startTime: startOfDay,
                startAmount: 0, // Se puede ajustar según sea necesario
                snapshots: {
                    createMany: {
                        data: [...snapshots],
                    }
                }
            },
        });
        return newShift;
    } catch (error) {
        console.log('Error al crear el turno del día actual: ', error);
        throw new Error("Error al crear el turno del día actual");
    }
}

async function StartSnapshots(stockLocationId:string) {
    try {
        // need devolver un array de snapshots de los productos en la ubicación de stock
        const products = await prisma.product.findMany({
            where: {
                warehouseStocks: {
                    some: {
                        locationId: stockLocationId,
                    }
                }
            },
            select: {
                id: true,
                name: true,
                warehouseStocks: {
                    select: { 
                        quantity: true,
                        product: true,
                        location: true,
                        locationId: true,
                    },
                },
            },
        });
        if (!products || products.length === 0) {
            throw new Error("No se encontraron productos en la ubicación de stock");
        }
        const snapshots = products.map(product => ({
            productId: product.id,
            locationId: stockLocationId,
            quantity: product.warehouseStocks
            .filter(stock => stock.locationId === stockLocationId)
            .reduce((sum, stock) => sum + stock.quantity, 0),
            type: 'START',
        }));
        return snapshots;
    } catch (error) {
        console.log("Error al obtener los productos para los snapshots:", error);
        throw new Error("Error al obtener los productos para los snapshots");
    }
}