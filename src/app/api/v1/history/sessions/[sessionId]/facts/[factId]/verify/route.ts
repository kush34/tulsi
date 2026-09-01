import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { requireAtLeastRole } from "@/lib/auth/guards";
import { validate } from "@/lib/validators";
import { z } from "zod";
import { verifyFact } from "@/lib/history";
import { successResponse } from "@/lib/utils/api-response";
import { withErrorHandling } from "@/lib/middleware";

const paramsSchema = z.object({ sessionId: z.string().cuid(), factId: z.string().cuid() });
type RouteContext = { params: Promise<{ sessionId: string; factId: string }> };

export const POST = withErrorHandling(async (req: NextRequest, context: unknown) => {
  const session = await requireAtLeastRole(Role.DOCTOR);
  const { sessionId, factId } = validate(paramsSchema, await (context as RouteContext).params);
  const fact = await verifyFact(
    { id: session.user.id, role: session.user.role },
    sessionId,
    factId,
    req.headers.get("x-forwarded-for") ?? undefined
  );
  return successResponse({
    id: fact.id,
    section: fact.section,
    field: fact.field,
    source: fact.source,
    verification: fact.verification,
    verifiedById: fact.verifiedById,
    verifiedAt: fact.verifiedAt,
  });
});