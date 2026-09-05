import crypto from "crypto";

export const OTP_LENGTH = 6;
export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_RE = /^\d{6}$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(normalizeEmail(email));
}

export function isValidOtpCode(code: string): boolean {
  return OTP_RE.test(code.trim());
}

export function generateEmailOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export function otpExpiryDate(now = Date.now()): Date {
  return new Date(now + OTP_TTL_MS);
}

export function isResendAllowed(lastSentAt: Date | null, now = Date.now()): boolean {
  if (!lastSentAt) return true;
  return now - lastSentAt.getTime() >= OTP_RESEND_COOLDOWN_MS;
}
