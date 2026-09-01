import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { db } from "@/db";
import { requireAuth } from "@/lib/auth/guards";
import { assertResourceAccess } from "@/lib/auth/resource-access";
import { successResponse } from "@/lib/utils/api-response";
import { NotFoundError } from "@/lib/errors";
import { withErrorHandling } from "@/lib/middleware";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const session = await requireAuth();
  const requestedUserId = req.nextUrl.searchParams.get("userId");

  let targetUserId = session.user.id;

  if (requestedUserId) {
    const target = await db.user.findUnique({ where: { id: requestedUserId } });
    if (!target) throw new NotFoundError("User");

    if (session.user.role === Role.PATIENT && target.id !== session.user.id) {
      assertResourceAccess(session, {
        id: target.id,
        ownerUserId: target.id,
        type: "patient",
      });
    }
    targetUserId = target.id;
  }

  const profile = await db.medicalProfile.findUnique({
    where: { userId: targetUserId },
  });
  if (!profile) throw new NotFoundError("Medical profile");

  const changes = await db.medicalProfileChange.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return successResponse(
    changes.map((c) => ({
      id: c.id,
      changedBy: c.changedBy,
      changes: c.changes,
      ip: c.ip,
      createdAt: c.createdAt,
    }))
  );
});