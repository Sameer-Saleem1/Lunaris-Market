import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getAuthPayload } from "@/app/lib/auth-session";
import { calculateCartTotals } from "@/app/lib/pricing";

const DEFAULT_QUANTITY = 1;

const parseQuantity = (value: unknown): number | null => {
  if (value === undefined) {
    return DEFAULT_QUANTITY;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

const parseUpdateQuantity = (value: unknown): number | null => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
};

export async function GET(request: NextRequest) {
  const payload = getAuthPayload(request);
  const { searchParams } = new URL(request.url);
  const couponCode = searchParams.get("coupon");

  if (!payload) {
    return NextResponse.json(
      { success: false, message: "Not authenticated." },
      { status: 401 },
    );
  }

  const cart = await prisma.cart.findFirst({
    where: { userId: payload.userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        select: {
          productId: true,
          quantity: true,
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              imageUrl: true,
              stock: true,
              category: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  const items = cart?.items ?? [];
  const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);
  const totals = calculateCartTotals(items, couponCode);

  return NextResponse.json(
    {
      success: true,
      data: {
        items,
        totalQuantity,
        totals,
      },
    },
    { status: 200 },
  );
}

export async function POST(request: NextRequest) {
  const payload = getAuthPayload(request);

  if (!payload) {
    return NextResponse.json(
      { success: false, message: "Not authenticated." },
      { status: 401 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { success: false, message: "Invalid request payload." },
      { status: 400 },
    );
  }

  const { productId, quantity } = body as {
    productId?: unknown;
    quantity?: unknown;
  };

  if (!productId || typeof productId !== "string") {
    return NextResponse.json(
      { success: false, message: "Product ID is required." },
      { status: 400 },
    );
  }

  const parsedQuantity = parseQuantity(quantity);

  if (!parsedQuantity) {
    return NextResponse.json(
      { success: false, message: "Quantity must be a positive integer." },
      { status: 400 },
    );
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, stock: true },
  });

  if (!product) {
    return NextResponse.json(
      { success: false, message: "Product not found." },
      { status: 404 },
    );
  }

  if (product.stock < parsedQuantity) {
    return NextResponse.json(
      { success: false, message: "Not enough stock available." },
      { status: 409 },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const activeCart =
        (await tx.cart.findFirst({
          where: { userId: payload.userId },
          orderBy: { createdAt: "desc" },
        })) ?? (await tx.cart.create({ data: { userId: payload.userId } }));

      const existingItem = await tx.cartItem.findFirst({
        where: {
          cartId: activeCart.id,
          productId,
        },
      });

      if (existingItem) {
        const nextQuantity = existingItem.quantity + parsedQuantity;

        if (nextQuantity > product.stock) {
          throw new Error("STOCK_LIMIT");
        }

        const updatedItem = await tx.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: nextQuantity },
          select: {
            productId: true,
            quantity: true,
            product: { select: { stock: true } },
          },
        });

        const totalQuantity = await tx.cartItem.aggregate({
          where: { cartId: activeCart.id },
          _sum: { quantity: true },
        });

        return {
          item: updatedItem,
          totalQuantity: totalQuantity._sum.quantity ?? 0,
        };
      }

      const createdItem = await tx.cartItem.create({
        data: {
          cartId: activeCart.id,
          productId,
          quantity: parsedQuantity,
        },
        select: {
          productId: true,
          quantity: true,
          product: { select: { stock: true } },
        },
      });

      const totalQuantity = await tx.cartItem.aggregate({
        where: { cartId: activeCart.id },
        _sum: { quantity: true },
      });

      return {
        item: createdItem,
        totalQuantity: totalQuantity._sum.quantity ?? 0,
      };
    });

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "STOCK_LIMIT") {
      return NextResponse.json(
        { success: false, message: "Stock limit reached for this item." },
        { status: 409 },
      );
    }

    console.error("Add to cart error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to add to cart." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const payload = getAuthPayload(request);

  if (!payload) {
    return NextResponse.json(
      { success: false, message: "Not authenticated." },
      { status: 401 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { success: false, message: "Invalid request payload." },
      { status: 400 },
    );
  }

  const { productId, quantity } = body as {
    productId?: unknown;
    quantity?: unknown;
  };

  if (!productId || typeof productId !== "string") {
    return NextResponse.json(
      { success: false, message: "Product ID is required." },
      { status: 400 },
    );
  }

  const parsedQuantity = parseUpdateQuantity(quantity);

  if (parsedQuantity === null) {
    return NextResponse.json(
      { success: false, message: "Quantity must be 0 or a positive integer." },
      { status: 400 },
    );
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, stock: true },
  });

  if (!product) {
    return NextResponse.json(
      { success: false, message: "Product not found." },
      { status: 404 },
    );
  }

  if (parsedQuantity > product.stock) {
    return NextResponse.json(
      { success: false, message: "Not enough stock available." },
      { status: 409 },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const activeCart = await tx.cart.findFirst({
        where: { userId: payload.userId },
        orderBy: { createdAt: "desc" },
      });

      if (!activeCart) {
        return { items: [], totalQuantity: 0 };
      }

      const existingItem = await tx.cartItem.findFirst({
        where: { cartId: activeCart.id, productId },
      });

      if (!existingItem) {
        const totalQuantity = await tx.cartItem.aggregate({
          where: { cartId: activeCart.id },
          _sum: { quantity: true },
        });

        return {
          item: null,
          removedProductId: null,
          totalQuantity: totalQuantity._sum.quantity ?? 0,
        };
      }

      if (parsedQuantity === 0) {
        await tx.cartItem.delete({ where: { id: existingItem.id } });
        const totalQuantity = await tx.cartItem.aggregate({
          where: { cartId: activeCart.id },
          _sum: { quantity: true },
        });

        return {
          item: null,
          removedProductId: productId,
          totalQuantity: totalQuantity._sum.quantity ?? 0,
        };
      }

      const updatedItem = await tx.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: parsedQuantity },
        select: {
          productId: true,
          quantity: true,
          product: { select: { stock: true } },
        },
      });

      const totalQuantity = await tx.cartItem.aggregate({
        where: { cartId: activeCart.id },
        _sum: { quantity: true },
      });

      return {
        item: updatedItem,
        removedProductId: null,
        totalQuantity: totalQuantity._sum.quantity ?? 0,
      };
    });

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error("Update cart error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update cart." },
      { status: 500 },
    );
  }
}
