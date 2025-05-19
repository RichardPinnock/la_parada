import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const paymentMethods = await prisma.paymentMethod.findMany();
    if (!paymentMethods) {
      return NextResponse.json(
        { error: "No se encontraron métodos de pago" },
        { status: 404 }
      );
    }
    return NextResponse.json(paymentMethods);
  } catch (error) {
    console.log("error al obtener los métodos de pago", error);

    return NextResponse.json(
      {
        error: "Error al obtener los métodos de pago",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const newPaymentMethod = await prisma.paymentMethod.create({
      data,
    });
    return NextResponse.json(newPaymentMethod, { status: 201 });
  } catch (error) {
    console.log("error al crear el método de pago", error);
    return NextResponse.json(
      {
        error: "Error al crear el método de pago",
      },
      { status: 500 }
    );
  }
}
