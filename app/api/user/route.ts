import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: /api/user?limit=10&page=1
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // Parámetros de paginación, con valores por defecto
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const search = searchParams.get("search") || "";
  const skip = (page - 1) * limit;

  const where = search
  try {
    // Obtener usuarios con paginación
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      },
      skip,
      take: limit,
      include: {
        stockLocations: {
            select: {
                stockLocation: true
            }
        }, // Incluir ubicaciones de stock
      }
    });
    // Contar total de usuarios
    const total = await prisma.user.count();

    return NextResponse.json({
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return NextResponse.json(
      { message: "Error al obtener los usuarios" },
      { status: 500 }
    );
  }
}
