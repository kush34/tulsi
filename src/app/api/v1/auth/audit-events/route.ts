import { NextRequest } from "next/server";
import { db } from "@/db";
import { requireAuth } from "@/lib/auth/guards";
import { successResponse, errorResponse } from "@/lib/utils/api-response";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = req.nextUrl;

    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));

    const [data, total] = await Promise.all([
      db.auditEvent.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.auditEvent.count({ where: { userId: session.user.id } }),
    ]);

    return successResponse(
      data.map((e) => ({ id: e.id, event: e.event, metadata: e.metadata, createdAt: e.createdAt })),
      200,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    );
  } catch (error) {
    return errorResponse(error);
  }
}