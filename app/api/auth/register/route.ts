import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import {
  hashPassword,
  generateVerificationToken,
  generateTokenExpiry,
} from "@/app/lib/auth";
import { sendVerificationEmail } from "@/app/lib/mail";
import { registerSchema } from "@/app/lib/schemas";

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON body. Please send valid JSON payload.",
        },
        { status: 400 },
      );
    }

    // Validate input with Zod
    const validationResult = registerSchema.safeParse(body);

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

    const { name, email, password } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User with this email already exists",
        },
        { status: 409 },
      );
    }

    // Hash password with bcrypt
    const hashedPassword = await hashPassword(password);

    // Generate email verification token
    const verificationToken = generateVerificationToken();
    const tokenExpiry = generateTokenExpiry();

    // Save user with verification token in a transaction
    const user = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          emailVerified: false,
        },
      });

      // Create verification token
      await tx.verificationToken.create({
        data: {
          userId: newUser.id,
          token: verificationToken,
          expiresAt: tokenExpiry,
        },
      });

      return newUser;
    });

    // Send verification email via Nodemailer
    try {
      // Get the origin from request headers for production compatibility
      let origin: string | undefined;

      // Try to get origin directly first (works in some cases)
      origin = request.headers.get("origin") || undefined;

      // Fall back to constructing from x-forwarded-proto and host (Vercel proxy headers)
      if (!origin) {
        const proto = request.headers.get("x-forwarded-proto");
        const host = request.headers.get("host");
        if (proto && host) {
          origin = `${proto}://${host}`;
        }
      }

      await sendVerificationEmail(email, verificationToken, name, origin);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Don't fail the registration if email fails
      // User is already created, we just log the error
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message:
          "Registration successful! Please check your email to verify your account.",
        data: {
          userId: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);

    // Provide more specific error messages
    let errorMessage = "An error occurred during registration";

    if (error instanceof Error) {
      // Check for common Prisma errors
      if (error.message.includes("Can't reach database server")) {
        errorMessage =
          "Database connection failed. Please check your database configuration.";
      } else if (error.message.includes("does not exist")) {
        errorMessage =
          "Database tables not found. Please run: npx prisma migrate deploy";
      } else if (error.message.includes("Unique constraint")) {
        errorMessage = "User with this email already exists";
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Registration endpoint is working!",
  });
}
