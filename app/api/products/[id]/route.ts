import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";


export async function GET(
  request: NextRequest,
) {
  const url = new URL(request.url)

  const id = Number(url.pathname.split('/').pop() )
  if (isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      warehouseStocks: {
        include: {
          location: true,
        },
      },
    },
  });

  if (!product) {
    return NextResponse.json(
      { error: "Producto no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(product);
}
