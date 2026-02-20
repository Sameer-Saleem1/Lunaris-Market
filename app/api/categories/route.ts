import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export const revalidate = 60;

export async function GET(request: NextRequest) {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  const response = NextResponse.json(
    { success: true, data: categories },
    { status: 200 },
  );

  response.headers.set(
    "Cache-Control",
    "s-maxage=60, stale-while-revalidate=300",
  );

  return response;
}
