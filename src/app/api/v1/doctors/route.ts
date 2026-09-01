import { Role } from "@prisma/client";
import { db } from "@/db";
import { requireRole } from "@/lib/auth/guards";
import { successResponse, errorResponse } from "@/lib/utils/api-response";

export async function GET() {
  try {
    await requireRole([Role.ADMIN, Role.DOCTOR]);
    const doctors = await db.user.findMany({
      where: { role: Role.DOCTOR },
      select: {
        id: true,
        name: true,
        email: true,
        doctor: {
          select: {
            specialty: true,
            licenseNumber: true,
            yearsOfExp: true,
          },
        },
      },
    });

    return successResponse(doctors);
  } catch (error) {
    return errorResponse(error);
  }
}