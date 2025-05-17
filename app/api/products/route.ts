import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const productsPerPage = 5;
  const offset = (page - 1) * productsPerPage;

  // Obtener productos paginados
  const products = await prisma.product.findMany({
    skip: offset,
    take: productsPerPage,
    orderBy: { id: "desc" },
  });

  const totalProducts = await prisma.product.count();
  const totalPages = Math.ceil(totalProducts / productsPerPage);

  return NextResponse.json({ products, totalPages });
}