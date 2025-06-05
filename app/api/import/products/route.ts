// app/api/products/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const products = await req.json();
    const namesToImport = products.map((p: any) => p.name);

    // Buscamos en la BD los productos cuyos nombres ya existan (case insensitive)
    const existingProducts = await prisma.product.findMany({
      where: {
        name: {
          in: namesToImport,
          mode: "insensitive", // Hace que la comparación sea insensible a mayúsculas/minúsculas
        },
      },
      select: { name: true },
    });

    if (existingProducts.length > 0) {
      const duplicateNames = existingProducts
        .map((prod) => prod.name)
        .join(", ");
      return NextResponse.json(
        { error: "Algunos productos ya existen", duplicates: duplicateNames },
        { status: 400 }
      );
    }

    const created = await prisma.product.createMany({
      data: products.map((p: any) => ({
        name: p.name,
        purchasePrice: p.purchasePrice,
        salePrice: p.sellPrice,
        imageName: "/fallback.jpg", // Default image name
        stock: 0, // Default stock value
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({
      message: "Cargado todos los productos exitosamente",
      count: created.count,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al importar" }, { status: 500 });
  }
}
