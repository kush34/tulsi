import { db } from "@/db";
import { createLogger } from "@/lib/logging";
import { config } from "@/lib/config";
import { Prisma } from "@prisma/client";

const log = createLogger("notifications");

export async function sendOtp(phoneOrEmail: string, code: string, purpose: string): Promise<void> {
  const { storage, notifications } = config;
  void purpose;

  if (notifications.resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${notifications.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `Tulsi <onboarding@${notifications.smtp.host || "tulsi.dev"}>`,
          to: [phoneOrEmail],
          subject: "Your verification code",
          text: `Your Tulsi verification code is: ${code}`,
        }),
      });
      if (!res.ok) throw new Error(`Resend failed: ${res.status}`);
      return;
    } catch (error) {
      log.error({ err: error }, "Failed to send OTP via Resend, falling back to log");
    }
  }

  void storage;
  log.info({ to: phoneOrEmail, code, purpose }, "[DEV] OTP send placeholder");
}

export async function recordAuditEvent(input: {
  userId?: string;
  event: string;
  metadata?: Prisma.InputJsonValue;
  ip?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await db.auditEvent.create({
      data: {
        userId: input.userId,
        event: input.event,
        metadata: input.metadata,
        ip: input.ip,
        userAgent: input.userAgent,
      },
    });
  } catch (error) {
    log.error({ err: error, event: input.event }, "Failed to record audit event");
  }
}
