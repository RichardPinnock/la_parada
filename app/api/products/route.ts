import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";
import { parse } from "path";
import { withRole } from "@/lib/guardRole";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  let user: any = null;
  if (session?.user?.id) {
    user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        stockLocations: {
          select: {
            stockLocation: true,
          },
        },
      },
    });
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const productsPerPage = parseInt(url.searchParams.get("limit") || "10");
  const search = url.searchParams.get("search") || "";
  const offset = (page - 1) * productsPerPage;

  // Construir condiciones de filtro para usuario
  const locationWhere =
    !session?.user?.id || user?.role == "admin"
      ? {}
      : {
          locationId: {
            in: user?.stockLocations.map(
              (location) => location.stockLocation.id
            ),
          },
        };

  // Añadir condición de búsqueda
  const where = search
    ? {
        name: {
          contains: search,
          mode: "insensitive", // Para que sea insensible a mayúsculas/minúsculas
        },
      }
    : {};

  // Obtener productos paginados con filtro de búsqueda
  const products = await prisma.product.findMany({
    where: {
        name: {
          contains: search,
          mode: "insensitive", // Para que sea insensible a mayúsculas/minúsculas
        },
      },
    include: {
      warehouseStocks: {
        where: locationWhere,
        include: {
          location: true,
        },
      },
    },
    skip: offset,
    take: productsPerPage,
    orderBy: { id: "desc" },
  });

  const sorted = products.sort((a, b) => {
    const qtyA = a.warehouseStocks[0]?.quantity ?? 0;
    const qtyB = b.warehouseStocks[0]?.quantity ?? 0;
    return qtyB - qtyA; // descendente
  });

  // Contar total de productos que coinciden con la búsqueda
  const totalProducts = await prisma.product.count({
    where: {
        name: {
          contains: search,
          mode: "insensitive", // Para que sea insensible a mayúsculas/minúsculas
        },
      },
  });
  const totalPages = Math.ceil(totalProducts / productsPerPage);

  return NextResponse.json({ products: sorted, totalPages });
}

export const POST = withRole(async (req, token) => {
  try {
    const body = await req.json();
    const { name, purchasePrice, salePrice, imageName, isActive, notes } = body;
    const product = await prisma.product.create({
      data: {
        name,
        purchasePrice,
        salePrice,
        imageName,
        stock: 0,
        isActive,
        notes,
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
})
