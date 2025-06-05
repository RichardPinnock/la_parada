import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";

import prisma from "@/lib/prisma";
import { withRole } from "@/lib/guardRole";
import { authOptions } from "@/auth";

export const GET = withRole(async (req: NextRequest, token) => {
  try {
    const url = new URL(req.url);

    const id = url.pathname.split("/").pop();
    console.log("id ==>", id);
    const session = await getServerSession(authOptions);

    if (!id) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }
    const userId = id === "1" ? session?.user?.id : id;
    if (!userId) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { 
        id: userId,
        NOT: {
          email: 'superAdmin@gmail.com', // Excluir superAdmin
        }
      },
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
})

// put
export const PUT = withRole(async (req: NextRequest, token) => {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();
    // Extraemos las propiedades, pueden venir o no en el request
    const { name, email, password, stockLocationIds, isActive, role } = body;

    // Validar existencia del usuario
    const existingUser = await prisma.user.findFirst({
      where: { 
        id,
        NOT: {
          email: 'superAdmin@gmail.com', // Excluir superAdmin
        }
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Validar existencia de ubicaciones de stock si se proporcionaron
    if ("stockLocationIds" in body && stockLocationIds && stockLocationIds.length > 0) {
      const existingStockLocations = await prisma.stockLocation.findMany({
        where: {
          id: { in: stockLocationIds },
        },
      });
      if (existingStockLocations.length !== stockLocationIds.length) {
        return NextResponse.json(
          { error: "Una o más ubicaciones de stock no existen" },
          { status: 404 }
        );
      }
    }

    // Construimos el objeto de actualización incluyendo solo las propiedades enviadas.
    const updateData: any = {};

    if ("name" in body && name !== undefined) updateData.name = name;
    if ("email" in body && email !== undefined) updateData.email = email;
    
    if ("role" in body && role !== undefined) updateData.role = role;
    if ("isActive" in body && isActive !== undefined) updateData.isActive = isActive;

    // Para el password, solo lo incluimos si tiene valor
    if ("password" in body && password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Para stockLocations, solo actualizamos si se envían stockLocationIds
    if ("stockLocationIds" in body && Array.isArray(stockLocationIds)) {
      updateData.stockLocations = {
        deleteMany: {}, // Opcional: eliminar asociaciones anteriores
        createMany: {
          data: stockLocationIds.map((stockLocationId: string) => ({
            stockLocationId,
          })),
        },
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
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
});
