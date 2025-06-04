import { withRole } from "@/lib/guardRole";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";


export const GET = withRole(async (req: NextRequest, token) =>{
  const url = new URL(req.url)

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
})

export const PUT = withRole(async (req: NextRequest, token) => {
  const url = new URL(req.url);
  const id = Number(url.pathname.split('/').pop());

  if (isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const data = await req.json();
  
  try {

    const existingProductName = await prisma.product.findMany({
      where: {
        name: {
          in: [data.name],
          mode: "insensitive", // Hace que la comparación sea insensible a mayúsculas/minúsculas
        },
        NOT: {
          id: id, // Excluimos el producto que estamos actualizando
        },
      },
      select: { name: true },
    });
    if( existingProductName.length > 0) {
      return NextResponse.json(
        { error: "Ya existe un producto con ese nombre" },
        { status: 400 }
      );
    }


    // Construimos el objeto de datos a actualizar
    const updateData: any = {
      name: data.name,
      purchasePrice: parseFloat(data.purchasePrice),
      salePrice: parseFloat(data.salePrice),
      isActive: data.isActive,
    };
    
    // Si viene imageName en el body, la incluimos en los datos a actualizar
    if (data.imageName) {
      updateData.imageName = data.imageName;
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Error actualizando el producto:", error);
    return NextResponse.json(
      { error: "Error al actualizar el producto" },
      { status: 500 }
    );
  }
});
