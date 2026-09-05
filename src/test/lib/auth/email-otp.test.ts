import { describe, expect, it } from "vitest";
import {
  OTP_RESEND_COOLDOWN_MS,
  OTP_TTL_MS,
  generateEmailOtp,
  isResendAllowed,
  isValidEmail,
  isValidOtpCode,
  normalizeEmail,
  otpExpiryDate,
} from "@/lib/auth/email-otp";

describe("email-otp helpers", () => {
  it("normalizes email case and whitespace", () => {
    expect(normalizeEmail("  User@Example.COM ")).toBe("user@example.com");
    expect(normalizeEmail("a@b.co")).toBe("a@b.co");
  });

  it("validates email addresses", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("USER@EXAMPLE.COM")).toBe(true);
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("a @b.com")).toBe(false);
  });

  it("validates otp codes strictly", () => {
    expect(isValidOtpCode("123456")).toBe(true);
    expect(isValidOtpCode(" 123456 ")).toBe(true);
    expect(isValidOtpCode("12345")).toBe(false);
    expect(isValidOtpCode("1234567")).toBe(false);
    expect(isValidOtpCode("abcdef")).toBe(false);
    expect(isValidOtpCode("")).toBe(false);
    expect(isValidOtpCode("12 34 56")).toBe(false);
  });

  it("generates 6-digit numeric codes", () => {
    for (let i = 0; i < 20; i++) {
      const code = generateEmailOtp();
      expect(code).toMatch(/^\d{6}$/);
      expect(Number(code)).toBeGreaterThanOrEqual(100000);
      expect(Number(code)).toBeLessThanOrEqual(999999);
    }
  });

  it("expires codes after the TTL", () => {
    const before = Date.now();
    const expiry = otpExpiryDate(before);
    expect(expiry.getTime() - before).toBe(OTP_TTL_MS);
    expect(expiry.getTime()).toBeGreaterThan(Date.now());
  });

  it("allows resend after the cooldown", () => {
    const now = Date.now();
    expect(isResendAllowed(null, now)).toBe(true);
    expect(isResendAllowed(new Date(now - 1000), now)).toBe(false);
    expect(
      isResendAllowed(new Date(now - OTP_RESEND_COOLDOWN_MS), now),
    ).toBe(true);
    expect(
      isResendAllowed(new Date(now - OTP_RESEND_COOLDOWN_MS - 1), now),
    ).toBe(true);
  });
});
