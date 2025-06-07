import { Product } from "@/lib/models/products";
import { cn, getSalePrice } from "@/lib/utils";
import { StockLocation } from "@prisma/client";
import {
  AlertCircle,
  ArrowRightLeft,
  CheckCircle,
  DollarSign,
  Edit,
  MapPin,
  MoreVertical,
  Package,
  Settings,
} from "lucide-react";
import { Session } from "next-auth";
import { CldImage } from "next-cloudinary";
import Image from "next/image";
import { useState } from "react";
import { EditProductModal } from "./EditProductModal";
import { AdjustmentModal } from "./registerAdjustment";
import { TransferStockModal } from "./TransferStockModal";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface ProductCardProps {
  product: Product;
  onSelect?: (producto: Product) => void;
  mode?: "pos" | "management";
  stockLocations: StockLocation[];
  session: Session | null;
  refresh: () => void;
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const user = session?.user || null;
  const totalStock = product.warehouseStocks.reduce(
    (sum, stock) => sum + stock.quantity,
    0
  );
  const hasStock = totalStock > 0;
  const isOutOfStock = totalStock === 0;

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  const handleCardClick = () => {
    if (mode === "pos" && hasStock && product.isActive) {
      onSelect?.(product);
    }
  };

  return (
    <>
      <Card
        className={cn(
          "group relative h-full flex flex-col transition-all duration-200 hover:shadow-lg",
          mode === "pos" &&
            hasStock &&
            product.isActive &&
            "cursor-pointer hover:scale-[1.02]",
          !product.isActive && "opacity-60",
          isOutOfStock && "border-red-200",
          mode === "pos" && !hasStock && "cursor-not-allowed"
        )}
        onClick={handleCardClick}
      >
        <CardContent className="flex-1 flex flex-col pt-3">
          <div className="relative w-full h-40 mb-2 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden">
            {product.imageName.startsWith("/") ? (
              // Imagen local (fallback.jpg)
              <Image
                src={product.imageName}
                width={200}
                height={200}
                alt={product.name}
                className="object-contain w-full h-full p-2 transition-transform duration-200 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              // Imagen de Cloudinary
              <CldImage
                src={product.imageName}
                width={200}
                height={200}
                alt={product.name}
                className="object-contain w-full h-full p-2 transition-transform duration-200 group-hover:scale-105"
                loading="lazy"
              />
            )}

            <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
              <Badge
                className={cn(
                  "w-fit text-xs shadow-sm backdrop-blur-sm hover:bg-opacity-90",
                  product.isActive
                    ? "bg-green-100/90 text-green-800 border-green-200"
                    : "bg-gray-100/90 text-gray-600 border-gray-200"
                )}
              >
                {product.isActive ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : (
                  <AlertCircle className="w-3 h-3 mr-1" />
                )}
                {product.isActive ? "Activo" : "Inactivo"}
              </Badge>

              {user && (
                <Badge
                  variant={hasStock ? "outline" : "destructive"}
                  className="w-fit text-xs shadow-sm backdrop-blur-sm bg-white/90"
                >
                  <Package className="w-3 h-3 mr-1" />
                  Stock: {totalStock}
                </Badge>
              )}
            </div>

            <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 "
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Abrir menú</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[220px]">
                  {mode === "management" && user?.role === "admin" && (
                    <DropdownMenuItem
                      onClick={(e) =>
                        handleAction(e, () => setShowEditModal(true))
                      }
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar producto
                    </DropdownMenuItem>
                  )}
                  {hasStock && (
                    <>
                      {user?.role === "admin" && (
                        <DropdownMenuItem
                          onClick={(e) =>
                            handleAction(e, () => setShowTransferModal(true))
                          }
                        >
                          <ArrowRightLeft className="mr-2 h-4 w-4" />
                          Transferir stock
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={(e) =>
                          handleAction(e, () => setShowAdjustmentModal(true))
                        }
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Ajustar inventario
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {!product.isActive && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Inactivo
                </Badge>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col">
            <h3 className="font-semibold text-md mb-1 line-clamp-1 text-center">
              {product.name}
            </h3>

            <div className="flex items-center justify-center mb-2">
              <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <span className="text-xl font-bold text-blue-700">
                  {getSalePrice(product).toFixed(2)}
                </span>
              </div>
            </div>

            {user && (
              <div className="space-y-2 mt-auto">
                {product.warehouseStocks.length === 0 ? (
                  <div className="flex items-center justify-center p-2 bg-red-50 rounded-md">
                    <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
                    <span className="text-red-600 text-xs">
                      Sin stock en locales
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {product.warehouseStocks.slice(0, 3).map((stock) => (
                      <div
                        key={stock.id}
                        className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded-md"
                      >
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-500" />
                          <span className="font-medium">
                            {stock.location.name}
                          </span>
                        </div>
                        <Badge
                          variant={
                            stock.quantity > 0 ? "outline" : "destructive"
                          }
                          className="text-xs"
                        >
                          {stock.quantity}
                        </Badge>
                      </div>
                    ))}
                    {product.warehouseStocks.length > 3 && (
                      <div className="text-center">
                        <Badge variant="outline" className="text-xs">
                          +{product.warehouseStocks.length - 3} ubicaciones más
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {mode === "pos" && (
              <div className="mt-4 space-y-2">
                {!hasStock && (
                  <Button variant="outline" disabled className="w-full">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Sin stock
                  </Button>
                )}
                {!product.isActive && (
                  <Button variant="outline" disabled className="w-full">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Producto inactivo
                  </Button>
                )}
              </div>
            )}

            {mode === "management" && (
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => handleAction(e, () => setShowEditModal(true))}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                {hasStock && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) =>
                      handleAction(e, () => setShowAdjustmentModal(true))
                    }
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>

        {mode === "pos" && hasStock && product.isActive && (
          <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg pointer-events-none" />
        )}
      </Card>

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

      <EditProductModal
        product={product}
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onUpdate={refresh}
        stockLocations={stockLocations}
      />
    </>
  );
}
