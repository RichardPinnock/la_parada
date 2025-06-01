"use client";
import { generateIpvPdfDocument } from "@/lib/utils";
import React from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Download } from "lucide-react";

interface PdfData {
  products: any;
  shiftAuthors: any;
  date: string;
  total: {
    totalCashAmount: number;
    totalTransferAmount: number;
  }
}

interface DescargarPdfButtonProps {
  data?: PdfData;
}

const DescargarPdfButton : React.FC<DescargarPdfButtonProps> = ({ data }) => {
  const handleClick = () => {

    if(!data) {
      // hacer petición al back
    fetch("/api/ipv")
      .then((response) => {
        if (!response.ok) {
          toast.error("Error al descargar el IPV");
          throw new Error("Error al obtener los datos del IPV");
        }
        return response.json();
      })
      .then((data) => {
        const { products, shiftAuthors, date } = data;
        toast.success("IPV descargado correctamente");
        // Generar el PDF con los datos obtenidos
        generateIpvPdfDocument(products, shiftAuthors, date);
      })
      .catch((error) => {
        toast.error("Error al descargar el IPV");
        console.error("Error al descargar el IPV:", error);
      });
    } else {
      // Si ya tenemos los datos, generamos el PDF directamente
      const { products, shiftAuthors, date } = data;
      generateIpvPdfDocument(products, shiftAuthors, date);
      toast.success("IPV descargado correctamente");
    }
  };

  return (
    <Button
    onClick={handleClick}
    >
      <Download className="w-4 h-4 mr-2" />
      Descargar PDF
    </Button>
  );
};

export default DescargarPdfButton;
