import { registerInventoryMovementFromSale } from "@/lib/inventory-utils";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withRole } from "@/lib/guardRole";

export const GET = withRole(async (req, token) => {
    const { searchParams } = new URL(req.url);
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
})

export const POST = withRole(async (req, token) =>{
    try {
        const body = await req.json();
        const { 
            userId, 
            items,
            total,
            transferCode, // solo se usa para transferencias, no se usa en efectivo
            paymentMethodName = 'efectivo', // Default to 'efectivo' if not provided (no se usa)
            shiftId = 'today' // Default to 'today' if not provided (no se usa)
        }: {
            shiftId: string
            userId: string
            paymentMethodName: string
            items: { productId: number; quantity: number; unitPrice: number }[]
            total: number,
            transferCode?: string // Optional, only used for transfers
        } = body

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'No se proporcionaron items' }, { status: 400 })
        }
        if (!userId || !paymentMethodName || !total || !shiftId) {
            return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
        }
        if (paymentMethodName === 'transferencia' && !transferCode) {
            throw new Error('Código de transferencia es requerido para este método de pago');
        }

        // const shift = await CreateShiftToday(userId);
        // const paymentMethod = await prisma.paymentMethod.findUnique({
        //     where: { name: paymentMethodName },
        // })
        // if (!paymentMethod) {
        //     return NextResponse.json({ error: 'Método de pago Efectivo no encontrado' }, { status: 404 })
        // }
        // if (!shift) {
        //     return NextResponse.json({ error: 'Turno no encontrado' }, { status: 404 })
        // }
        
        // // const totalAmount = items.reduce((sum, item) => {
        // //   return sum + item.quantity * item.unitPrice
        // // }, 0)

        // const sale = await prisma.sale.create({
        //     data: {
        //         userId,
        //         paymentMethodId: paymentMethod.id,
        //         total,
        //         shiftId: shift.id,
        //         transferCode,
        //         items: {
        //             create: items.map((item: { productId: number; quantity: number; unitPrice: number }) => ({
        //                 productId: item.productId,
        //                 quantity: item.quantity,
        //                 locationId: shift.stockLocationId,
        //                 unitPrice: item.unitPrice,
        //                 total: item.quantity * item.unitPrice,
        //             })),
        //         },
        //     },
        //     select: {
        //         items: true,
        //         id: true,
        //         createdAt: true,
        //         user: {
        //             select: {
        //                 id: true,
        //                 name: true,
        //             }
        //         },
        //         shift: true,
        //         total: true,
        //         paymentMethod: {
        //             select: {
        //                 id: true,
        //                 name: true,
        //             }
        //         },
        //         transferCode: true,

        //     }
        // });

        // await registerInventoryMovementFromSale(sale.id);
        // // Registrar las asignaciones de costo para cada item
        // await Promise.all(
        //     sale.items.map(item => registerCostAllocationForSaleItem(item.id))
        // );
        // Usar transacción para garantizar atomicidad
        const sale = await prisma.$transaction(
            async (tx) => {
                // 1. Obtener/Crear turno
                const shift = await CreateShiftToday(userId);
                if (!shift) throw new Error('No se pudo crear/obtener el turno');

                // 2. Verificar método de pago
                const paymentMethod = await tx.paymentMethod.findUnique({
                    where: { name: paymentMethodName },
                });
                if (!paymentMethod) throw new Error('Método de pago no encontrado');
                
                const sales = await tx.sale.findMany({
                    where: {
                        transferCode: transferCode,
                    }
                })
                if (sales.length > 0) {
                    throw new Error('Ya existe una venta con este código de transferencia');
                }

                // 3. Crear la venta con sus items
                const newSale = await tx.sale.create({
                    data: {
                        userId,
                        paymentMethodId: paymentMethod.id,
                        total,
                        shiftId: shift.id,
                        transferCode,
                        items: {
                            create: items.map(item => ({
                                productId: item.productId,
                                quantity: item.quantity,
                                locationId: shift.stockLocationId,
                                unitPrice: item.unitPrice,
                                total: item.quantity * item.unitPrice,
                            })),
                        },
                    },
                    include: {
                        items: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                            }
                        },
                        shift: true,
                        paymentMethod: {
                            select: {
                                id: true,
                                name: true,
                            }
                        },
                    }
                });

                // 4. Registrar movimientos de inventario
                await registerInventoryMovementFromSale(newSale.id, tx);

                // 5. Registrar asignaciones de costo
                for (const item of newSale.items) {
                    await registerCostAllocationForSaleItem(item.id, tx);
                }

                return newSale;
            }, {
                timeout: 10000, // 10 segundos en lugar de 5
                maxWait: 8000   // tiempo máximo de espera para iniciar la transacción
            }
        );
        
        return NextResponse.json(sale);
    } catch (error) {
        console.log("error al crear la venta", error);
        return NextResponse.json({ error: "Error al crear la venta" }, { status: 500 });
    }
})


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

async function registerCostAllocationForSaleItem(
  saleItemId: string,
  tx: any // Prisma transaction
) {
  // 1. Obtener detalles del item vendido
  const saleItem = await tx.saleItem.findUnique({
    where: { id: saleItemId },
    include: {
      product: true,
      location: true,
    },
  });

  if (!saleItem) throw new Error('SaleItem no encontrado');

  const { productId, quantity, locationId } = saleItem;
  let remainingQuantity = quantity;

  // 2. Obtener compras disponibles ordenadas por fecha (FIFO)
  const availablePurchases = await tx.purchaseItem.findMany({
    where: {
      productId,
//      locationId,   //evito buscar por locationId para que tome las compras de todas las ubicaciones ya q se puede transferir
      quantity: { gt: 0 }
    },
    orderBy: { 
      purchase: { createdAt: 'asc' }
    },
  });

  if (!availablePurchases.length) {
    throw new Error(`No hay compras disponibles para el producto ${saleItem.product.name}`);
  }

  // 4. Procesar cada compra hasta cubrir la cantidad vendida
  for (const purchase of availablePurchases) {
    if (remainingQuantity <= 0) break;

    const usedInAllocations = await tx.saleItemCostAllocation.aggregate({
      where: { purchaseItemId: purchase.id },
      _sum: { quantityUsed: true },
    });

    const usedQuantity = usedInAllocations._sum.quantityUsed || 0;
    const availableQuantity = purchase.quantity - usedQuantity;

    if (availableQuantity <= 0) continue;

    const quantityToUse = Math.min(availableQuantity, remainingQuantity);

    // 5. Registrar la asignación de costo usando la transacción
    await tx.saleItemCostAllocation.create({
      data: {
        saleItemId,
        purchaseItemId: purchase.id,
        quantityUsed: quantityToUse,
        unitCost: purchase.unitCost,
      },
    });

    remainingQuantity -= quantityToUse;
  }

  if (remainingQuantity > 0) {
    throw new Error(
      `Stock insuficiente para ${saleItem.product.name}. Faltan ${remainingQuantity} unidades`
    );
  }
}