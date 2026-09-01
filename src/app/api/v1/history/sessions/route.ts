import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/guards";
import { validate, validateQuery } from "@/lib/validators";
import { paginationSchema } from "@/lib/utils/pagination";
import { startHistorySessionSchema } from "@/lib/validators/history";
import { createHistorySession, listHistorySessions, assembleSessionPayload } from "@/lib/history";
import { successResponse } from "@/lib/utils/api-response";
import { withErrorHandling } from "@/lib/middleware";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const session = await requireRole(Role.PATIENT);
  const body = await req.json().catch(() => ({}));
  const input = validate(startHistorySessionSchema, body);

  const created = await createHistorySession(
    { id: session.user.id, role: session.user.role },
    input,
    req.headers.get("x-forwarded-for") ?? undefined
  );

  const payload = await assembleSessionPayload(created.session.id);
  return successResponse(payload, 201);
});

export const GET = withErrorHandling(async (req: NextRequest) => {
  const session = await requireRole(Role.PATIENT);
  const { page, limit } = validateQuery(paginationSchema, req.nextUrl.searchParams);

  const result = await listHistorySessions({ id: session.user.id, role: session.user.role }, page, limit);
  return successResponse(result.data, 200, result.meta);
});