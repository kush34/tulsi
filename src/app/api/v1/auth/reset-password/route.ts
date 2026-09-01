import { NextRequest } from "next/server";
import { OtpPurpose } from "@prisma/client";
import { db } from "@/db";
import { validate } from "@/lib/validators";
import { resetPasswordSchema } from "@/lib/validators/auth";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { checkRateLimit } from "@/lib/auth/rate-limit-route";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { verifyOtp } from "@/lib/auth/otp";
import { hashPassword } from "@/lib/auth/password";
import { recordAuditEvent } from "@/lib/auth/notifications";

export async function POST(req: NextRequest) {
  const rateLimitResponse = checkRateLimit(req, "RECOVERY");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json().catch(() => ({}));
    const input = validate(resetPasswordSchema, body);

    const user = await db.user.findUnique({ where: { email: input.email } });
    if (!user || !user.isActive) throw new NotFoundError("User");

    const otpRecord = await db.otp.findFirst({
      where: {
        userId: user.id,
        purpose: OtpPurpose.RESET_PASSWORD,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord || !(await verifyOtp(input.code, otpRecord.codeHash))) {
      throw new ValidationError({ code: ["Invalid or expired OTP"] });
    }

    const passwordHash = await hashPassword(input.newPassword);

    await db.$transaction([
      db.otp.update({
        where: { id: otpRecord.id },
        data: { usedAt: new Date() },
      }),
      db.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
    ]);

    await recordAuditEvent({
      userId: user.id,
      event: "AUTH.PASSWORD_RESET",
      ip: req.headers.get("x-forwarded-for") ?? undefined,
    });

    return successResponse({ message: "Password reset successfully. You can now log in." });
  } catch (error) {
    return errorResponse(error);
  }
}