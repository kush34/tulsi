import { NextRequest } from "next/server";
import { signOut } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { recordAuditEvent } from "@/lib/auth/notifications";

export async function POST(req: NextRequest) {
  try {
    await signOut({ redirect: false });
    await recordAuditEvent({
      event: "AUTH.SIGN_OUT",
      ip: req.headers.get("x-forwarded-for") ?? undefined,
    });
    return successResponse({ message: "Signed out successfully" });
  } catch (error) {
    return errorResponse(error);
  }
}