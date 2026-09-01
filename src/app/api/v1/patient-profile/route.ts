import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { db } from "@/db";
import { requireRole } from "@/lib/auth/guards";
import { validate } from "@/lib/validators";
import { patientProfileUpdateSchema } from "@/lib/validators/profile";
import { successResponse } from "@/lib/utils/api-response";
import { ConflictError } from "@/lib/errors";
import { recordAuditEvent } from "@/lib/auth/notifications";
import { withErrorHandling } from "@/lib/middleware";

export const PUT = withErrorHandling(async (req: NextRequest) => {
  const session = await requireRole(Role.PATIENT);
  const body = await req.json().catch(() => ({}));
  const input = validate(patientProfileUpdateSchema, body);

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
      db.patientProfile.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          ...profileFields,
        },
        update: {
          ...profileFields,
        },
      }),
    ]);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConflictError("Phone number is already in use");
    }
    throw error;
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      phone: true,
      avatarUrl: true,
      patient: {
        select: { dob: true, gender: true, bloodType: true },
      },
    },
  });

  await recordAuditEvent({
    userId: session.user.id,
    event: "PROFILE.PATIENT_UPDATED",
    metadata: { fields: Object.values(input).filter((v) => v !== undefined && v !== null) },
  });

  return successResponse(user);
});

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}