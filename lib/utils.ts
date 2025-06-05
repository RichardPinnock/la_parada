import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

type IpvRow = {
  nombre: string;
  PC: number;
  PV: number;
  I: number;
  E: number;
  M: number;
  R: number;
  V: number;
  T: number;
  G: number;
};

export function generarIpvPdfComplete(
  ipvData: IpvRow[],
  authors: string[],
  fecha?: string
) {
  const doc = new jsPDF();

  const fechaActual = fecha ? new Date(fecha) : new Date();
  const fechaTexto = fechaActual.toLocaleDateString();
  const fechaTextoLargo = fechaActual.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Título
  doc.setFontSize(16);
  doc.text("La Parada - IPV " + fechaTextoLargo, 14, 20);
  // Autores
  const authorTitle = authors.length > 1 ? "Autores" : "Autor";
  doc.setFontSize(12);
  doc.text(authorTitle, 14, 30);
  authors.forEach((author, i) => {
    doc.text(`- ${author}`, 20, 36 + i * 6);
  });

  // Tabla
  const headers = [["Producto", "PC", "PV", "I", "E", "M", "R", "V", "T", "G"]];
  const rows = ipvData.map((item) => [
    item.nombre,
    item.PC.toFixed(2),
    item.PV.toFixed(2),
    item.I,
    item.E,
    item.M,
    item.R,
    item.V,
    item.T.toFixed(2),
    item.G.toFixed(2),
  ]);

  autoTable(doc, {
    startY: 40 + authors.length * 6,
    head: headers,
    body: rows,
  });

  const finalY = (doc as any).lastAutoTable?.finalY ?? 40 + authors.length * 6;

  const total = ipvData.reduce((sum, row) => sum + row.T, 0);
  doc.text(`Total: $${total.toFixed(2)}`, 14, finalY + 10);

  doc.text(`Fecha: ${fechaTexto}`, 14, finalY + 20);
  doc.text(
    "Firma del dependiente que entrega: ______________________",
    14,
    finalY + 30
  );
  doc.text(
    "Firma del dependiente que recibe: _______________________",
    14,
    finalY + 40
  );

  // Guardar PDF (opcional)
  doc.save(`IPV-${fechaTexto}.pdf`);
}

export function generateIpvPdfDocument(
  ipvData: IpvRow[],
  authors: string[],
  fecha?: string,
  localName: string = "La Parada"
) {
  const doc = new jsPDF();

  const fechaActual = fecha ? new Date(fecha) : new Date();
  const fechaTexto = fechaActual.toLocaleDateString();
  const fechaTextoLargo = fechaActual.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Título
  doc.setFontSize(16);
  doc.text(localName +  " - IPV " + fechaTextoLargo, 14, 20);
  // Autores
  const authorTitle = authors.length > 1 ? "Autores" : "Autor";
  doc.setFontSize(12);
  doc.text(authorTitle, 14, 30);
  authors.forEach((author, i) => {
    doc.text(`- ${author}`, 20, 36 + i * 6);
  });

  // Tabla
  const headers = [
    [
      "Productos",
      // "PC",
      "Precio",
      "Existencia Inicial",
      "Entrada",
      "Salida",
      "Venta",
      "Existencia final",
      "Importe",
      // "G"
    ],
  ];
  const rows = ipvData.map((item) => [
    item.nombre,
    // item.PC.toFixed(2),
    item.PV.toFixed(2),
    item.I,
    item.E,
    item.M,
    item.V,
    item.R,
    item.T.toFixed(2),
    // item.G.toFixed(2),
  ]);

  autoTable(doc, {
    startY: 40 + authors.length * 6,
    head: headers,
    body: rows,
    theme: "grid",
    columnStyles: {
      0: { cellWidth: "auto" }, // Nombre del producto
      1: { cellWidth: 17, halign: "center" }, // Precio
      2: { cellWidth: 22, halign: "center" }, // Existencia Inicial
      3: { cellWidth: 17, halign: "center" }, // Entrada
      4: { cellWidth: 16, halign: "center" }, // Salida
      5: { cellWidth: 16, halign: "center" }, // Venta
      6: { cellWidth: 22, halign: "center" }, // Existencia final
      7: { cellWidth: 20, halign: "center" }, // Importe
    },
    styles: {
      fillColor: [245, 245, 245], // Color de fondo de celdas (en RGB)
    },
    headStyles: {
      fillColor:  [91, 163, 211], // Color de fondo de encabezado
      textColor: 20,
      fontStyle: "bold",
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY ?? 40 + authors.length * 6;

  const total = ipvData.reduce((sum, row) => sum + row.T, 0);
  doc.text(`Total: $${total.toFixed(2)}`, 14, finalY + 10);

  doc.text(`Fecha: ${fechaTexto}`, 14, finalY + 20);
  doc.text(
    "Firma del dependiente que entrega: ______________________",
    14,
    finalY + 30
  );
  doc.text(
    "Firma del dependiente que recibe: _______________________",
    14,
    finalY + 40
  );

  // Guardar PDF (opcional)
  doc.save(`IPV-${fechaTexto}.pdf`);
}
