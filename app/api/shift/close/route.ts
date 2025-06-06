import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";
import { withRole } from "@/lib/guardRole";

// Endpoint para cerrar el turno actual del usuario logueado (si tiene mas de un local falla)
export const GET = withRole(async (req, token) =>{
  try {
    const session = await getServerSession(authOptions);
    //   console.log("session ===>>", session);
    let user: any = null;
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
    const stockLocationId = user.stockLocations[0]?.stockLocation.id;
    if (!stockLocationId) {
      return NextResponse.json(
        { error: "Error al obtener la ubicación del local asignado al usuario" },
        { status: 400 }
      );
    }
    const shift = await prisma.shift.findFirst({
        where: {
            stockLocationId,
            endTime: null, // Turnos abiertos
        },
        orderBy: {
            startTime: "desc", // El más reciente
        },
        include: {
            user: {
            select: {
                id: true,
                name: true,
                email: true,
            },
            },
            stockLocation: {
            select: {
                id: true,
                name: true,
            },
            },
        },
    })
    if (!shift) {
      return NextResponse.json(
        { error: "No hay turnos abiertos para cerrar" },
        { status: 404 }
      );
    }
    const snapshotsClose = await CloseSnapshots(stockLocationId);
    await prisma.shift.update({
        where: { id: shift.id },
        data: {
            endTime: new Date(), // Cerrar el turno con la hora actual
            snapshots: {
                createMany: {
                    data: snapshotsClose, // Crear snapshots de cierre
                }
            }
        },
    })
    return NextResponse.json(
      { message: "Turno cerrado correctamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al cerrar el turno", error);
    return NextResponse.json(
      { error: "Error al cerrar el turno" },
      { status: 500 }
    );
  }
})


async function CloseSnapshots(stockLocationId:string) {
    try {
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
            type: 'END',
        }));
        return snapshots;
    } catch (error) {
        console.log("Error al crear los snapshots para el cierre de turno", error);
        throw new Error("Error al crear los snapshots para el cierre de turno");
    }
}