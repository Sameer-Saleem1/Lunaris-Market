import { NextRequest, NextResponse } from "next/server";
import { getAuthPayload } from "@/app/lib/auth-session";
import { prisma } from "@/app/lib/prisma";

export async function GET(request: NextRequest) {
  const payload = getAuthPayload(request);

  if (!payload) {
    return NextResponse.json(
      {
        success: false,
        message: "Not authenticated.",
      },
      { status: 401 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        message: "User not found.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: "Authenticated.",
      data: {
        userId: user.id,
        email: user.email,
        name: user.name ?? undefined,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    },
    { status: 200 },
  );
}
