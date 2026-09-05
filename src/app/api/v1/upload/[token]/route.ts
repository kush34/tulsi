import { NextRequest } from "next/server";
import { resolveUploadToken } from "@/lib/documents/upload-tokens";
import { NotFoundError } from "@/lib/errors";
import { successResponse } from "@/lib/utils/api-response";
import { withErrorHandling } from "@/lib/middleware";

type RouteContext = { params: Promise<{ token: string }> };

export const GET = withErrorHandling(async (_req: NextRequest, context: unknown) => {
  const { token } = await (context as RouteContext).params;
  const record = await resolveUploadToken(token);
  if (!record) throw new NotFoundError("Upload link");
  return successResponse({ valid: true, expiresAt: record.expiresAt });
});
