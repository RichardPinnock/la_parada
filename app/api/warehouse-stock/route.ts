import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";


// GET /api/warehouse-stock - Obtiene todos los registros de warehouseStock
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    // Ejemplo de filtro: por propiedad "name"
    const nameFilter = searchParams.get('name');
    let where: Record<string, any> = {};
    if (nameFilter) {
        where = {
            ...where,
            name: {
                contains: nameFilter,
                mode: 'insensitive'
            }
        };
    }

    try {
        const [warehouseStocks, total] = await Promise.all([
            prisma.warehouseStock.findMany({
                where,
                skip,
                take: limit,
            }),
            prisma.warehouseStock.count({ where })
        ]);
        if (!warehouseStocks || warehouseStocks.length === 0) {
            return NextResponse.json(
                { error: 'No se encontraron registros de warehouseStock' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            data: warehouseStocks,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.log('error al listar warehouseStocks', error);
        return NextResponse.error();
    }
}

// POST /api/warehouse-stock - Crea un nuevo registro de warehouseStock
export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { productId, quantity, locationId } = data;

        // Valida o procesa 'data' según sea necesario
        const createdWarehouseStock = await prisma.warehouseStock.create({
            data:{
                productId,
                locationId,
                quantity,
            },
        });

        return NextResponse.json(createdWarehouseStock, { status: 201 });
    } catch (error) {
        console.log('error al crear warehouseStock', error);
        // return NextResponse.json(
        //     { error: 'Ocurrió un error inesperado al crear warehouse-stock, por favor comuníquese con soporte' },
        //     { status: 500 }
        // );
        return NextResponse.error();
    }
}