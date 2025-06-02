import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withRole } from "@/lib/guardRole";
import { registerInventoryAdjustment } from "@/lib/inventory-utils";

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
        }: {
            userId: string,
            locationId: string,
            reason: string,
            productId: number,
            quantity: number,
        } = body

        // validar campos requeridos
        if (!userId || !locationId || !productId || !reason || quantity == 0) {
            return NextResponse.json(
                { error: "Faltan campos requeridos" },
                { status: 400 }
            );
        }

        // validar que el usuario exista
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return NextResponse.json(
                { error: "Usuario no encontrado para realizar el ajuste" },
                { status: 404 }
            );
        }

        // validar que la ubicación exista
        const location = await prisma.stockLocation.findUnique({ where: { id: locationId } });
        if (!location) {
            return NextResponse.json(
                { error: "Ubicación no encontrada para realizar el ajuste" },
                { status: 404 }
            );
        }

        // validar que el producto exista y q tenga stock en la ubicación
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                warehouseStocks: {
                    where: { locationId },
                },
            },
        });

        if (!product) {
            return NextResponse.json(
                { error: "Producto no encontrado para realizar el ajuste" },
                { status: 404 }
            );
        }

        if (product.warehouseStocks.length === 0) {
            return NextResponse.json(
                { error: "El producto no tiene stock en la ubicación seleccionada" },
                { status: 404 }
            );
        }

        // validar que la cantidad sea un número positivo cuando se realiza un ajuste de inventario
        if (product.warehouseStocks[0].quantity - quantity < 0) {
            return NextResponse.json(
                { error: `La cantidad a ajustar no puede ser mayor al stock disponible (${product.warehouseStocks[0].quantity} unidades)` },
                { status: 400 }
            );
        }

        const inventoryAdjustment = await prisma.inventoryAdjustment.create({
            data: {
                userId,
                locationId,
                productId,
                reason,
                quantity,
            },
        });
        await registerInventoryAdjustment(inventoryAdjustment.id)
        return NextResponse.json(inventoryAdjustment, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Error al crear el inventoryAdjustment" }, { status: 500 });
    }
})