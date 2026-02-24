import { NextRequest, NextResponse } from "next/server";
import { getAuthPayload } from "@/app/lib/auth-session";
import { prisma } from "@/app/lib/prisma";

export async function GET(request: NextRequest) {
  const payload = getAuthPayload(request);

  if (!payload) {
    return NextResponse.json(
      { success: false, message: "Not authenticated." },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json(
      { success: false, message: "Missing session id." },
      { status: 400 },
    );
  }

  const order = await prisma.order.findFirst({
    where: { stripeSessionId: sessionId, userId: payload.userId },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
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
      data: {
        orderId: order.id,
        status: order.status,
        paymentStatus: order.paymentStatus,
      },
    },
    { status: 200 },
  );
}
