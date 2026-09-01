import { NextRequest } from "next/server";
import { requireAtLeastRole } from "@/lib/auth/guards";
import { validate } from "@/lib/validators";
import { z } from "zod";
import { Role } from "@prisma/client";
import { getReviewHistory } from "@/lib/history";
import { successResponse } from "@/lib/utils/api-response";
import { withErrorHandling } from "@/lib/middleware";

const sessionIdParamSchema = z.object({ sessionId: z.string().cuid() });
type RouteContext = { params: Promise<{ sessionId: string }> };

export const GET = withErrorHandling(async (req: NextRequest, context: unknown) => {
  void req;
  const session = await requireAtLeastRole(Role.DOCTOR);
  const { sessionId } = validate(sessionIdParamSchema, await (context as RouteContext).params);
  const history = await getReviewHistory(sessionId, {
    id: session.user.id,
    role: session.user.role,
  });
  return successResponse(history);
});