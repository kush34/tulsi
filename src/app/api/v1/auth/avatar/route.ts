import { NextRequest } from "next/server";
import { db } from "@/db";
import { requireAuth } from "@/lib/auth/guards";
import { validate } from "@/lib/validators";
import { avatarSchema } from "@/lib/validators/profile";
import { successResponse } from "@/lib/utils/api-response";
import { recordAuditEvent } from "@/lib/auth/notifications";
import { withErrorHandling } from "@/lib/middleware";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const session = await requireAuth();
  const body = await req.json().catch(() => ({}));
  const input = validate(avatarSchema, body);

  await db.user.update({
    where: { id: session.user.id },
    data: { avatarUrl: input.avatarUrl },
  });

  await recordAuditEvent({
    userId: session.user.id,
    event: "PROFILE.AVATAR_UPDATED",
  });

  return successResponse({ avatarUrl: input.avatarUrl });
});