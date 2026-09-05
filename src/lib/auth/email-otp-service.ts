import { db } from "@/db";
import {
  OTP_TTL_MS,
  generateEmailOtp,
  isResendAllowed,
  isValidEmail,
  isValidOtpCode,
  normalizeEmail,
  otpExpiryDate,
} from "@/lib/auth/email-otp";

type Db = typeof db;

export class OtpRequestError extends Error {
  constructor(
    message: string,
    public readonly code: "INVALID_EMAIL" | "RESEND_TOO_SOON",
  ) {
    super(message);
  }
}

export class OtpVerifyError extends Error {
  constructor(
    message: string,
    public readonly code: "INVALID_INPUT" | "INVALID_OR_EXPIRED",
  ) {
    super(message);
  }
}

export async function requestEmailOtp(
  rawEmail: string,
  database: Db = db,
): Promise<{ email: string; code: string }> {
  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email)) {
    throw new OtpRequestError("Enter a valid email address.", "INVALID_EMAIL");
  }

  const latest = await database.verificationToken.findFirst({
    where: { identifier: email },
    orderBy: { expires: "desc" },
  });
  if (latest) {
    const sentAt = new Date(latest.expires.getTime() - OTP_TTL_MS);
    if (!isResendAllowed(sentAt)) {
      throw new OtpRequestError(
        "Please wait before requesting another code.",
        "RESEND_TOO_SOON",
      );
    }
  }

  await database.verificationToken.deleteMany({ where: { identifier: email } });

  const code = generateEmailOtp();
  await database.verificationToken.create({
    data: { identifier: email, token: code, expires: otpExpiryDate() },
  });
  return { email, code };
}

export async function consumeEmailOtp(
  rawEmail: string,
  rawCode: string,
  database: Db = db,
): Promise<string> {
  const email = normalizeEmail(rawEmail);
  const code = rawCode.trim();
  if (!isValidEmail(email) || !isValidOtpCode(code)) {
    throw new OtpVerifyError("Invalid or expired OTP.", "INVALID_INPUT");
  }

  const record = await database.verificationToken.findFirst({
    where: { identifier: email, token: code },
  });
  if (!record || record.expires < new Date()) {
    throw new OtpVerifyError("Invalid or expired OTP.", "INVALID_OR_EXPIRED");
  }

  await database.verificationToken
    .delete({
      where: { identifier_token: { identifier: email, token: code } },
    })
    .catch(() => undefined);

  return email;
}
