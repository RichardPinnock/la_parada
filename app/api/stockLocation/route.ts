import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/stockLocation - list all stock locations
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;
    try {
        // Get the paginated stock locations and the total count concurrently
        const [stockLocations, total] = await Promise.all([
            prisma.stockLocation.findMany({
                skip,
                take: limit,
                where: {
                    name: {
                        contains: searchParams.get("search") || "",
                        mode: "insensitive",
                    },
                },
                orderBy: {
                    name: "asc",
                }
            }),
            prisma.stockLocation.count(),
        ]);
        if (!stockLocations || stockLocations.length === 0) {
            return NextResponse.json(
                { error: "No se encontraron ubicaciones de stock" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            stockLocations,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.log('error al listar stockLocations ',error);
        return NextResponse.json({ error: "Error al obtener las ubicaciones de stock" }, { status: 500 });
    }
}

// POST /api/stockLocation - create a new stock location
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const newStockLocation = await prisma.stockLocation.create({
            data: { ...body }
        });
        return NextResponse.json(newStockLocation);
    } catch (error) {
        console.log('error al crear stockLocation', error);
        return NextResponse.json({ error: "Error al crear la ubicación de stock" }, { status: 500 });
    }
}