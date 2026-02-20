import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export const revalidate = 60;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const categoryId = searchParams.get("category");

  const products = await prisma.product.findMany({
    where: {
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(categoryId ? { categoryId } : {}),
    },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  const response = NextResponse.json(
    { success: true, data: products },
    { status: 200 },
  );

  response.headers.set("Cache-Control", "s-maxage=60, stale-while-revalidate=300");

  return response;
}
