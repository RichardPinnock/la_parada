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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      stockLocations: { select: { stockLocation: true } },
    },
  });

  const stockLocationId = user?.stockLocations[0]?.stockLocation.id;
  if (!stockLocationId) {
    return NextResponse.json(
      { error: "Missing stockLocationId" },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");
  const date = dateParam ? new Date(`${dateParam}T00:00:00`) : new Date();
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

  const [firstShiftToday, latestShiftToday] = await Promise.all([
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
  ]);
  
  // Luego, ejecutar las consultas que dependen de ellos en paralelo
  const [
    shifts,
    productsInLocation,
    saleItems,
    incomingItems, //entradas
    stockAdjustments, // ajustes de inventario
    stockOutflows, // salidas de inventario
    snapshots,
    financialSummary, // ganancias
    buyingTransactions, //compras
  ] = await Promise.all([
    prisma.shift.findMany({
      where: { stockLocationId, startTime: { gte: start, lte: end } },
      include: { user: true },
    }),
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
      latestShiftToday?.endTime ?? end
    ),
    prisma.purchaseItem.findMany({
      where: {
        // Filtra por las ubicaciones incluidas en el array
        locationId: { in: user?.stockLocations.map((sl) => sl.stockLocation.id) },
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

  const result = productsInLocation.map(({ product }) => {
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
    shiftAuthors: shifts.map((s) => s.user.name),
    products: result,
    total: { totalCashAmount, totalTransferAmount },
  });
})

async function calculateProfit(startDate: Date, endDate: Date) {
  const sales = await prisma.sale.findMany({
    where: { createdAt: { gte: startDate, lte: endDate } },
    include: {
      items: { include: { product: true, costAllocations: true } },
    },
  });

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

      stats.quantitySold += item.quantity;
      stats.revenue += itemRevenue;
      stats.realCost += itemCost;
      stats.profit += itemRevenue - itemCost;
      stats.averagePrice = stats.revenue / stats.quantitySold;
      stats.averageCost = stats.realCost / stats.quantitySold;
    }
  }

  const results = Array.from(profitsByProduct.values());
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
