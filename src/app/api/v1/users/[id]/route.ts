import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { db } from "@/db";
import { requireAuth } from "@/lib/auth/guards";
import { assertResourceAccess } from "@/lib/auth/resource-access";
import { successResponse } from "@/lib/utils/api-response";
import { NotFoundError } from "@/lib/errors";
import { withErrorHandling } from "@/lib/middleware";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const userId = req.nextUrl.pathname.split("/").filter(Boolean).pop();
  if (!userId) throw new NotFoundError("User");

  const session = await requireAuth();

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isVerified: true,
    },
  });

  if (!user) throw new NotFoundError("User");

  assertResourceAccess(session, {
    id: user.id,
    ownerUserId: user.id,
    type: user.role === Role.PATIENT ? "patient" : user.role === Role.DOCTOR ? "doctor" : "admin",
  });

  return successResponse(user);
});