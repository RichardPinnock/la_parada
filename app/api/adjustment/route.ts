import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Listar todos los inventoryAdjustments
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    try {
        const where = search
            ? { 
                reason: { contains: search, mode: "insensitive" as const },
                user: {
                        name: {
                            contains: search,
                            mode: "insensitive" as const,
                        },
                    },
                    location: {
                        name: {
                            contains: search,
                            mode: "insensitive" as const,
                        },
                    },
                    product: {
                        name: {
                            contains: search,
                            mode: "insensitive" as const,
                        },
                    }
            }
            : {};

        const [inventoryAdjustments, total] = await prisma.$transaction([
            prisma.inventoryAdjustment.findMany({
                where,
                include: {
                    user: true,
                    location: true,
                    product: true,
                },
                skip: offset,
                take: limit,
            }),
            prisma.inventoryAdjustment.count({ where }),
        ]);

        if (!inventoryAdjustments || inventoryAdjustments.length === 0) {
            return NextResponse.json(
                { error: "No se encontraron registros de inventoryAdjustment" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            data: inventoryAdjustments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        return NextResponse.json({ error: "Error al obtener los inventoryAdjustments" }, { status: 500 });
    }
}

// Crear un nuevo inventoryAdjustment
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            userId,
            locationId,
            productId,
            reason,
            quantity,
        } = body
        const inventoryAdjustment = await prisma.inventoryAdjustment.create({
            data: {
                userId,
                locationId,
                productId,
                reason,
                quantity,
            },
        });
        return NextResponse.json(inventoryAdjustment, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Error al crear el inventoryAdjustment" }, { status: 500 });
    }
}