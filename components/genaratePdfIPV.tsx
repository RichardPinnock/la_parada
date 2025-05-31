"use client";
import { generateIpvPdfDocument } from "@/lib/utils";
import React from "react";
import { toast } from "sonner";

const DescargarPdfButton = () => {
  const handleClick = () => {
    // hacer peticion al back
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
  };

  return (
    <button
      onClick={handleClick}
      className="px-4 py-2 m-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
    >
      Descargar IPV
    </button>
  );
};

export default DescargarPdfButton;
