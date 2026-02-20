import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getAuthPayload } from "@/app/lib/auth-session";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const payload = getAuthPayload(request);

  if (!payload) {
    return NextResponse.json(
      { success: false, message: "Not authenticated." },
      { status: 401 },
    );
  }

  const order = await prisma.order.findFirst({
    where: { id, userId: payload.userId },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, imageUrl: true },
          },
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json(
      { success: false, message: "Order not found." },
      { status: 404 },
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: order,
    },
    { status: 200 },
  );
}
