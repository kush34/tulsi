import { NextRequest } from "next/server";
import { Prisma, Role } from "@prisma/client";
import { db } from "@/db";
import { requireAuth, requireRole } from "@/lib/auth/guards";
import { assertResourceAccess } from "@/lib/auth/resource-access";
import { validate } from "@/lib/validators";
import {
  medicalProfileUpdateSchema,
  type MedicalProfileUpdateInput,
} from "@/lib/validators/medical-profile";
import { successResponse } from "@/lib/utils/api-response";
import { NotFoundError } from "@/lib/errors";
import { recordAuditEvent } from "@/lib/auth/notifications";
import { withErrorHandling } from "@/lib/middleware";
import { computeMedicalProfileChanges, serializeJson } from "@/lib/medical-profile";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const session = await requireAuth();
  const requestedUserId = req.nextUrl.searchParams.get("userId");

  let targetUserId = session.user.id;

  if (requestedUserId) {
    const target = await db.user.findUnique({ where: { id: requestedUserId } });
    if (!target) throw new NotFoundError("User");

    const role = session.user.role;
    if (role === Role.PATIENT && target.id !== session.user.id) {
      assertResourceAccess(session, {
        id: target.id,
        ownerUserId: target.id,
        type: "patient",
      });
    }
    targetUserId = target.id;
  }

  const profile = await db.medicalProfile.findUnique({
    where: { userId: targetUserId },
  });

  if (!profile) {
    return successResponse(null);
  }

  return successResponse({
    allergies: profile.allergies,
    conditions: profile.conditions,
    medications: profile.medications,
    surgeries: profile.surgeries,
    familyHistory: profile.familyHistory,
    socialHistory: profile.socialHistory,
    updatedAt: profile.updatedAt,
    createdAt: profile.createdAt,
  });
});

export const PUT = withErrorHandling(async (req: NextRequest) => {
  const session = await requireRole([Role.PATIENT, Role.ADMIN]);
  const body = await req.json().catch(() => ({}));
  const input = validate(medicalProfileUpdateSchema, body);

  const existing = await db.medicalProfile.findUnique({
    where: { userId: session.user.id },
  });

  const prev: MedicalProfileUpdateInput = existing
    ? {
        allergies: (existing.allergies as MedicalProfileUpdateInput["allergies"]) ?? undefined,
        conditions: (existing.conditions as MedicalProfileUpdateInput["conditions"]) ?? undefined,
        medications: (existing.medications as MedicalProfileUpdateInput["medications"]) ?? undefined,
        surgeries: (existing.surgeries as MedicalProfileUpdateInput["surgeries"]) ?? undefined,
        familyHistory: (existing.familyHistory as MedicalProfileUpdateInput["familyHistory"]) ?? undefined,
        socialHistory: (existing.socialHistory as MedicalProfileUpdateInput["socialHistory"]) || undefined,
      }
    : {};

  const next: MedicalProfileUpdateInput = {
    allergies: input.allergies !== undefined ? input.allergies : prev.allergies,
    conditions: input.conditions !== undefined ? input.conditions : prev.conditions,
    medications: input.medications !== undefined ? input.medications : prev.medications,
    surgeries: input.surgeries !== undefined ? input.surgeries : prev.surgeries,
    familyHistory: input.familyHistory !== undefined ? input.familyHistory : prev.familyHistory,
    socialHistory: input.socialHistory !== undefined ? input.socialHistory : prev.socialHistory,
  };

  const updated = await db.medicalProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      allergies: serializeJson(input.allergies),
      conditions: serializeJson(input.conditions),
      medications: serializeJson(input.medications),
      surgeries: serializeJson(input.surgeries),
      familyHistory: serializeJson(input.familyHistory),
      socialHistory: serializeJson(input.socialHistory),
    },
    update: {
      allergies: serializeJson(input.allergies),
      conditions: serializeJson(input.conditions),
      medications: serializeJson(input.medications),
      surgeries: serializeJson(input.surgeries),
      familyHistory: serializeJson(input.familyHistory),
      socialHistory: serializeJson(input.socialHistory),
    },
  });

  if (existing) {
    const changes = computeMedicalProfileChanges(prev, next);
    if (Object.keys(changes).length > 0) {
      await db.medicalProfileChange.create({
        data: {
          profileId: updated.id,
          changedBy: session.user.id,
          changes: changes as unknown as Prisma.InputJsonValue,
          ip: req.headers.get("x-forwarded-for") ?? undefined,
        },
      });
    }
  } else {
    await db.medicalProfileChange.create({
      data: {
        profileId: updated.id,
        changedBy: session.user.id,
        changes: { created: true } as unknown as Prisma.InputJsonValue,
        ip: req.headers.get("x-forwarded-for") ?? undefined,
      },
    });
  }

  await recordAuditEvent({
    userId: session.user.id,
    event: "MEDICAL_PROFILE.UPDATED",
    ip: req.headers.get("x-forwarded-for") ?? undefined,
  });

  return successResponse({
    allergies: updated.allergies,
    conditions: updated.conditions,
    medications: updated.medications,
    surgeries: updated.surgeries,
    familyHistory: updated.familyHistory,
    socialHistory: updated.socialHistory,
    updatedAt: updated.updatedAt,
  });
});