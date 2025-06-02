"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { Product } from "@/lib/models/products";
import { Session } from "next-auth";

interface AdjustmentModalProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
  onComplete: () => void; // Callback para refrescar o notificar al padre
}

export function AdjustmentModal({
  product,
  open,
  onOpenChange,
  session,
  onComplete,
}: AdjustmentModalProps) {
  // Estado para la razón y cantidad
  const [reason, setReason] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  // Estado para seleccionar la ubicación si es necesario
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");

  // Determinar la ubicación seleccionada:
  useEffect(() => {
    if (product.warehouseStocks) {
      const availableStocks = product.warehouseStocks.filter(stock => stock.quantity > 0);
      if (availableStocks.length === 1) {
        setSelectedLocationId(availableStocks[0].locationId);
      } else if (product.warehouseStocks.length === 1) {
        setSelectedLocationId(product.warehouseStocks[0].locationId);
      }
    }
  }, [product]);

  const handleAdjustment = async () => {
    if (!reason.trim()) {
      toast.error("Por favor ingresa la razón del ajuste");
      return;
    }
    if (quantity <= 0) {
      toast.error("La cantidad debe ser mayor que 0");
      return;
    }
    // Si hay más de una ubicación disponible, se requiere seleccionar una
    if (product.warehouseStocks && product.warehouseStocks.length > 1 && !selectedLocationId) {
      toast.error("Por favor selecciona una ubicación");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/adjustment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session?.user?.id,
          // Si existe más de un warehouseStocks, se usa la selección, de lo contrario se toma la única disponible
          locationId:
            product.warehouseStocks && product.warehouseStocks.length > 1
              ? selectedLocationId
              : product.warehouseStocks && product.warehouseStocks.length === 1
              ? product.warehouseStocks[0].locationId
              : null,
          productId: product.id,
          reason,
          quantity,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al registrar el ajuste");
      }

      toast.success("Ajuste registrado exitosamente");
      onOpenChange(false);
      onComplete();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al registrar el ajuste"
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setReason("");
    setQuantity(1);
    setSelectedLocationId("");
  };

  useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Ajuste - {product.name}</DialogTitle>
          <DialogDescription>
            Local:{" "}
            {selectedLocationId && product.warehouseStocks
              ? product.warehouseStocks.find(
                  (stock) => stock.locationId === selectedLocationId
                )?.location.name
              : product.warehouseStocks && product.warehouseStocks.length === 1
              ? product.warehouseStocks[0].location.name
              : ""}
          </DialogDescription>
          <DialogDescription>
            Ingresa la razón y la cantidad ajustada.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Select para Ubicación solo si hay más de una opción en warehouseStocks */}
          {product.warehouseStocks &&
            product.warehouseStocks.filter(stock => stock.quantity > 0).length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <select
                  id="location"
                  className="w-full p-2 border rounded"
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                >
                  <option value="" disabled>
                    Selecciona una ubicación
                  </option>
                  {product.warehouseStocks
                    .filter(stock => stock.quantity > 0)
                    .map(stock => (
                      <option key={stock.locationId} value={stock.locationId}>
                        {stock.location.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
          <div className="space-y-2">
            <Label htmlFor="reason">Razón</Label>
            <Input
              id="reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Merma, daño, expiración, etc."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Cantidad</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (value >= 1) {
                  setQuantity(value);
                }
              }}
              placeholder="Cantidad a ajustar"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleAdjustment} disabled={loading || !reason || quantity <= 0}>
            {loading ? "Registrando..." : "Registrar Ajuste"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}