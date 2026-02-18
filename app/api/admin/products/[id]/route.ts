import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/auth-session";
import { productSchema } from "@/app/lib/schemas";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

  const existing = await prisma.product.findUnique({
    where: { id: params.id },
  });

  if (!existing) {
    return NextResponse.json(
      { success: false, message: "Product not found." },
      { status: 404 },
    );
  }

  const updated = await prisma.product.update({
    where: { id: params.id },
    data: validationResult.data,
    include: { category: true },
  });

  return NextResponse.json(
    { success: true, message: "Product updated.", data: updated },
    { status: 200 },
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = requireAdmin(request);

  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Admin access required." },
      { status: 403 },
    );
  }

  const existing = await prisma.product.findUnique({
    where: { id: params.id },
  });

  if (!existing) {
    return NextResponse.json(
      { success: false, message: "Product not found." },
      { status: 404 },
    );
  }

  await prisma.product.delete({
    where: { id: params.id },
  });

  return NextResponse.json(
    { success: true, message: "Product deleted." },
    { status: 200 },
  );
}
