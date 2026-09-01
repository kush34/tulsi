import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { validate } from "@/lib/validators";
import { z } from "zod";
import { addFactSchema } from "@/lib/validators/history";
import { addFact } from "@/lib/history";
import { successResponse } from "@/lib/utils/api-response";
import { withErrorHandling } from "@/lib/middleware";

const sessionIdParamSchema = z.object({ sessionId: z.string().cuid() });
type RouteContext = { params: Promise<{ sessionId: string }> };

export const POST = withErrorHandling(async (req: NextRequest, context: unknown) => {
  const session = await requireAuth();
  const { sessionId } = validate(sessionIdParamSchema, await (context as RouteContext).params);
  const body = await req.json().catch(() => ({}));
  const input = validate(addFactSchema, body);

  const fact = await addFact(
    { id: session.user.id, role: session.user.role },
    sessionId,
    input,
    req.headers.get("x-forwarded-for") ?? undefined
  );
  return successResponse(
    {
      id: fact.id,
      section: fact.section,
      field: fact.field,
      source: fact.source,
      verification: fact.verification,
      verifiedById: fact.verifiedById,
    },
    201
  );
});