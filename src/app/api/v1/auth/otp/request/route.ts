import { NextRequest } from "next/server";
import { OtpPurpose } from "@prisma/client";
import { db } from "@/db";
import { validate } from "@/lib/validators";
import { requestOtpSchema } from "@/lib/validators/auth";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { checkRateLimit } from "@/lib/auth/rate-limit-route";
import { NotFoundError } from "@/lib/errors";
import { generateOtp, hashOtp } from "@/lib/auth/otp";
import { sendOtp, recordAuditEvent } from "@/lib/auth/notifications";

const OTP_TTL_MS = 10 * 60 * 1000;

export async function POST(req: NextRequest) {
  const rateLimitResponse = checkRateLimit(req, "OTP_REQUEST");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json().catch(() => ({}));
    const input = validate(requestOtpSchema, body);

    const user = await db.user.findUnique({ where: { email: input.email } });
    if (!user || !user.isActive) throw new NotFoundError("User");

    await db.otp.updateMany({
      where: { userId: user.id, purpose: input.purpose, usedAt: null },
      data: { usedAt: new Date() },
    });

    const otp = generateOtp();
    await db.otp.create({
      data: {
        userId: user.id,
        codeHash: await hashOtp(otp),
        purpose: input.purpose as OtpPurpose,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    await sendOtp(user.email, otp, input.purpose);
    await recordAuditEvent({
      userId: user.id,
      event: "AUTH.OTP_REQUEST",
      metadata: { purpose: input.purpose },
      ip: req.headers.get("x-forwarded-for") ?? undefined,
    });

    return successResponse({ message: "OTP sent" });
  } catch (error) {
    return errorResponse(error);
  }
}