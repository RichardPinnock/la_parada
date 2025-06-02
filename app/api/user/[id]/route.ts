import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);

    const id = url.pathname.split("/").pop();
    console.log("id ==>", id);

    if (!id) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        stockLocations: {
          select: {
            stockLocation: true,
          },
        }, // Incluir ubicaciones de stock
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.log("Error al obtener el usuario:", error);
    return NextResponse.json(
      { error: "Error al obtener el usuario" },
      { status: 500 }
    );
  }
}

// put
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      email,
      password = null,
      stockLocationIds,
      isActive = true,
      role,
    }: {
      name: string;
      email: string;
      password: string | null;
      stockLocationIds: string[];
      role: string;
      isActive: boolean;
    } = body;

    // Validar existencia del usuario
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }
    // Validar existencia de ubicaciones de stock
    const existingStockLocations = await prisma.stockLocation.findMany({
      where: {
        id: {
          in: stockLocationIds,
        },
      },
    });
    if (existingStockLocations.length !== stockLocationIds.length) {
      return NextResponse.json(
        { error: "Una o más ubicaciones de stock no existen" },
        { status: 404 }
      );
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        role,
        isActive,
        stockLocations: {
          deleteMany: {},
          createMany: {
            data: stockLocationIds.map((stockLocationId: string) => ({
              stockLocationId: stockLocationId,
            })),
          },
        },
        // Solo incluimos password si viene con valor
        ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
      },
      include: {
        stockLocations: {
          select: {
            stockLocation: true,
          },
        },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error al actualizar el usuario:", error);
    return NextResponse.json(
      { error: "Error al actualizar el usuario" },
      { status: 500 }
    );
  }
}
