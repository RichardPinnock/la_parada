"use server";

import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function createProduct(formData: FormData) {
  await prisma.product.create({
    data: {
      name: formData.get("name") as string,
      purchasePrice: parseFloat(formData.get("purchasePrice") as string),
      salePrice: parseFloat(formData.get("salePrice") as string),
      imageName: formData.get("imageName") as string,
      stock: 0,
      isActive: formData.get("isActive") === "on",
      notes: formData.get("notes") as string,
    },
  });

  redirect("/products");
}