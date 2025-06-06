"use client";

import { useState, useRef, useEffect } from "react";
import { Product } from "@/lib/models/products";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  ImageIcon,
  Package,
  DollarSign,
  FileText,
  Loader2,
  CheckCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { CldImage } from "next-cloudinary";

interface EditProductModalProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
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
  const [notes, setNotes] = useState(product.notes || "");
  const [isActive, setIsActive] = useState(product.isActive);
  const [isLoading, setIsLoading] = useState(false);

  // Estados para manejo de imagen
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(product.imageName);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset states cuando cambia el producto o se abre/cierra el modal
  useEffect(() => {
    if (open) {
      setName(product.name);
      setPurchasePrice(product.purchasePrice);
      setSalePrice(product.salePrice);
      setNotes(product.notes || "");
      setIsActive(product.isActive);
      setCurrentImageUrl(product.imageName);
      setImagePreview(null);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open, product]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setImagePreview(null);
    }
  };

  const clearImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetToDefault = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setCurrentImageUrl("/fallback.jpg");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    let imageUrl = currentImageUrl; // Mantener la imagen actual por defecto

    // Solo subir a Cloudinary si hay un archivo seleccionado
    if (selectedFile) {
      const cloudinaryData = new FormData();
      cloudinaryData.append("file", selectedFile);
      cloudinaryData.append("upload_preset", "parada");

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

      try {
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: "POST",
            body: cloudinaryData,
          }
        );

        if (!res.ok) {
          const errorText = await res.text();
          console.error("Error response:", errorText);
          throw new Error(`Error ${res.status}: ${errorText}`);
        }

        const data = await res.json();

        if (!data.secure_url) {
          throw new Error("No se recibió URL de la imagen");
        }

        imageUrl = data.secure_url;
      } catch (error) {
        console.error("Error subiendo imagen a Cloudinary:", error);
        toast.error(
          "No se pudo subir la nueva imagen. Se mantendrá la actual."
        );
        // Continuar con la imagen actual
      }
    }

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-internal-access":
            process.env.NEXT_PUBLIC_INTERNAL_API_SECRET ?? "",
        },
        body: JSON.stringify({
          name,
          purchasePrice,
          salePrice,
          notes,
          isActive,
          imageName: imageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar el producto");
      }

      toast.success("El producto ha sido actualizado correctamente");
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error("Error al actualizar:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(
          "Ocurrió un error al actualizar el producto. Por favor, inténtalo de nuevo."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Determinar qué imagen mostrar en el preview
  const isCurrentImageLocal = currentImageUrl.startsWith("/");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Editar Producto: {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Información del Producto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-base font-medium">
                        Nombre del Producto{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="Ingresa el nombre del producto"
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label
                          htmlFor="purchasePrice"
                          className="text-base font-medium"
                        >
                          <DollarSign className="w-4 h-4 inline mr-1" />
                          Precio de Compra{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          id="purchasePrice"
                          value={purchasePrice}
                          onChange={(e) =>
                            setPurchasePrice(parseFloat(e.target.value) || 0)
                          }
                          onFocus={(e) => {
                            if (e.target.value === "0") {
                              e.target.select();
                            }
                          }}
                          required
                          placeholder="0.00"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="salePrice"
                          className="text-base font-medium"
                        >
                          <DollarSign className="w-4 h-4 inline mr-1" />
                          Precio de Venta{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          id="salePrice"
                          value={salePrice}
                          onChange={(e) =>
                            setSalePrice(parseFloat(e.target.value) || 0)
                          }
                          onFocus={(e) => {
                            if (e.target.value === "0") {
                              e.target.select();
                            }
                          }}
                          required
                          placeholder="0.00"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes" className="text-base font-medium">
                        <FileText className="w-4 h-4 inline mr-1" />
                        Notas (Opcional)
                      </Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        placeholder="Descripción adicional, características especiales, etc."
                        className="mt-1"
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <Label
                          htmlFor="isActive"
                          className="text-base font-medium"
                        >
                          Estado del Producto
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {isActive
                            ? "El producto estará disponible para venta"
                            : "El producto estará oculto"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="isActive"
                          checked={isActive}
                          onCheckedChange={setIsActive}
                        />
                        <Badge variant={isActive ? "default" : "secondary"}>
                          {isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="md:block hidden">
              <CardContent className="pt-6 space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  onClick={handleSubmit}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Guardar cambios
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>

                {!isLoading && (
                  <p className="text-xs text-muted-foreground text-center">
                    * Campos obligatorios
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 md:h-full">
            <Card className="md:h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Imagen del Producto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Preview de la imagen */}
                <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                  {imagePreview ? (
                    // Nueva imagen seleccionada
                    <div className="relative w-full h-full">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-contain p-2"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={clearImage}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    // Imagen actual
                    <div className="relative w-full h-full">
                      {isCurrentImageLocal ? (
                        <Image
                          src={currentImageUrl}
                          alt="Imagen actual"
                          fill
                          className="object-contain p-2"
                        />
                      ) : (
                        <CldImage
                          src={currentImageUrl}
                          width={300}
                          height={300}
                          alt="Imagen actual"
                          className="object-contain w-full h-full p-2"
                        />
                      )}
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="text-xs">
                          Imagen actual
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input de archivo */}
                <div>
                  <Label htmlFor="image" className="text-base font-medium">
                    Cambiar Imagen
                  </Label>
                  <div className="mt-1">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      id="image"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Formatos admitidos: JPG, PNG, GIF (máx. 10MB)
                  </p>
                </div>

                {/* Botones de acción para imagen */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetToDefault}
                    className="flex-1"
                  >
                    Usar por defecto
                  </Button>
                  {selectedFile && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearImage}
                      className="flex-1"
                    >
                      Cancelar cambio
                    </Button>
                  )}
                </div>

                {/* Imagen por defecto preview */}
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 mb-2">
                    Imagen por defecto:
                  </p>
                  <div className="relative w-16 h-16 mx-auto">
                    <Image
                      src="/fallback.jpg"
                      alt="Imagen por defecto"
                      fill
                      className="object-contain rounded border"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="block md:hidden">
              <CardContent className="pt-6 space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  onClick={handleSubmit}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Guardar cambios
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>

                {!isLoading && (
                  <p className="text-xs text-muted-foreground text-center">
                    * Campos obligatorios
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
