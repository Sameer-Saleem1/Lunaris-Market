import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

const buildHtml = (title: string, message: string) => `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="font-family: Arial, sans-serif; background: #f7f7f7; padding: 40px;">
    <div style="max-width: 560px; margin: 0 auto; background: #fff; padding: 28px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.08);">
      <h1 style="margin: 0 0 12px; color: #1f2937; font-size: 22px;">${title}</h1>
      <p style="margin: 0 0 16px; color: #4b5563; line-height: 1.6;">${message}</p>
      <a href="/login" style="display: inline-block; padding: 10px 16px; background: #4f46e5; color: #fff; text-decoration: none; border-radius: 8px;">Go to login</a>
    </div>
  </body>
</html>`;

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token");

  if (!token) {
    return new NextResponse(
      buildHtml("Verification failed", "Missing verification token."),
      { headers: { "content-type": "text/html" }, status: 400 },
    );
  }

  const verificationRecord = await prisma.verificationToken.findFirst({
    where: { token },
  });

  if (!verificationRecord) {
    return new NextResponse(
      buildHtml("Verification failed", "Invalid or already used token."),
      { headers: { "content-type": "text/html" }, status: 400 },
    );
  }

  const now = new Date();
  if (verificationRecord.expiresAt < now) {
    await prisma.verificationToken.delete({
      where: { id: verificationRecord.id },
    });

    return new NextResponse(
      buildHtml("Verification expired", "Your verification link has expired."),
      { headers: { "content-type": "text/html" }, status: 400 },
    );
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: verificationRecord.userId },
      data: { emailVerified: true },
    }),
    prisma.verificationToken.delete({
      where: { id: verificationRecord.id },
    }),
  ]);

  return new NextResponse(
    buildHtml("Email verified", "Your email has been verified successfully."),
    { headers: { "content-type": "text/html" }, status: 200 },
  );
}
