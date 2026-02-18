import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/auth-session";
import { categorySchema } from "@/app/lib/schemas";

export async function GET(request: NextRequest) {
  const admin = requireAdmin(request);

  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Admin access required." },
      { status: 403 },
    );
  }

  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    { success: true, data: categories },
    { status: 200 },
  );
}

export async function POST(request: NextRequest) {
  const admin = requireAdmin(request);

  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Admin access required." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body. Please send valid JSON." },
      { status: 400 },
    );
  }

  const validationResult = categorySchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Validation failed",
        errors: validationResult.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const existing = await prisma.category.findFirst({
    where: { name: validationResult.data.name },
  });

  if (existing) {
    return NextResponse.json(
      { success: false, message: "Category already exists." },
      { status: 409 },
    );
  }

  const category = await prisma.category.create({
    data: validationResult.data,
  });

  return NextResponse.json(
    { success: true, message: "Category created.", data: category },
    { status: 201 },
  );
}
