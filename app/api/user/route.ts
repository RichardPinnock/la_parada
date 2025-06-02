import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET: /api/user?limit=10&page=1
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // Parámetros de paginación, con valores por defecto
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const search = searchParams.get("search") || "";
  const skip = (page - 1) * limit;

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
            stockLocation: true,
          },
        }, // Incluir ubicaciones de stock
      },
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

// POST: /api/user
export async function POST(request: Request) {
  const body = await request.json();
  const {
    name,
    email,
    isActive = true,
    password,
    stockLocationIds,
    role = "dependiente",
  }: {
    name: string;
    email: string;
    password: string;
    stockLocationIds: string[];
    role: string;
    isActive: boolean;
  } = body;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json(
        { message: "Existe un usuario con ese email, cámbielo" },
        { status: 400 }
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
    // Crear nuevo usuario
    const user = await prisma.user.create({
      data: {
        name,
        email,
        role,
        isActive,
        password: await bcrypt.hash(password, 10),
        stockLocations: {
          createMany: {
            data: stockLocationIds.map((id) => ({
              stockLocationId: id,
            })),
          },
        },
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.log("Error al crear usuario:", error);
    return NextResponse.json(
      { message: "Error al crear el usuario" },
      { status: 500 }
    );
  }
}
