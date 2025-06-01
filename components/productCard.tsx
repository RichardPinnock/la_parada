import { Product } from "@/lib/models/products";
import { StockLocation } from "@prisma/client";
import { ArrowRightLeft } from "lucide-react";
import { CldImage } from "next-cloudinary";
import { useState } from "react";
import { TransferStockModal } from "./TransferStockModal";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Session } from "next-auth";

interface ProductCardProps {
  product: Product;
  onSelect?: (producto: Product) => void;
  mode?: "pos" | "management";
  stockLocations: StockLocation[];
  session: Session | null;
}

export function ProductCard({
  product,
  onSelect,
  mode = "pos",
  stockLocations,
  session,
}: ProductCardProps) {
  const [showTransferModal, setShowTransferModal] = useState(false);

  const cardContent = (
    <Card className="h-full flex flex-col items-center p-4 cursor-pointer hover:shadow-lg transition-shadow">
      <div className="w-full h-48 flex items-center justify-center mb-4 bg-gray-50 rounded-md">
        <div className="relative w-36 h-36 flex items-center justify-center">
          <CldImage
            src={product.imageName}
            width={200}
            height={200}
            alt={product.name}
            className="object-contain rounded max-h-full max-w-full"
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </div>
      <CardContent className="flex flex-col items-center">
        <h2 className="text-lg font-semibold mb-2 line-clamp-1">
          {product.name}
        </h2>
        <p className="text-blue-600 font-bold text-xl">
          ${product.salePrice.toFixed(2)}
        </p>

        {/* Agregar validación para mostrar productos de acuerdo al stockLocation del usuario  */}
        {/* O hacer la validación desde el backend */}
        {product.isActive === false && (
          <p className="text-red-500 text-sm mt-1">Producto inactivo</p>
        )}
        {product.warehouseStocks.length === 0 ? (
          <span className="text-red-400 ml-2 text-xs text-center">
            No hay este producto en ningún local.
          </span>
        ) : (
          product.warehouseStocks.length > 0 && (
            <>
              {product.warehouseStocks.slice(0, 3).map((stock) => (
                <p
                  key={stock.id}
                  className="text-gray-500 text-sm mt-1 text-center"
                >
                  {stock.location.name}: {stock.quantity}
                </p>
              ))}
              {product.warehouseStocks.length > 3 && (
                <p className="text-gray-400 text-xs mt-1 text-center">
                  Más almacenes...
                </p>
              )}
            </>
          )
        )}

        {/* Botón de transferencia solo en modo management */}
        {mode === "management" && product.warehouseStocks.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowTransferModal(true);
            }}
          >
            <ArrowRightLeft className="w-4 h-4 mr-1" />
            Transferir
          </Button>
        )}

        {/* <p className="text-gray-600 text-sm">{product.warehouseStocks[0].quantity} en stock</p> */}
      </CardContent>

      <TransferStockModal
        product={product}
        stockLocations={stockLocations}
        open={showTransferModal}
        onOpenChange={setShowTransferModal}
        session={session}
      />
    </Card>
  );

  if (mode === "management") {
    return (
      <div>
        {/*    <Link href={`/products/${product.id}`} className="block h-full"></Link>{" "} */}

        {cardContent}
      </div>
    );
  }

  return (
    <div
      className="block h-full"
      tabIndex={0}
      role="button"
      onClick={() => onSelect?.(product)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect?.(product);
      }}
    >
      {cardContent}
    </div>
  );
}
