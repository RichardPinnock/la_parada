"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

type Product = {
  name: string;
  purchasePrice: number;
  sellPrice: number;
};

interface ProductImportFormProps {
  onImportSuccess: () => void; // Función para refrescar datos en el componente padre
}

export default function ProductImportForm({ onImportSuccess }: ProductImportFormProps) {
  // Estados para el archivo, los productos y el estado del upload
  const [file, setFile] = useState<File | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [openPreview, setOpenPreview] = useState(false);
  // Estados: "initial" = sin archivo, "selected" = archivo subido y listo para leer, "preview" = previsualizando
  const [uploadStep, setUploadStep] = useState<
    "initial" | "selected" | "preview"
  >("initial");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Manejador para el input file (oculto)
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setUploadStep("selected");
    }
  };

  // Función para disparar el click del input hidden
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Leer y parsear el archivo usando XLSX
  const parseFile = async () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const parsed = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
      }) as string[][];

      const extracted = parsed
        .slice(1)
        .map((row) => ({
          name: row[0]?.toString().trim() ?? "",
          purchasePrice: Number(row[1]) || 0,
          sellPrice: Number(row[2]) || 0,
        }))
        .filter((p) => p.name);

      setProducts(extracted);
      setOpenPreview(true);
      setUploadStep("preview");
    };

    reader.readAsArrayBuffer(file);
  };

  // Función para descartar el archivo y reiniciar estados
  const discardFile = () => {
    setFile(null);
    setProducts([]);
    setOpenPreview(false);
    setUploadStep("initial");
  };

  // Función para enviar la importación
  const handleImport = async () => {
    setIsImporting(true);
    try {
      const res = await fetch("/api/import/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-access": process.env.NEXT_PUBLIC_INTERNAL_API_SECRET ?? "",
        },
        body: JSON.stringify(products),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`${data.count || products.length} productos importados exitosamente`);
        discardFile();
        onImportSuccess(); // Llamamos a la función del padre para refrescar
      } else {
        // Si hay errores como productos duplicados
        const errorData = await res.json();
        if (errorData.duplicates) {
          toast.error(
            `No se pudieron importar productos duplicados: ${errorData.duplicates}`
          );
        } else {
          toast.error("Error al importar productos");
        }
      }
    } catch (error) {
      console.error("Error importing products:", error);
      toast.error("Error al importar productos");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="p-4 border rounded space-y-4 max-w-xl">
      {/* Input file oculto */}
      <input
        ref={fileInputRef}
        hidden
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFile}
      />

      {/* Botones según el estado */}
      {uploadStep === "initial" && (
        <Button onClick={triggerFileInput}>Subir Archivo</Button>
      )}

      {uploadStep === "selected" && (
        <div className="flex gap-2">
          <Button onClick={parseFile}>Leer Archivo</Button>
          <Button variant="outline" onClick={discardFile}>
            Descartar Archivo
          </Button>
        </div>
      )}

      {/* Diálogo de previsualización */}
      <Dialog
        open={openPreview}
        onOpenChange={(open) => {
          setOpenPreview(open);
          if (!open) setUploadStep("selected");
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Previsualización de productos</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[60vh] border rounded">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Precio de compra</TableHead>
                  <TableHead>Precio de venta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>${p.purchasePrice.toFixed(2)}</TableCell>
                    <TableCell>${p.sellPrice.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-start">
            <p className="text-sm text-gray-500 mt-2">
              Total de productos: {products.length}
            </p>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={discardFile} disabled={isImporting}>
              Descartar Archivo
            </Button>
            <Button onClick={handleImport} disabled={isImporting}>
              {isImporting ? "Importando..." : "Importar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}