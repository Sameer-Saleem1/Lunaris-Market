import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { signAuthToken, verifyPassword } from "@/app/lib/auth";
import { AUTH_COOKIE_NAME } from "@/app/lib/auth-session";
import { loginSchema } from "@/app/lib/schemas";

export async function POST(request: NextRequest) {
  try {
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

    const validationResult = loginSchema.safeParse(body);

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

    const { email, password } = validationResult.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        { status: 401 },
      );
    }

    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        { status: 401 },
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        {
          success: false,
          message: "Please verify your email before logging in.",
        },
        { status: 403 },
      );
    }

    let authToken: string;
    try {
      authToken = signAuthToken({ userId: user.id, role: user.role });
    } catch (signError) {
      return NextResponse.json(
        {
          success: false,
          message: "JWT secret is not configured. Please set JWT_SECRET.",
        },
        { status: 500 },
      );
    }

    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful.",
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

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: authToken,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    let errorMessage = "An error occurred during login";

    if (error instanceof Error) {
      if (error.message.includes("Can't reach database server")) {
        errorMessage =
          "Database connection failed. Please check your database configuration.";
      } else if (error.message.includes("does not exist")) {
        errorMessage =
          "Database tables not found. Please run: npx prisma migrate deploy";
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
