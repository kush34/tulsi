import { db } from "@/db";
import { requireAuth } from "@/lib/auth/guards";
import { signOut } from "@/lib/auth";
import { successResponse } from "@/lib/utils/api-response";
import { ConflictError } from "@/lib/errors";
import { recordAuditEvent } from "@/lib/auth/notifications";
import { withErrorHandling } from "@/lib/middleware";

export const POST = withErrorHandling(async () => {
  const session = await requireAuth();

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) throw new ConflictError("User not found");
  if (!user.isActive) throw new ConflictError("Account is already deactivated");

  await db.user.update({
    where: { id: user.id },
    data: { isActive: false, deactivatedAt: new Date() },
  });

  await recordAuditEvent({
    userId: user.id,
    event: "ACCOUNT.DEACTIVATED",
    metadata: { source: "self" },
  });

  await signOut({ redirect: false });

  return successResponse({
    message: "Account deactivated. You can contact support to reactivate it.",
  });
});