import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { db } from "@/db";
import { requireRole } from "@/lib/auth/guards";
import { validate } from "@/lib/validators";
import { accountStatusSchema } from "@/lib/validators/profile";
import { successResponse } from "@/lib/utils/api-response";
import { NotFoundError } from "@/lib/errors";
import { recordAuditEvent } from "@/lib/auth/notifications";
import { withErrorHandling } from "@/lib/middleware";

export const POST = withErrorHandling(async (req: NextRequest) => {
  await requireRole(Role.ADMIN);

  const userId = req.nextUrl.pathname.split("/").filter(Boolean).pop();
  if (!userId) throw new NotFoundError("User");

  const body = await req.json().catch(() => ({}));
  const input = validate(accountStatusSchema, body);

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User");

  await db.user.update({
    where: { id: user.id },
    data: {
      isActive: input.isActive,
      deactivatedAt: input.isActive ? null : new Date(),
    },
  });

  await recordAuditEvent({
    userId: user.id,
    event: input.isActive ? "ACCOUNT.REACTIVATED" : "ACCOUNT.DEACTIVATED",
    metadata: { source: "admin", reason: input.reason },
  });

  return successResponse({
    id: user.id,
    isActive: input.isActive,
    message: input.isActive ? "Account reactivated" : "Account deactivated",
  });
});

export const DELETE = withErrorHandling(async (req: NextRequest) => {
  await requireRole(Role.ADMIN);

  const userId = req.nextUrl.pathname.split("/").filter(Boolean).pop();
  if (!userId) throw new NotFoundError("User");

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User");

  await db.user.delete({ where: { id: user.id } });

  await recordAuditEvent({
    event: "ACCOUNT.DELETED",
    metadata: { userId: user.id, source: "admin" },
  });

  return successResponse({ message: "Account permanently deleted" });
});