import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/auth-session";
import { productSchema } from "@/app/lib/schemas";

export async function GET(request: NextRequest) {
  const admin = requireAdmin(request);

  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Admin access required." },
      { status: 403 },
    );
  }

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });

  return NextResponse.json({ success: true, data: products }, { status: 200 });
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

  const validationResult = productSchema.safeParse(body);

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

  const category = await prisma.category.findUnique({
    where: { id: validationResult.data.categoryId },
  });

  if (!category) {
    return NextResponse.json(
      { success: false, message: "Selected category not found." },
      { status: 404 },
    );
  }

  const product = await prisma.product.create({
    data: validationResult.data,
    include: { category: true },
  });

  return NextResponse.json(
    { success: true, message: "Product created.", data: product },
    { status: 201 },
  );
}
