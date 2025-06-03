import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";
import { withRole } from "@/lib/guardRole";

export const GET = withRole(async (req, token) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      stockLocations: { select: { stockLocation: true } },
    },
  });

  let stockLocationId = user?.stockLocations[0]?.stockLocation.id;
  if (!stockLocationId) {
    return NextResponse.json(
      { error: "No se encontró local" },
      { status: 400 }
    );
  }

  const locationId = searchParams.get("locationId");
  const dateParam = searchParams.get("date");
  const date = dateParam ? new Date(`${dateParam}T00:00:00Z`) : new Date();
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999
  );

  if (locationId) {
    const location = await prisma.stockLocation.findUnique({
      where: { id: locationId },
    });
    if (!location) {
      return NextResponse.json(
        { error: "Ubicación por parámetro no encontrada" },
        { status: 404 }
      );
    } else {
      stockLocationId = location.id;
    }
  }
  const stockLocation = await prisma.stockLocation.findUnique({
    where: { id: stockLocationId },
  })
  

  const [firstShiftToday, latestShiftToday, shifts] = await Promise.all([
    prisma.shift.findFirst({
      where: { stockLocationId, createdAt: { gte: start, lte: end } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.shift.findFirst({
      where: {
        stockLocationId,
        createdAt: { gte: start, lte: end },
        endTime: { not: null },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.shift.findMany({
      where: { stockLocationId, startTime: { gte: start, lte: end } },
      include: { user: true },
    }),
  ]);

  console.log('shifts', shifts);
  
  
  // Luego, ejecutar las consultas que dependen de ellos en paralelo
  const [
    productsInLocation,
    saleItems,
    incomingItems, //entradas
    stockAdjustments, // ajustes de inventario
    stockOutflows, // salidas de inventario
    snapshots,
    financialSummary, // ganancias
    buyingTransactions, //compras
  ] = await Promise.all([
    prisma.warehouseStock.findMany({
      where: { locationId: stockLocationId },
      include: { product: true },
    }),
    prisma.saleItem.findMany({
      where: {
        locationId: stockLocationId,
        sale: { createdAt: { gte: start, lte: end } },
      },
      include: {
        product: true,
        sale: { include: { paymentMethod: true } },
      },
    }),
    prisma.inventoryMovement.findMany({
      where: {
        locationId: stockLocationId,
        movementType: "TRANSFER",
        createdAt: {
          gte: firstShiftToday?.createdAt ?? start,
          lte: latestShiftToday?.endTime ?? end,
        },
        quantity: { gt: 0 },
      },
    }),
    prisma.inventoryAdjustment.findMany({
      where: {
        locationId: stockLocationId,
        createdAt: { gte: start, lte: end },
      },
    }),
    prisma.inventoryMovement.findMany({
      where: {
        locationId: stockLocationId,
        movementType: "TRANSFER",
        createdAt: {
          gte: firstShiftToday?.createdAt ?? start,
          lte: latestShiftToday?.endTime ?? end,
        },
        quantity: { lt: 0 },
      },
    }),
    prisma.shiftStockSnapshot.findMany({
      where: {
        locationId: stockLocationId,
        type: "START",
        createdAt: { gte: start, lte: end },
        shiftId: firstShiftToday?.id,
      },
    }),
    calculateProfit(
      firstShiftToday?.createdAt ?? start,
      latestShiftToday?.endTime ?? end,
      shifts.map((s) => s.id)
    ),
    prisma.purchaseItem.findMany({
      where: {
        // Filtra por las ubicaciones incluidas en el array
        locationId: { in: [stockLocationId] },
        // Filtra por la fecha de la compra relacionada
        purchase: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      },
      include: {
        product: true,
        purchase: true,
        location: true,
        // incluye si necesitas las asignaciones de costos
        costAllocations: true,
      },
    })
  ]);

  const totalCashAmount = saleItems
    .filter((s) => s.sale.paymentMethod.name === "efectivo")
    .reduce((acc, s) => acc + s.quantity * s.product.salePrice, 0);

  const totalTransferAmount = saleItems
    .filter((s) => s.sale.paymentMethod.name === "transferencia")
    .reduce((acc, s) => acc + s.quantity * s.product.salePrice, 0);


    console.log('length productsInLocation', productsInLocation.length);
    console.log('locationId', stockLocationId);
    

  const result = productsInLocation.map(({ product }) => {
    console.log('name product', product.name);
    console.log('id product', product.id);
    
    const PC = product.purchasePrice;
    const PV = product.salePrice;
    const I = snapshots
      .filter((s) => s.productId === product.id)
      .reduce((acc, s) => acc + s.quantity, 0);
    let E = incomingItems
      .filter((m) => m.productId === product.id)
      .reduce((acc, m) => acc + m.quantity, 0);
    if (buyingTransactions.length > 0) {
      E += buyingTransactions
        .filter((c) => c.productId === product.id)
        .reduce((acc, c) => acc + c.quantity, 0);
    }
    let M = stockAdjustments
      .filter((a) => a.productId === product.id)
      .reduce((acc, a) => acc + a.quantity, 0);
    const S = stockOutflows
      .filter((m) => m.productId === product.id)
      .reduce((acc, m) => acc + -m.quantity, 0);
    M += S;
    const V = saleItems
      .filter((s) => s.productId === product.id)
      .reduce((acc, s) => acc + s.quantity, 0);
    const R = I + E - V - M;
    const T = V * PV;
    const G = financialSummary.products.find(
      (g) => g.productId === product.id
    )?.profit ?? 0;

    return { nombre: product.name, PC, PV, I, E, M, R, V, T, G };
  });

  return NextResponse.json({
    date: start.toISOString(),
    shiftAuthors: shifts
      .filter((s) => s.user.role === "dependiente")
      .map((s) => s.user.name),
    shiftManagers: shifts
      .filter((s) => s.user.role === "admin")
      .map((s) => s.user.name),
    products: result,
    total: { totalCashAmount, totalTransferAmount },
    stockLocation,
  });
})

async function calculateProfit(startDate: Date, endDate: Date, shiftIds: string[]) {
  const sales = await prisma.sale.findMany({
    where: { 
      createdAt: { gte: startDate, lte: endDate },
      shiftId: { in: shiftIds.length > 0 ? shiftIds : undefined },
    },
    include: {
      items: { include: { product: true, costAllocations: true } },
    },
  });
  console.log('startDate', startDate);
  console.log('endDate', endDate);
  console.log('shiftIds', shiftIds);
  
  console.log('sales', sales);
  

  const profitsByProduct = new Map<number, any>();

  for (const sale of sales) {
    for (const item of sale.items) {
      if (!profitsByProduct.has(item.productId)) {
        profitsByProduct.set(item.productId, {
          productId: item.productId,
          name: item.product.name,
          quantitySold: 0,
          revenue: 0,
          realCost: 0,
          profit: 0,
          averagePrice: 0,
          averageCost: 0,
        });
      }

      const stats = profitsByProduct.get(item.productId);
      const itemRevenue = item.quantity * item.unitPrice;
      const itemCost = item.costAllocations.reduce(
        (acc, alloc) => acc + alloc.quantityUsed * alloc.unitCost,
        0
      );

      stats.quantitySold += item.quantity; // Incrementa la cantidad vendida
      stats.revenue += itemRevenue; // Incrementa los ingresos totales
      stats.realCost += itemCost; // Incrementa el costo real total
      stats.profit += itemRevenue - itemCost; // Calcula la ganancia total
      stats.averagePrice = stats.revenue / stats.quantitySold; // Calcula el precio promedio
      stats.averageCost = stats.realCost / stats.quantitySold; // Calcula el costo promedio
    }
  }

  const results = Array.from(profitsByProduct.values());
  console.log("Profit results:", results);
  return {
    products: results,
    summary: results.reduce(
      (acc, curr) => ({
        totalRevenue: acc.totalRevenue + curr.revenue,
        totalCost: acc.totalCost + curr.realCost,
        totalProfit: acc.totalProfit + curr.profit,
      }),
      { totalRevenue: 0, totalCost: 0, totalProfit: 0 }
    ),
  };
}
