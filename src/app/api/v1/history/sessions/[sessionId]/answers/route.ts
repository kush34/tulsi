import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/guards";
import { validate } from "@/lib/validators";
import { z } from "zod";
import { historyAnswerSchema } from "@/lib/validators/history";
import { answerHistorySession } from "@/lib/history";
import { successResponse } from "@/lib/utils/api-response";
import { withErrorHandling } from "@/lib/middleware";

const sessionIdParamSchema = z.object({ sessionId: z.string().cuid() });

type RouteContext = { params: Promise<{ sessionId: string }> };

export const POST = withErrorHandling(async (req: NextRequest, context: unknown) => {
  const session = await requireRole(Role.PATIENT);
  const { sessionId } = validate(sessionIdParamSchema, await (context as RouteContext).params);

  const body = await req.json().catch(() => ({}));
  const input = validate(historyAnswerSchema, body);

  const payload = await answerHistorySession(
    { id: session.user.id, role: session.user.role },
    sessionId,
    input,
    req.headers.get("x-forwarded-for") ?? undefined
  );
  return successResponse(payload);
});