import { successResponse, errorResponse } from "@/lib/utils/api-response";

export async function GET() {
  try {
    return successResponse({
      version: "v1",
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
