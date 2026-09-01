import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/guards";
import { validate } from "@/lib/validators";
import { z } from "zod";
import { requestPatientReview } from "@/lib/history";
import { successResponse } from "@/lib/utils/api-response";
import { withErrorHandling } from "@/lib/middleware";

const sessionIdParamSchema = z.object({ sessionId: z.string().cuid() });

type RouteContext = { params: Promise<{ sessionId: string }> };

export const POST = withErrorHandling(async (req: NextRequest, context: unknown) => {
  const session = await requireRole(Role.PATIENT);
  const { sessionId } = validate(sessionIdParamSchema, await (context as RouteContext).params);

  const result = await requestPatientReview(
    sessionId,
    { id: session.user.id, role: session.user.role },
    req.headers.get("x-forwarded-for") ?? undefined
  );
  return successResponse({
    status: result.status,
    snapshot: {
      sections: result.snapshot.sections,
      summary: result.snapshot.summary,
      isVerified: result.snapshot.isVerified,
      generatedAt: result.snapshot.generatedAt,
    },
  });
});