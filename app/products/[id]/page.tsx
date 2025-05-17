"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CldImage } from "next-cloudinary";

interface Product {
  id: number;
  name: string;
  purchasePrice: number;
  salePrice: number;
  imageName: string;
  stock: number;
  isActive: boolean;
  notes?: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      const res = await fetch(`/api/products/${id}`);
      if (res.ok) {
        setProduct(await res.json());
      } else {
        setProduct(null);
      }
      setLoading(false);
    }
    if (id) fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-3 text-gray-600">Cargando producto...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">Producto no encontrado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <Card className="max-w-xl w-full">
        <CardHeader>
          <CardTitle className="text-3xl">{product.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <CldImage
              src={product.imageName}
              width={500}
              height={500}
              alt={product.name}
              className="object-contain rounded"
            />
            <div className="w-full space-y-2">
              <p>
                <span className="font-semibold">Precio de compra:</span> $
                {product.purchasePrice.toFixed(2)}
              </p>
              <p>
                <span className="font-semibold">Precio de venta:</span> $
                {product.salePrice.toFixed(2)}
              </p>
              <p>
                <span className="font-semibold">Stock:</span> {product.stock}
              </p>
              <p>
                <span className="font-semibold">Estado:</span>{" "}
                {product.isActive ? (
                  <span className="text-green-600 font-bold">Activo</span>
                ) : (
                  <span className="text-red-600 font-bold">Inactivo</span>
                )}
              </p>
              {product.notes && (
                <p>
                  <span className="font-semibold">Notas:</span> {product.notes}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
