import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { requireAtLeastRole } from "@/lib/auth/guards";
import { validate } from "@/lib/validators";
import { z } from "zod";
import { flagActionSchema } from "@/lib/validators/history";
import { setFlagStatus } from "@/lib/history";
import { successResponse } from "@/lib/utils/api-response";
import { withErrorHandling } from "@/lib/middleware";

const paramsSchema = z.object({ sessionId: z.string().cuid(), flagId: z.string().cuid() });
type RouteContext = { params: Promise<{ sessionId: string; flagId: string }> };

export const POST = withErrorHandling(async (req: NextRequest, context: unknown) => {
  const session = await requireAtLeastRole(Role.DOCTOR);
  const { sessionId, flagId } = validate(paramsSchema, await (context as RouteContext).params);
  const body = await req.json().catch(() => ({}));
  const input = validate(flagActionSchema, body);

  const flag = await setFlagStatus(
    { id: session.user.id, role: session.user.role },
    sessionId,
    flagId,
    "DISMISSED",
    input.resolution,
    req.headers.get("x-forwarded-for") ?? undefined
  );
  return successResponse({ id: flag.id, status: flag.status, resolvedAt: flag.resolvedAt });
});