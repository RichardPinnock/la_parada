import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {

  const session = await getServerSession(authOptions);
//   console.log("session ===>>", session);
  let user = null;
  try {
    
  
    if (session?.user?.id) {
      user = await prisma.user.findUnique({
        where: {
          id: session.user.id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          stockLocations: {
            select: {
              stockLocation: true,
            },
          },
        },
      });
    }
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    // console.log("user ===>>", user);
    

    const { searchParams } = new URL(req.url);
    const stockLocationId = user.stockLocations[0]?.stockLocation.id;
    const dateParam = searchParams.get("date");
    console.log('dateParam ===>>', dateParam);
    

    if (!stockLocationId) {
      return NextResponse.json(
        { error: "Missing stockLocationId" },
        { status: 400 }
      );
    }

    const date = dateParam ? new Date(dateParam + 'T00:00:00') : new Date();
    
    // Ajustamos start y end para que sean del día local
    // let start = new Date(date);
    // start.setUTCHours(0, 0, 0, 0);
    // let end = new Date(date);
    // end.setUTCHours(23, 59, 59, 999);
    
    // O alternativamente, más explícito:
    let start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    let end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
    

    // Turnos en ese local ese día
    const shifts = await prisma.shift.findMany({
      where: {
        stockLocationId,
        startTime: { gte: start, lte: end },
      },
      include: { user: true },
    });

    const firstShiftToday = await prisma.shift.findFirst({
      where: {
        stockLocationId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const latestShiftToday = await prisma.shift.findFirst({
      where: {
        stockLocationId,
        createdAt: {
          gte: start,
          lte: end,
        },
        endTime: {
          not: null, // Aseguramos que el turno haya terminado
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // const userIds = shifts.map((s) => s.userId);
    // const shiftIds = shifts.map((s) => s.id);

    // Productos activos en ese local
    const productsInLocation = await prisma.warehouseStock.findMany({
      where: { locationId: stockLocationId },
      include: { product: true },
    });

    // const productIds = productsInLocation.map((w) => w.productId);

    // Ventas del día en ese local
    const saleItems = await prisma.saleItem.findMany({
      where: {
        locationId: stockLocationId,
        sale: {
          createdAt: { gte: start, lte: end },
        },
      },
      include: {
        product: true,
        sale: {
          include: {
            paymentMethod: true, // Incluimos el método de pago para filtrar más adelante
          }
        },
      },
    });
    // de las ventas need sacar el total en efectivo y en trasferencia
    const totalCashAmount = saleItems
      .filter((s) => s.sale.paymentMethod.name == "efectivo")
      .reduce((acc, s) => acc + (s.quantity * s.product.salePrice), 0);

    const totalTransferAmount = saleItems
      .filter((s) => s.sale.paymentMethod.name == "transferencia")
      .reduce((acc, s) => acc + (s.quantity * s.product.salePrice), 0);

    // Entradas (movimientos tipo PURCHASE hacia ese local)
    const entradas = await prisma.inventoryMovement.findMany({
      where: {
        locationId: stockLocationId,
        movementType: "TRANSFER",
        createdAt: { 
          gte: firstShiftToday?.createdAt ?? start, 
          lte: latestShiftToday?.endTime ?? end,
        },
        quantity: {
          gt: 0, // Aseguramos que solo consideramos entradas positivas
        }
      },
    });

    // Ajustes (mermas)
    const ajustes = await prisma.inventoryAdjustment.findMany({
      where: {
        locationId: stockLocationId,
        createdAt: { gte: start, lte: end },
      },
    });

    // Salidas (movimientos tipo TRANSFER desde ese local a otro local)
    // Esto se mostraría en Merma 
    const salidas = await prisma.inventoryMovement.findMany({
      where: {
        locationId: stockLocationId,
        movementType: "TRANSFER",
        createdAt: { 
          gte: firstShiftToday?.createdAt ?? start, 
          lte: latestShiftToday?.endTime ?? end,
        },
        quantity: {
          lt: 0, // Aseguramos que solo consideramos salidas negativas
        }
      },
    });

    // Snapshots (inicio de turno)
    const snapshots = await prisma.shiftStockSnapshot.findMany({
      where: {
        locationId: stockLocationId,
        type: "START",
        createdAt: { gte: start, lte: end },
        shiftId: firstShiftToday?.id, // Aseguramos que solo tomamos el snapshot del último turno
      },
    });

    const ganancias = await calculateProfit(
      firstShiftToday?.createdAt ?? start,
      latestShiftToday?.endTime ?? end,
    )

    const result = productsInLocation.map(({ product }) => {
      const PC = product.purchasePrice;
      const PV = product.salePrice;
      const I = snapshots
        .filter((s) => s.productId === product.id)
        .reduce((acc, s) => acc + s.quantity, 0);

      const E = entradas
        .filter((m) => m.productId === product.id)
        .reduce((acc, m) => acc + m.quantity, 0);

      let M = ajustes
        .filter((a) => a.productId === product.id)
        .reduce((acc, a) => acc + a.quantity, 0);
      
      const S = salidas
        .filter((m) => m.productId === product.id)
        .reduce((acc, m) => acc + (m.quantity * -1), 0);
      
      M += S;

      const V = saleItems
        .filter((s) => s.productId === product.id)
        .reduce((acc, s) => acc + s.quantity, 0);

      const R = (I + E) - V - M;
      const T = V * PV;
      
      const G = ganancias.products.find((g) => g.productId === product.id)?.profit

      return {
        nombre: product.name,
        PC,
        PV,
        I,
        E,
        M,
        R,
        V,
        T,
        G,
      };
    });

    return NextResponse.json({
      date: start.toISOString(),
      shiftAuthors: shifts.map((s) => s.user.name),
      products: result,
      total: {
        totalCashAmount,
        totalTransferAmount,
      }
    });
  } catch (error) {
    console.log("[IPV_ERROR]", error);
    throw new Error("Error al procesar la solicitud de IPV");
  }
}

interface ProfitResult {
  productId: number;
  name: string;
  quantitySold: number;
  revenue: number;      // Ingreso total (ventas)
  realCost: number;     // Costo real FIFO
  profit: number;       // Ganancia real
  averagePrice: number; // Precio promedio de venta
  averageCost: number;  // Costo promedio real
}

async function calculateProfit(
  startDate: Date,
  endDate: Date,
  // productId?: number // opcional
) {
  try {
    const salesQuery = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      // items: productId ? {
      //   some: {
      //     productId
      //   }
      // } : undefined
    };

    const sales = await prisma.sale.findMany({
      where: salesQuery,
      include: {
        items: {
          include: {
            product: true,
            costAllocations: true
          }
        }
      }
    });

    const profitsByProduct = new Map<number, ProfitResult>();

    // Procesar cada venta
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!profitsByProduct.has(item.productId)) {
          profitsByProduct.set(item.productId, {
            productId: item.productId,
            name: item.product.name,
            quantitySold: 0,
            revenue: 0,
            realCost: 0,
            profit: 0,
            averagePrice: 0,
            averageCost: 0
          });
        }

        const stats = profitsByProduct.get(item.productId)!;
        const itemRevenue = item.quantity * item.unitPrice;
        const itemCost = item.costAllocations.reduce(
          (acc, alloc) => acc + (alloc.quantityUsed * alloc.unitCost), 
          0
        );

        stats.quantitySold += item.quantity;
        stats.revenue += itemRevenue;
        stats.realCost += itemCost;
        stats.profit += (itemRevenue - itemCost);
        stats.averagePrice = stats.revenue / stats.quantitySold;
        stats.averageCost = stats.realCost / stats.quantitySold;
      });
    });

    const results = Array.from(profitsByProduct.values());

    // if (productId) {
    //   return results[0] || null;
    // }

    return {
      products: results,
      summary: results.reduce((acc, curr) => ({
        totalRevenue: acc.totalRevenue + curr.revenue, // Ingreso total
        totalCost: acc.totalCost + curr.realCost, // Costo real total
        totalProfit: acc.totalProfit + curr.profit // Ganancia total
      }), {
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0
      })
    };

  } catch (error) {
    console.error("[CALCULATE_PROFIT_ERROR]", error);
    throw new Error("Error calculando ganancias");
  }
}