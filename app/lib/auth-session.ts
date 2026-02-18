import { NextRequest } from "next/server";
import { verifyAuthToken, AuthTokenPayload } from "@/app/lib/auth";

export const AUTH_COOKIE_NAME = "auth_token";

export function getAuthPayload(request: NextRequest): AuthTokenPayload | null {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    return verifyAuthToken(token);
  } catch {
    return null;
  }
}

export function requireAdmin(request: NextRequest): AuthTokenPayload | null {
  const payload = getAuthPayload(request);

  if (!payload || payload.role !== "ADMIN") {
    return null;
  }

  return payload;
}
