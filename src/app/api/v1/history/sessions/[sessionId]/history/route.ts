import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { validate } from "@/lib/validators";
import { z } from "zod";
import { getDraftHistory } from "@/lib/history";
import { successResponse } from "@/lib/utils/api-response";
import { withErrorHandling } from "@/lib/middleware";

const sessionIdParamSchema = z.object({ sessionId: z.string().cuid() });

type RouteContext = { params: Promise<{ sessionId: string }> };

export const GET = withErrorHandling(async (req: NextRequest, context: unknown) => {
  const session = await requireAuth();
  const { sessionId } = validate(sessionIdParamSchema, await (context as RouteContext).params);

  const draft = await getDraftHistory(sessionId, {
    id: session.user.id,
    role: session.user.role,
  });
  return successResponse(draft);
});