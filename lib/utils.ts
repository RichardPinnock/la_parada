import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Product } from "./models/products";

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
  console.log('generando pdf ----------------------');
  // // Para duplicar filas (duplicar todo el arreglo):
  // ipvData = [...ipvData, ...ipvData];

  // // Para quitar filas (por ejemplo, quedarnos sólo con las primeras 10 filas):
  // ipvData = ipvData.slice(0, 27);
  
  // Crear el documento PDF
  const doc = new jsPDF();

  // Determinar la fecha a usar en el reporte
  const fechaActual = fecha ? new Date(fecha) : new Date();
  const fechaTexto = fechaActual.toLocaleDateString(); // Fecha en formato corto (p.ej., 10/06/2025)
  const fechaTextoLargo = fechaActual.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }); // Fecha en formato largo (p.ej., 10 de junio de 2025)

  // Título del reporte
  doc.setFontSize(16);
  doc.text(`${localName} - IPV ${fechaTextoLargo}`, 14, 20);

  // Mostrar los autores (o autor) del reporte
  const authorTitle = authors.length > 1 ? "Autores" : "Autor";
  doc.setFontSize(12);
  doc.text(authorTitle, 14, 30);
  authors.forEach((author, i) => {
    doc.text(`- ${author}`, 20, 36 + i * 6);
  });

  // Configuración de la tabla:
  // Encabezados de la tabla (se puede ocultar valores comentados según necesidad)
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

  // Cuerpo de la tabla, recorriendo cada fila de ipvData
  const rows = ipvData.map((item) => [
    item.nombre,
    // Utilizamos item.PV en vez de PC ya que en el ejemplo se comenta PC
    item.PV.toFixed(2),
    item.I,
    item.E,
    item.M,
    item.V,
    item.R,
    item.T.toFixed(2),
    // item.G.toFixed(2),
  ]);

  // Dibujar la tabla utilizando autoTable
  autoTable(doc, {
    startY: 40 + authors.length * 6, // Posición inicial debajo del encabezado
    head: headers,
    body: rows,
    theme: "grid",
    // Propiedades de estilos para cada columna (ajusta según tus necesidades)
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
      fillColor: [245, 245, 245],
    },
    headStyles: {
      fillColor: [91, 163, 211],
      textColor: 20,
      fontStyle: "bold",
    },
  });

  // Se recupera la posición vertical final de la tabla
  const finalY = (doc as any).lastAutoTable?.finalY ?? 40 + authors.length * 6;


  const totalRows = ipvData.length;
  console.log('totalRows', totalRows);
  
  let addFooterOnNewPage = false;
  // Sólo aplicar si hay más de 29 productos (pues en la primera hoja no se moverá)
  if (totalRows > 29) {
    let rowsInLastPage = (totalRows - 29) % 33; // en páginas posteriores se usan 33 filas por hoja
    if (rowsInLastPage === 0) {
      rowsInLastPage = 33; // si encaja exacto, se llenó la página
    }
    if (rowsInLastPage > 28) {
      // Si hay más de 28 filas en la última página, movemos el footer a una nueva página
      addFooterOnNewPage = true;
    }
    console.log('rowsInLastPage', rowsInLastPage);
  } else if(totalRows > 26) {
    addFooterOnNewPage = true; // Si hay más de 26 filas, mover a nueva página para footer
  }
  
  
  // Agregar nueva página para el footer si corresponde
  if (addFooterOnNewPage) {
    console.log('se agrego otra hoja');
    
    doc.addPage();
  }

  // Calcular el total de ventas (suma de la columna T)
  const total = ipvData.reduce((sum, row) => sum + row.T, 0);

  // Dibujar el footer: Total, Fecha y firmas
  // Se usa finalY para la posición; si se agregó página nueva, se usará la posición en esa hoja
  // Si se agregó una nueva página para el footer, se reinicia la posición vertical
  const footerY = addFooterOnNewPage ? 20 : finalY;
  
  doc.text(`Total: $${total.toFixed(2)}`, 14, footerY + 10);
  doc.text(`Fecha: ${fechaTexto}`, 14, footerY + 20);
  doc.text("Firma del dependiente que entrega: ______________________", 14, footerY + 30);
  doc.text("Firma del dependiente que recibe: _______________________", 14, footerY + 40);

  // Finalmente, guardar el PDF con un nombre informado por fecha
  doc.save(`IPV-${fechaTexto}.pdf`);
}

export function getSalePrice(product: Product, locationId: string = "0"): number {
  const price =
    locationId === "0"
      ? product.prices?.[0]?.salePrice ?? product.salePrice
      : product.prices?.find((p) => p.locationId === locationId)?.salePrice ?? product.salePrice;

  return price
}