import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { validate } from "@/lib/validators";
import { z } from "zod";
import { editFactSchema } from "@/lib/validators/history";
import { editFact } from "@/lib/history";
import { successResponse } from "@/lib/utils/api-response";
import { withErrorHandling } from "@/lib/middleware";

const paramsSchema = z.object({ sessionId: z.string().cuid(), factId: z.string().cuid() });
type RouteContext = { params: Promise<{ sessionId: string; factId: string }> };

export const PATCH = withErrorHandling(async (req: NextRequest, context: unknown) => {
  const session = await requireAuth();
  const { sessionId, factId } = validate(paramsSchema, await (context as RouteContext).params);
  const body = await req.json().catch(() => ({}));
  const input = validate(editFactSchema, body);

  const fact = await editFact(
    { id: session.user.id, role: session.user.role },
    sessionId,
    factId,
    input.value,
    req.headers.get("x-forwarded-for") ?? undefined
  );
  return successResponse({
    id: fact.id,
    section: fact.section,
    field: fact.field,
    source: fact.source,
    verification: fact.verification,
    verifiedById: fact.verifiedById,
  });
});