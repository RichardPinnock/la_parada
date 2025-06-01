import { authOptions } from "@/auth";
import { registerInventoryMovementFromPurchase } from "@/lib/inventory-utils";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;
    
    // Obtiene todas las compras (purchase)
    const purchases = await prisma.purchase.findMany({
      where: {
        OR: [
          {
            user: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
          {
            id: {
              equals: !isNaN(Number(search)) ? Number(search) : -1,
            },
          },
          {
            items: {
              some: {
                OR: [
                  {
                    product: {
                      name: {
                        contains: search,
                        mode: "insensitive",
                      },
                    },
                  },
                  {
                    location: {
                      name: {
                        contains: search,
                        mode: "insensitive",
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
      },
      include: {
        user: true, // Incluye los datos del usuario
        items: {
          include: {
            product: true, // Incluye los datos del producto
            location: true, // Incluye los datos de la ubicación
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(purchases, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener las compras" },
      { status: 500 }
    );
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
      userId: string;
      total: number;
      locationId: string;
      items: { productId: string; quantity: number; unitPrice: number }[];
    } = body;
    if (!userId || !total || !locationId || !items) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }
    if (items.length === 0) {
      return NextResponse.json(
        { error: "No se han proporcionado productos" },
        { status: 400 }
      );
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
    return NextResponse.json(
      { error: "Error al crear la compra" },
      { status: 500 }
    );
  }
}
