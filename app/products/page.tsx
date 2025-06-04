"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { CldImage } from "next-cloudinary";
import Link from "next/link";
import { ProductCard } from "@/components/productCard";
import { Product } from "@/lib/models/products";
import { useAllStockLocations } from "@/hooks/useStockLocations";
import { useSession } from "next-auth/react";

export const dynamic = "force-dynamic";

function ProductsList() {
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1");
  const { stockLocations, error } = useAllStockLocations();
  const { data: session } = useSession();

  const [products, setProducts] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  async function fetchProducts() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/products?page=${page}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-internal-access":
            process.env.NEXT_PUBLIC_INTERNAL_API_SECRET ?? "",
        },
      });
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data.products);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, [page]);

  return (
    <>
      {isLoading ? (
        <div className="flex items-center justify-center space-x-2 min-h-[200px]">
          <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      ) : (
        <>
          {products.length === 0 ? (
            <p className="text-gray-600">No hay productos disponibles.</p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 w-full container mx-auto">
              {products.map((product) => (
                <li key={product.id}>
                  <ProductCard
                    product={product}
                    mode="management"
                    stockLocations={stockLocations || []}
                    session={session}
                    refresh={fetchProducts} // Callback para refrescar datos
                  />
                </li>
              ))}
            </ul>
          )}

          {/* Pagination Controls */}
          <div className="flex justify-center space-x-4 mt-8">
            {page > 1 && (
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() =>
                  (window.location.href = `/products?page=${page - 1}`)
                }
              >
                Anterior
              </button>
            )}
            {page < totalPages && (
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() =>
                  (window.location.href = `/products?page=${page + 1}`)
                }
              >
                Siguiente
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
}

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start p-8">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="ml-3 text-gray-600">Cargando página...</p>
          </div>
        }
      >
        <ProductsList />
      </Suspense>
    </div>
  );
}
