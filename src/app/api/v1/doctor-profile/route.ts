import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { db } from "@/db";
import { requireRole } from "@/lib/auth/guards";
import { validate } from "@/lib/validators";
import { doctorProfileUpdateSchema } from "@/lib/validators/profile";
import { successResponse } from "@/lib/utils/api-response";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { recordAuditEvent } from "@/lib/auth/notifications";
import { withErrorHandling } from "@/lib/middleware";

export const PUT = withErrorHandling(async (req: NextRequest) => {
  const session = await requireRole(Role.DOCTOR);
  const body = await req.json().catch(() => ({}));
  const input = validate(doctorProfileUpdateSchema, body);

  const doctorProfile = await db.doctorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!doctorProfile) throw new NotFoundError("Doctor profile");

  const { name, phone, avatarUrl, ...profileFields } = input;

  try {
    await db.$transaction([
      db.user.update({
        where: { id: session.user.id },
        data: {
          name: name ?? undefined,
          phone: phone === undefined ? undefined : phone ?? null,
          avatarUrl: avatarUrl === undefined ? undefined : avatarUrl ?? null,
        },
      }),
      db.doctorProfile.update({
        where: { userId: session.user.id },
        data: {
          specialty: profileFields.specialty ?? undefined,
          licenseNumber:
            profileFields.licenseNumber === undefined ? undefined : profileFields.licenseNumber ?? null,
          yearsOfExp: profileFields.yearsOfExp === undefined ? undefined : profileFields.yearsOfExp ?? null,
          bio: profileFields.bio === undefined ? undefined : profileFields.bio ?? null,
          education: profileFields.education === undefined ? undefined : profileFields.education ?? null,
          languages: profileFields.languages === undefined ? undefined : profileFields.languages ?? null,
          consultationFee:
            profileFields.consultationFee === undefined ? undefined : profileFields.consultationFee ?? null,
          address: profileFields.address === undefined ? undefined : profileFields.address ?? null,
          availableForConsultation:
            profileFields.availableForConsultation ??
            doctorProfile.availableForConsultation,
        },
      }),
    ]);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConflictError("Phone number is already in use");
    }
    throw error;
  }

  const doctor = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      phone: true,
      avatarUrl: true,
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

  await recordAuditEvent({
    userId: session.user.id,
    event: "PROFILE.DOCTOR_UPDATED",
  });

  return successResponse(doctor);
});

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}