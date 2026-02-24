import nodemailer from "nodemailer";

/**
 * Create a nodemailer transporter
 * Configure this with your email service credentials
 */
export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send verification email to user
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  name?: string,
  baseUrl?: string,
): Promise<void> {
  // Use provided baseUrl or fall back to environment variable
  const appUrl =
    baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verificationUrl = `${appUrl}/api/auth/verify?token=${token}`;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || "E-Commerce App"}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your email address",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
            <h1 style="color: #2c3e50; margin-bottom: 20px;">Welcome${name ? ` ${name}` : ""}!</h1>
            <p style="margin-bottom: 20px;">Thank you for registering with our e-commerce platform.</p>
            <p style="margin-bottom: 20px;">Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Verify Email Address
              </a>
            </div>
            <p style="margin-bottom: 20px; font-size: 14px; color: #666;">
              Or copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #3498db; word-break: break-all;">${verificationUrl}</a>
            </p>
            <p style="margin-top: 30px; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 20px;">
              This verification link will expire in 24 hours.<br>
              If you didn't create an account, please ignore this email.
            </p>
          </div>
        </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Send order confirmation email after successful payment
 */
export async function sendOrderConfirmationEmail(
  email: string,
  name: string | null,
  orderDetails: {
    orderId: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
    paidAt: Date;
    couponCode?: string | null;
  },
): Promise<void> {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(date);
  };

  const itemsHtml = orderDetails.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px; text-align: left;">${item.name}</td>
        <td style="padding: 12px; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; text-align: right;">${formatCurrency(item.price)}</td>
        <td style="padding: 12px; text-align: right; font-weight: bold;">${formatCurrency(item.price * item.quantity)}</td>
      </tr>
    `,
    )
    .join("");

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || "E-Commerce App"}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Order Confirmation - Order #${orderDetails.orderId.slice(0, 8)}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background-color: #22c55e; color: white; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 30px; margin-bottom: 15px;">
                ✓
              </div>
              <h1 style="color: #2c3e50; margin: 10px 0;">Payment Successful!</h1>
              <p style="color: #666; font-size: 16px;">Thank you for your order${name ? `, ${name}` : ""}!</p>
            </div>

            <!-- Order Details -->
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h2 style="color: #2c3e50; margin-top: 0; font-size: 18px;">Order Details</h2>
              <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderDetails.orderId}</p>
              <p style="margin: 5px 0;"><strong>Payment Date:</strong> ${formatDate(orderDetails.paidAt)}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #22c55e; font-weight: bold;">PAID</span></p>
            </div>

            <!-- Order Items -->
            <div style="margin-bottom: 25px;">
              <h2 style="color: #2c3e50; font-size: 18px; margin-bottom: 15px;">Order Items</h2>
              <table style="width: 100%; border-collapse: collapse; background-color: #ffffff;">
                <thead>
                  <tr style="background-color: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                    <th style="padding: 12px; text-align: left; color: #666; font-weight: 600;">Product</th>
                    <th style="padding: 12px; text-align: center; color: #666; font-weight: 600;">Qty</th>
                    <th style="padding: 12px; text-align: right; color: #666; font-weight: 600;">Price</th>
                    <th style="padding: 12px; text-align: right; color: #666; font-weight: 600;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </div>

            <!-- Price Summary -->
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h2 style="color: #2c3e50; margin-top: 0; font-size: 18px;">Payment Summary</h2>
              <div style="border-bottom: 1px solid #dee2e6; padding-bottom: 15px; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                  <span>Subtotal:</span>
                  <span>${formatCurrency(orderDetails.subtotal)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                  <span>Tax:</span>
                  <span>${formatCurrency(orderDetails.tax)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                  <span>Shipping:</span>
                  <span>${formatCurrency(orderDetails.shipping)}</span>
                </div>
                ${
                  orderDetails.discount > 0
                    ? `
                <div style="display: flex; justify-content: space-between; margin: 8px 0; color: #22c55e;">
                  <span>Discount${orderDetails.couponCode ? ` (${orderDetails.couponCode})` : ""}:</span>
                  <span>-${formatCurrency(orderDetails.discount)}</span>
                </div>
                `
                    : ""
                }
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 20px; font-weight: bold; color: #2c3e50;">
                <span>Total Paid:</span>
                <span style="color: #22c55e;">${formatCurrency(orderDetails.total)}</span>
              </div>
            </div>

            <!-- Footer -->
            <div style="text-align: center; padding-top: 20px; border-top: 1px solid #dee2e6;">
              <p style="color: #666; font-size: 14px; margin: 10px 0;">
                We'll send you another email when your order ships.
              </p>
              <p style="color: #999; font-size: 12px; margin-top: 20px;">
                If you have any questions about your order, please contact our support team.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}
