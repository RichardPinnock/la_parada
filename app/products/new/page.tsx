"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useRef } from "react";
import { createProduct } from "./actions";
import { toast } from "sonner";

export default function NewProduct() {
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(formRef.current!);
    const file = formData.get("image") as File;

    // Subir imagen a Cloudinary
    const cloudinaryData = new FormData();
    cloudinaryData.append("file", file);
    cloudinaryData.append("upload_preset", "parada");

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    let data;
    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: cloudinaryData,
        }
      );
      data = await res.json();
      if (!res.ok || !data.secure_url) {
        throw new Error(data.error?.message || "Error subiendo la imagen");
      }
    } catch (error) {
      console.error("Error subiendo imagen a Cloudinary:", error);
      toast.error("No se pudo subir la imagen. Intenta nuevamente.");
      setLoading(false);
      return;
    }

    // Reemplazar el archivo por la URL de Cloudinary
    formData.delete("image");
    formData.append("imageName", data.secure_url);

    // Llamar a la acción del servidor
    await createProduct(formData);

    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Crear nuevo producto</CardTitle>
        </CardHeader>
        <CardContent>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input
                type="text"
                id="name"
                name="name"
                required
                placeholder="Nombre del producto"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="purchasePrice">Precio de compra</Label>
                <Input
                  type="number"
                  step="0.01"
                  id="purchasePrice"
                  name="purchasePrice"
                  required
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="salePrice">Precio de venta</Label>
                <Input
                  type="number"
                  step="0.01"
                  id="salePrice"
                  name="salePrice"
                  required
                  placeholder="0.00"
                />
              </div>
              {/* 
              <div>
                <Label htmlFor="stock">Stock</Label>
                <Input
                  type="number"
                  id="stock"
                  name="stock"
                  required
                  placeholder="Cantidad en stock"
                />
              </div> 
              */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  name="isActive"
                  checked={isActive}
                  onCheckedChange={(checked) => setIsActive(!!checked)}
                />
                <Label htmlFor="isActive" className="text-lg font-medium">
                  Activo
                </Label>
              </div>
            </div>

            <div>
              <Label htmlFor="image">Imagen</Label>
              <Input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                required
              />
            </div>

            <div>
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Notas del producto"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creando..." : "Crear producto"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
