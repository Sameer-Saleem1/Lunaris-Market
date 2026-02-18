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
