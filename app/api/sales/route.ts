import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    // Get the paginated sales and the total count concurrently
    const [sales, total] = await Promise.all([
        prisma.sale.findMany({
            skip,
            take: limit,
            where: {
                
                user: {
                    name: {
                        contains: searchParams.get("search") || "",
                        mode: "insensitive",
                    },
                },
                paymentMethod: {
                    name: {
                        contains: searchParams.get("search") || "",
                        mode: "insensitive",
                    },
                },
                items: {
                    some: {
                        product: {
                            name: {
                                contains: searchParams.get("search") || "",
                                mode: "insensitive",
                            },
                        },
                        location: {
                            name: {
                                contains: searchParams.get("search") || "",
                                mode: "insensitive",
                            },
                        }
                    },
                    
                },
                
            }
        }),
        prisma.sale.count(),
    ]);

    return NextResponse.json({
        sales,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    });
}