import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { rateLimit } from "@/lib/auth/rate-limiter";

export const AUTH_LIMITS = {
  REGISTER: { limit: 5, windowMs: 60 * 60 * 1000 },
  LOGIN: { limit: 10, windowMs: 15 * 60 * 1000 },
  OTP_REQUEST: { limit: 5, windowMs: 15 * 60 * 1000 },
  OTP_VERIFY: { limit: 10, windowMs: 15 * 60 * 1000 },
  RECOVERY: { limit: 5, windowMs: 15 * 60 * 1000 },
  UPLOAD: { limit: 30, windowMs: 60 * 60 * 1000 },
} as const;

export function checkRateLimit(
  req: NextRequest,
  type: keyof typeof AUTH_LIMITS
): NextResponse | null {
  const { limit, windowMs } = AUTH_LIMITS[type];
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const key = `${type}:${ip}`;
  const result = rateLimit(key, limit, windowMs);

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: "Too many attempts. Please try again later.",
        },
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(result.retryAfterSeconds ?? 60),
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": String(result.remaining),
        },
      }
    );
  }

  return null;
}
