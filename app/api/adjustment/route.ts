import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withRole } from "@/lib/guardRole";

// Listar todos los inventoryAdjustments
export const GET = withRole( async(req: Request, token) => {
    const { searchParams } = new URL(req.url);
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
})
// const GET = withRole(async (req, token) =>

// Crear un nuevo inventoryAdjustment
export const POST = withRole( async(req: Request, token) => {
    try {
        const body = await req.json();
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
})