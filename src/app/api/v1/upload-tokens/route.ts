import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/guards";
import { validate } from "@/lib/validators";
import { z } from "zod";
import { createUploadToken } from "@/lib/documents/upload-tokens";
import { successResponse } from "@/lib/utils/api-response";
import { withErrorHandling } from "@/lib/middleware";

const bodySchema = z.object({
  historySessionId: z.string().cuid().nullish(),
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const session = await requireRole(Role.PATIENT);
  const body = await req.json().catch(() => ({}));
  const input = validate(bodySchema, body);

  const token = await createUploadToken(session.user.id, input.historySessionId);
  return successResponse({ token: token.token, expiresAt: token.expiresAt }, 201);
});
