import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const data = await request.json();
        const { productId, quantity, locationId } = data;
        // q exista la fila en bd
        const warehouseStock = await prisma.warehouseStock.findUnique({
            where: { id },
        });
        if (!id || !warehouseStock) {
            return NextResponse.json(
                { error: 'No se encontró warehouseStock con el id proporcionado' },
                { status: 400 }
            );
        }

        // Valida o procesa 'data' según sea necesario
        const updatedWarehouseStock = await prisma.warehouseStock.update({
            where: { id },
            data: {
                productId,
                locationId,
                quantity,
            },
        });

        return NextResponse.json(updatedWarehouseStock);
    } catch (error) {
        console.log('error al actualizar warehouseStock', error);
        // return NextResponse.json(
        //     { error: 'Ocurrió un error inesperado al actualizar warehouse-stock, por favor comuníquese con soporte' },
        //     { status: 500 }
        // );
        return NextResponse.error();
    }
}