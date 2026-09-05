import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/guards";
import { db } from "@/db";
import { successResponse } from "@/lib/utils/api-response";
import { withErrorHandling } from "@/lib/middleware";

export const GET = withErrorHandling(async (req: NextRequest) => {
  void req;
  const session = await requireRole(Role.PATIENT);

  const documents = await db.patientDocument.findMany({
    where: { patientId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      docType: true,
      historySessionId: true,
      createdAt: true,
    },
  });
  return successResponse(documents);
});
