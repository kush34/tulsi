import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { db } from "@/db";
import { validate } from "@/lib/validators";
import { registerSchema } from "@/lib/validators/auth";
import { hashPassword } from "@/lib/auth/password";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { checkRateLimit } from "@/lib/auth/rate-limit-route";
import { ConflictError } from "@/lib/errors";
import { generateOtp, hashOtp } from "@/lib/auth/otp";
import { sendOtp, recordAuditEvent } from "@/lib/auth/notifications";
import { OtpPurpose } from "@prisma/client";

const OTP_TTL_MS = 10 * 60 * 1000;

export async function POST(req: NextRequest) {
  const rateLimitResponse = checkRateLimit(req, "REGISTER");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json().catch(() => ({}));
    const input = validate(registerSchema, body);

    const existing = await db.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictError("An account with this email already exists");

    const passwordHash = await hashPassword(input.password);

    const user = await db.user.create({
      data: {
        email: input.email,
        name: input.name,
        phone: input.phone,
        passwordHash,
        role: input.role,
        isVerified: false,
        patient:
          input.role === Role.PATIENT
            ? {
                create: input.patient ?? {},
              }
            : undefined,
        doctor:
          input.role === Role.DOCTOR
            ? {
                create: input.doctor,
              }
            : undefined,
      },
    });

    const otp = generateOtp();
    await db.otp.create({
      data: {
        userId: user.id,
        codeHash: await hashOtp(otp),
        purpose: OtpPurpose.VERIFY_EMAIL,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    await sendOtp(user.email, otp, "VERIFY_EMAIL");
    await recordAuditEvent({
      userId: user.id,
      event: "AUTH.REGISTER",
      metadata: { role: input.role },
      ip: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    return successResponse(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        message: "Account created. Please verify your email with the OTP sent.",
      },
      201
    );
  } catch (error) {
    return errorResponse(error);
  }
}