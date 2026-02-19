export type PricedCartItem = {
  quantity: number;
  product: {
    price: number;
  };
};

export type CartTotals = {
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  couponApplied: boolean;
  couponCode: string | null;
};

const TAX_RATE = 0.08;
const SHIPPING_FLAT = 12.5;
const FREE_SHIPPING_THRESHOLD = 150;
const COUPON_CODE = "LUNARIS10";
const COUPON_DISCOUNT_RATE = 0.1;

const roundCurrency = (value: number): number => Math.round(value * 100) / 100;

export const calculateCartTotals = (
  items: PricedCartItem[],
  couponCode?: string | null,
): CartTotals => {
  const normalizedCode = couponCode?.trim().toUpperCase() || null;
  const couponApplied = normalizedCode === COUPON_CODE;

  const subtotal = roundCurrency(
    items.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0,
    ),
  );

  const discount = couponApplied
    ? roundCurrency(subtotal * COUPON_DISCOUNT_RATE)
    : 0;
  const discountedSubtotal = roundCurrency(Math.max(0, subtotal - discount));
  const shipping =
    discountedSubtotal === 0 || discountedSubtotal >= FREE_SHIPPING_THRESHOLD
      ? 0
      : SHIPPING_FLAT;
  const tax = roundCurrency(discountedSubtotal * TAX_RATE);
  const total = roundCurrency(discountedSubtotal + shipping + tax);

  return {
    subtotal,
    discount,
    shipping,
    tax,
    total,
    couponApplied,
    couponCode: couponApplied ? normalizedCode : null,
  };
};
