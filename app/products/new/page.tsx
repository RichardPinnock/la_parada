"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Upload, 
  Image as ImageIcon, 
  Package, 
  DollarSign, 
  FileText,
  Loader2,
  ArrowLeft,
  CheckCircle
} from "lucide-react";
import { useState, useRef } from "react";
import { createProduct } from "./actions";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";

export default function NewProduct() {
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

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
    if (formRef.current) {
      const fileInput = formRef.current.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(formRef.current!);
    const file = formData.get("image") as File;
    let imageUrl = "/fallback.jpg"; // Imagen por defecto

    // Solo subir a Cloudinary si hay un archivo seleccionado
    if (file && file.size > 0) {
      const cloudinaryData = new FormData();
      cloudinaryData.append("file", file);
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
        toast.error("No se pudo subir la imagen. Se usará la imagen por defecto.");
        // Continuar con la imagen por defecto
      }
    }

    // Remover el archivo y agregar la URL de la imagen
    formData.delete("image");
    formData.append("imageName", imageUrl);

    try {
      await createProduct(formData);
      toast.success("Producto creado exitosamente");

      // Resetear formulario
      formRef.current?.reset();
      setIsActive(true);
      clearImage();
    } catch (error) {
      console.error("Error creando producto:", error);
      toast.error("Error al crear el producto");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/products">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Crear Nuevo Producto</h1>
            <p className="text-muted-foreground">
              Agrega un nuevo producto a tu inventario
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario Principal */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Información del Producto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-base font-medium">
                        Nombre del Producto <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        id="name"
                        name="name"
                        required
                        placeholder="Ingresa el nombre del producto"
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="purchasePrice" className="text-base font-medium">
                          <DollarSign className="w-4 h-4 inline mr-1" />
                          Precio de Compra <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          id="purchasePrice"
                          name="purchasePrice"
                          required
                          placeholder="0.00"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="salePrice" className="text-base font-medium">
                          <DollarSign className="w-4 h-4 inline mr-1" />
                          Precio de Venta <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          id="salePrice"
                          name="salePrice"
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
                        name="notes"
                        rows={4}
                        placeholder="Descripción adicional, características especiales, etc."
                        className="mt-1"
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <Label htmlFor="isActive" className="text-base font-medium">
                          Estado del Producto
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {isActive ? "El producto estará disponible para venta" : "El producto estará oculto"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="isActive"
                          name="isActive"
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
          </div>

          {/* Panel de Imagen */}
          <div className="space-y-6">
            <Card>
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
                        ×
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <ImageIcon className="w-12 h-12 mb-2" />
                      <p className="text-sm text-center">
                        Sin imagen seleccionada
                      </p>
                      <p className="text-xs text-center text-muted-foreground mt-1">
                        Se usará imagen por defecto
                      </p>
                    </div>
                  )}
                </div>

                {/* Input de archivo */}
                <div>
                  <Label htmlFor="image" className="text-base font-medium">
                    Seleccionar Imagen
                  </Label>
                  <div className="mt-1">
                    <Input
                      type="file"
                      id="image"
                      name="image"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Formatos admitidos: JPG, PNG, GIF (máx. 10MB)
                  </p>
                </div>

                {/* Imagen por defecto preview */}
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 mb-2">
                    Imagen por defecto:
                  </p>
                  <div className="relative w-20 h-20 mx-auto">
                    <Image
                      src="/fallback.jpg"
                      alt="Imagen por defecto"
                      fill
                      className="object-contain rounded border"
                    />
                  </div>
                  <p className="text-xs text-blue-600 text-center mt-1">
                    Se usará si no seleccionas una imagen
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Botón de crear */}
            <Card>
              <CardContent className="pt-6">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                  onClick={() => formRef.current?.requestSubmit()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creando producto...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Crear Producto
                    </>
                  )}
                </Button>
                
                {!loading && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    * Campos obligatorios
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}