import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";


export async function GET(request: Request) {
    try {
        const shifts = await prisma.shift.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                stockLocation: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                snapshots: {
                    select: {
                        id: true,
                        quantity: true,
                        type: true,
                        product: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    }
                }
            },
        });
        if (!shifts) {
            return NextResponse.json({ error: "No se encontraron turnos registrados" }, { status: 404 });
        }
        return NextResponse.json(shifts, { status: 200 });
    } catch (error) {
        console.error("Error fetching shifts", error);
        return NextResponse.json({ error: "Failed to fetch shifts" }, { status: 500 });
    }
}