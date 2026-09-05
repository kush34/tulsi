import { Resend } from "resend";
import { db } from "@/db";
import { createLogger } from "@/lib/logging";
import { config } from "@/lib/config";
import { Prisma } from "@prisma/client";

const log = createLogger("notifications");

export async function sendOtp(
  email: string,
  code: string,
  purpose: string,
): Promise<void> {
  if (config.notifications.resendApiKey) {
    try {
      const resend = new Resend(config.notifications.resendApiKey);
      const { error } = await resend.emails.send({
        from: config.notifications.from,
        to: [email],
        subject: "Your verification code",
        text: `Your Tulsi verification code is: ${code}`,
      });
      if (error) throw error;
      return;
    } catch (err) {
      log.error({ err }, "Failed to send OTP via Resend, falling back to log");
    }
  }

  log.info({ to: email, code, purpose }, "[DEV] OTP send placeholder");
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
