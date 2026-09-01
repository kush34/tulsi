import { db } from "@/db";
import { requireAuth } from "@/lib/auth/guards";
import { signOut } from "@/lib/auth";
import { successResponse } from "@/lib/utils/api-response";
import { recordAuditEvent } from "@/lib/auth/notifications";
import { withErrorHandling } from "@/lib/middleware";

export const DELETE = withErrorHandling(async () => {
  const session = await requireAuth();

  await db.$transaction(async (tx) => {
    await tx.user.delete({
      where: { id: session.user.id },
    });
  });

  await recordAuditEvent({
    event: "ACCOUNT.DELETED",
    metadata: { userId: session.user.id },
  });

  await signOut({ redirect: false });

  return successResponse({ message: "Account permanently deleted" });
});