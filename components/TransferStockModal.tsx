import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Product } from "@/lib/models/products";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface StockLocation {
  id: string;
  name: string;
}

interface TransferStockModalProps {
  product: Product;
  stockLocations: StockLocation[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransferStockModal({
  product,
  stockLocations,
  open,
  onOpenChange,
}: TransferStockModalProps) {
  const { data: session } = useSession();
  const [fromLocationId, setFromLocationId] = useState<string>("");
  const [toLocationId, setToLocationId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  // Filtrar localizaciones de destino (todas excepto la seleccionada como origen)
  const availableToLocations = stockLocations.filter(
    (location) => location.id !== fromLocationId
  );

  // Limpiar campos dependientes cuando cambia la localización origen
  useEffect(() => {
    setToLocationId("");
  }, [fromLocationId]);

  const handleTransfer = async () => {
    // Validaciones básicas del frontend
    if (!fromLocationId) {
      toast.error("Por favor selecciona la localización origen");
      return;
    }

    if (!toLocationId) {
      toast.error("Por favor selecciona la localización destino");
      return;
    }

    if (quantity <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/transfer-location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          fromLocationId,
          toLocationId,
          quantity,
          userId: session?.user?.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Error al realizar la transferencia"
        );
      }

      toast.success("Transferencia realizada exitosamente");
      onOpenChange(false);

      // Aquí puedes agregar lógica para refrescar los datos del producto
      // o emitir un evento para que el componente padre actualice los datos
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al realizar la transferencia"
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFromLocationId("");
    setToLocationId("");
    setQuantity(1);
  };

  // Resetear formulario cuando se abre/cierra el modal
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transferir Stock</DialogTitle>
          <DialogDescription>
            Transfiere stock de {product.name} entre localizaciones
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Localización origen */}
          <div className="space-y-2">
            <Label htmlFor="from-location">Desde</Label>
            <Select value={fromLocationId} onValueChange={setFromLocationId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona localización origen" />
              </SelectTrigger>
              <SelectContent>
                {stockLocations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Localización destino */}
          <div className="space-y-2">
            <Label htmlFor="to-location">Hacia</Label>
            <Select
              value={toLocationId}
              onValueChange={setToLocationId}
              disabled={!fromLocationId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona localización destino" />
              </SelectTrigger>
              <SelectContent>
                {availableToLocations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!fromLocationId && (
              <p className="text-sm text-gray-500">
                Primero selecciona la localización origen
              </p>
            )}
          </div>

          {/* Cantidad */}
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
              placeholder="Ingresa la cantidad a transferir"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={
              loading || !fromLocationId || !toLocationId || quantity <= 0
            }
          >
            {loading ? "Transfiriendo..." : "Transferir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
