import { NextRequest } from "next/server";
import { OtpPurpose } from "@prisma/client";
import { db } from "@/db";
import { validate } from "@/lib/validators";
import { verifyOtpSchema } from "@/lib/validators/auth";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { checkRateLimit } from "@/lib/auth/rate-limit-route";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { verifyOtp } from "@/lib/auth/otp";
import { recordAuditEvent } from "@/lib/auth/notifications";

export async function POST(req: NextRequest) {
  const rateLimitResponse = checkRateLimit(req, "OTP_VERIFY");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json().catch(() => ({}));
    const input = validate(verifyOtpSchema, body);

    const user = await db.user.findUnique({ where: { email: input.email } });
    if (!user || !user.isActive) throw new NotFoundError("User");

    const otpRecord = await db.otp.findFirst({
      where: {
        userId: user.id,
        purpose: input.purpose as OtpPurpose,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      throw new ValidationError({ code: ["Invalid or expired OTP"] });
    }

    const valid = await verifyOtp(input.code, otpRecord.codeHash);
    if (!valid) {
      await recordAuditEvent({
        userId: user.id,
        event: "AUTH.OTP_INVALID_ATTEMPT",
        metadata: { purpose: input.purpose },
        ip: req.headers.get("x-forwarded-for") ?? undefined,
      });
      throw new ValidationError({ code: ["Invalid or expired OTP"] });
    }

    await db.otp.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() },
    });

    const update: { isVerified?: boolean } = {};
    if (input.purpose === OtpPurpose.VERIFY_EMAIL) {
      update.isVerified = true;
    }
    if (Object.keys(update).length > 0) {
      await db.user.update({ where: { id: user.id }, data: update });
    }

    await recordAuditEvent({
      userId: user.id,
      event: "AUTH.OTP_VERIFIED",
      metadata: { purpose: input.purpose },
      ip: req.headers.get("x-forwarded-for") ?? undefined,
    });

    return successResponse({
      message: "Verification successful",
      verified: true,
      purpose: input.purpose,
    });
  } catch (error) {
    return errorResponse(error);
  }
}