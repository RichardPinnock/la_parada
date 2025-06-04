import { Product } from "@/lib/models/products";
import { StockLocation } from "@prisma/client";
import { ArrowRightLeft, Edit } from "lucide-react"; // Añadido el icono Edit
import { CldImage } from "next-cloudinary";
import { useState } from "react";
import { TransferStockModal } from "./TransferStockModal";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Session } from "next-auth";
import { AdjustmentModal } from "./registerAdjustment";
import { EditProductModal } from "./EditProductModal";

interface ProductCardProps {
  product: Product;
  onSelect?: (producto: Product) => void;
  mode?: "pos" | "management";
  stockLocations: StockLocation[];
  session: Session | null;
  refresh: () => void; // Callback para refrescar datos o notificar al padre
}

export function ProductCard({
  product,
  onSelect,
  mode = "pos",
  stockLocations,
  session,
  refresh,
}: ProductCardProps) {
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); // Nuevo estado para el modal de edición
  const user = session?.user || null;

  const cardContent = (
    <Card className="h-full flex flex-col items-center p-4 cursor-pointer hover:shadow-lg transition-shadow">
      {/* Icono de edición en la parte superior derecha (solo en modo management) */}

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
        {user && (
          <>
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
          </>
        )}

        {mode === "management" && (
          <div className="flex flex-col gap-2 mt-2 w-full">
            {/* Botón de editar */}
            <Button
              variant="outline"
              size="sm"
              className="flex items-center justify-center gap-1"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowEditModal(true);
              }}
            >
              <Edit className="w-4 h-4" />
              Editar
            </Button>
          </div>
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

        {user &&
          product.warehouseStocks.length > 0 &&
          product.warehouseStocks.reduce(
            (sum, stock) => sum + stock.quantity,
            0
          ) > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowAdjustmentModal(true);
              }}
            >
              Registrar Ajuste
            </Button>
          )}
      </CardContent>

      {/* Modales */}
      <TransferStockModal
        product={product}
        stockLocations={stockLocations}
        open={showTransferModal}
        onOpenChange={setShowTransferModal}
        session={session}
        onTransferComplete={refresh}
      />

      <AdjustmentModal
        product={product}
        open={showAdjustmentModal}
        onOpenChange={setShowAdjustmentModal}
        session={session}
        onComplete={refresh}
      />

      {/* modal de edición */}
      <EditProductModal
        product={product}
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onUpdate={refresh}
      />
    </Card>
  );

  if (mode === "management") {
    return <div>{cardContent}</div>;
  }

  return (
    <div
      className="block h-full"
      tabIndex={0}
      role="button"
      onClick={(e) => {
        if (!showTransferModal && !showAdjustmentModal && !showEditModal) {
          onSelect?.(product);
        }
      }}
      onKeyDown={(e) => {
        if (!showTransferModal && !showAdjustmentModal && !showEditModal) {
          if (e.key === "Enter" || e.key === " ") onSelect?.(product);
        }
      }}
    >
      {cardContent}
    </div>
  );
}
