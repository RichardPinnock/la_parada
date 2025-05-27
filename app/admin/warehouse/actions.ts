"use server";

import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export async function registerStockLocation(data: FormData) {
    console.log("data register location --->>", data);
    
  // si tiene id es actualizar, si no es crear
  const id = data.get("id") as string;
  const name = data.get("name") as string;
  const isActive = data.get("isActive") === "on";
  if (!name) {
    throw new Error("El nombre es obligatorio");
  }
  // Validar si el nombre ya existe
  const isDuplicate = await validateStockLocationName(name, id);
  if (isDuplicate) {
    throw new Error(
      "Ya existe un local con ese nombre, por favor elige otro nombre."
    );
  }

  if (id) {
    await prisma.stockLocation.update({
      where: { id },
      data: { name, isActive },
    });
  } else {
    await prisma.stockLocation.create({
      data: { name, isActive },
    });
  }

  redirect("/admin/warehouse");
}
async function validateStockLocationName(name: string, id?: string) {
  const existingLocation = await prisma.stockLocation.findFirst({
    where: {
      name,
      id: id ? { not: id } : undefined, // si hay id, no considerar ese registro
    },
  });
  return existingLocation ? true : false; // retorna true si existe un nombre duplicado
}
