import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);

    const id = url.pathname.split("/").pop();
    console.log('id ==>', id);
    
    if (!id) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        stockLocations: {
            select: {
                stockLocation: true
            }
        }, // Incluir ubicaciones de stock
      }
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
