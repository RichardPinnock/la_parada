import { useState } from "react";
import { Product } from "@/lib/models/products";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { toast } from "sonner";

interface EditProductModalProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void; // Para refrescar la lista después de actualizar
}

export function EditProductModal({
  product,
  open,
  onOpenChange,
  onUpdate,
}: EditProductModalProps) {
  const [name, setName] = useState(product.name);
  const [purchasePrice, setPurchasePrice] = useState(product.purchasePrice);
  const [salePrice, setSalePrice] = useState(product.salePrice);
  const [isActive, setIsActive] = useState(product.isActive);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-internal-access": process.env.NEXT_PUBLIC_INTERNAL_API_SECRET ?? "",
        },
        body: JSON.stringify({
          name,
          purchasePrice,
          salePrice,
          isActive,
        }),
      });

      if (!response.ok) {
        // toast.error('Ocurrió un error al actualizar el producto. Por favor, inténtalo de nuevo.');
        throw new Error("Error al actualizar el producto");
      }

      toast.success("El producto ha sido actualizado correctamente");
      onUpdate(); // Refrescar la lista de productos
      onOpenChange(false); // Cerrar el modal
    } catch (error) {
      console.log("Error al actualizar:", error);
      if(error instanceof Error) {
        toast.error(error.message);
      }
      toast.error(`Ocurrió un error al actualizar el producto. Por favor, inténtalo de nuevo.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Producto</DialogTitle>
          <DialogDescription>
            Actualiza los datos del producto. Haz clic en guardar cuando
            termines.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled
            />
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="purchasePrice">Precio de compra</Label>
            <Input
              id="purchasePrice"
              type="number"
              min="0"
              step="0.01"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(parseFloat(e.target.value))}
              required
            />
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="salePrice">Precio de venta</Label>
            <Input
              id="salePrice"
              type="number"
              min="0"
              step="0.01"
              value={salePrice}
              onChange={(e) => setSalePrice(parseFloat(e.target.value))}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked as boolean)}
            />
            <Label htmlFor="isActive">Producto activo</Label>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}