"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Package,
  Plus,
  Search,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";

import { ProductCard } from "@/components/productCard";
import { Product } from "@/lib/models/products";
import { useAllStockLocations } from "@/hooks/useStockLocations";
import ProductImportForm from "@/components/productImport";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Componente separado para manejar useSearchParams
function ProductsContent() {
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1");
  const { stockLocations, error } = useAllStockLocations();
  const { data: session } = useSession();

  const [products, setProducts] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function fetchProducts() {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/products?page=${page}&search=${encodeURIComponent(search)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-internal-access":
              process.env.NEXT_PUBLIC_INTERNAL_API_SECRET ?? "",
          },
        }
      );
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
  }, [page, search]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gestión de Productos
            </h1>
            <p className="text-gray-600 mt-1">
              Administra tu inventario y productos
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link href="/products/new">
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Producto
              </Button>
            </Link>
            <ProductImportForm onImportSuccess={fetchProducts} />
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar productos por nombre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  <Package className="w-3 h-3 mr-1" />
                  {products.length} producto{products.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <p className="text-gray-600">Cargando productos...</p>
              </div>
            </CardContent>
          </Card>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-gray-100 p-3 mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No hay productos</h3>
              <p className="text-gray-600 text-center mb-6">
                {search
                  ? "No se encontraron productos con ese criterio de búsqueda"
                  : "Comienza creando tu primer producto"}
              </p>
              {!search && (
                <Link href="/products/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Producto
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  mode="management"
                  stockLocations={stockLocations || []}
                  session={session}
                  refresh={fetchProducts}
                />
              ))}
            </div>

            {/* Pagination mejorada */}
            {totalPages > 1 && (
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        Página {page} de {totalPages}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/products?page=${page - 1}${
                          search ? `&search=${encodeURIComponent(search)}` : ""
                        }`}
                        className={page <= 1 ? "pointer-events-none" : ""}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page <= 1}
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          Anterior
                        </Button>
                      </Link>

                      <Link
                        href={`/products?page=${page + 1}${
                          search ? `&search=${encodeURIComponent(search)}` : ""
                        }`}
                        className={
                          page >= totalPages ? "pointer-events-none" : ""
                        }
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page >= totalPages}
                        >
                          Siguiente
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Componente principal que envuelve todo en Suspense
export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-xl text-gray-600">Cargando página...</p>
          </div>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
