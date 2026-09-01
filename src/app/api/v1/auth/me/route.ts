import { Role } from "@prisma/client";
import { db } from "@/db";
import { requireAuth } from "@/lib/auth/guards";
import { successResponse } from "@/lib/utils/api-response";
import { withErrorHandling } from "@/lib/middleware";

export const GET = withErrorHandling(async () => {
  const session = await requireAuth();

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      avatarUrl: true,
      role: true,
      isVerified: true,
      isActive: true,
      deactivatedAt: true,
      createdAt: true,
      patient: {
        select: {
          dob: true,
          gender: true,
          bloodType: true,
        },
      },
      doctor: {
        select: {
          specialty: true,
          licenseNumber: true,
          yearsOfExp: true,
          bio: true,
          education: true,
          languages: true,
          consultationFee: true,
          address: true,
          availableForConsultation: true,
        },
      },
    },
  });

  const { patient, doctor, ...withoutProfiles } = user ?? {};
  const profile =
    user?.role === Role.PATIENT ? patient : user?.role === Role.DOCTOR ? doctor : undefined;

  return successResponse({
    ...withoutProfiles,
    profile,
  });
});