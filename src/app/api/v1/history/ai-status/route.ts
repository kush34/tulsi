import { requireAuth } from "@/lib/auth/guards";
import { describeAIProvider } from "@/lib/ai";
import { successResponse } from "@/lib/utils/api-response";
import { withErrorHandling } from "@/lib/middleware";

export const GET = withErrorHandling(async () => {
  await requireAuth();
  return successResponse(describeAIProvider());
});
