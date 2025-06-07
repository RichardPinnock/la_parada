import { withRole } from "@/lib/guardRole";
import { UpdateProductPriceInput } from "@/lib/models/products";
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
  console.log('Datos recibidos para actualizar el producto:', data);
  
  
  if (data.priceByLocations && Array.isArray(data.priceByLocations)) {
    console.log('Actualizando precios por ubicación:', data.priceByLocations);
    
    for (const price of data.priceByLocations) {
      if (price.salePrice < 0 || isNaN(price.salePrice)) {
        continue; // Ignorar precios inválidos
        return NextResponse.json(
          { error: "El precio de venta es inválido" },
          { status: 400 }
        );
      }
      
      if (!price.locationId || typeof price.locationId !== 'string') {
        return NextResponse.json(
          { error: "El ID de ubicación es inválido" },
          { status: 400 }
        );
      }

      await updateProductSalePrice({
        productId: id,
        locationId: price.locationId,
        newPrice: price.salePrice,
      })

    }
  }

  
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


export async function updateProductSalePrice({
  productId,
  locationId,
  newPrice,
}: UpdateProductPriceInput) {
  if (newPrice < 0) {
    throw new Error('El precio no puede ser negativo')
  }

  let updated;
  try {
    // Se valida q solo exista un precio por producto y ubicación
    const existing = await prisma.productPriceByLocation.findFirst({
      where: {
        productId,
        locationId,
      },
    });

    if (existing) {
      updated = await prisma.productPriceByLocation.update({
        where: {
          id: existing.id,
        },
        data: {
          salePrice: newPrice,
        },
      });
    } else {
      updated = await prisma.productPriceByLocation.create({
        data: {
          productId,
          locationId,
          salePrice: newPrice,
        },
      });
    }
  } catch (error) {
    console.error("Error upserting product price by location:", error);
    throw new Error("Error al actualizar o crear el precio del producto");
  }
  
  return updated;
}
