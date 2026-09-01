import { Prisma } from "@prisma/client";
import { MedicalProfileUpdateInput } from "@/lib/validators/medical-profile";

export interface FieldChange {
  from: unknown;
  to: unknown;
}

export function computeMedicalProfileChanges(
  previous: MedicalProfileUpdateInput,
  next: MedicalProfileUpdateInput
): Record<string, FieldChange> {
  const changes: Record<string, FieldChange> = {};
  const fields = [
    "allergies",
    "conditions",
    "medications",
    "surgeries",
    "familyHistory",
    "socialHistory",
  ] as const;

  for (const field of fields) {
    const prev = previous[field];
    const curr = next[field];
    if (JSON.stringify(prev ?? null) !== JSON.stringify(curr ?? null)) {
      changes[field] = { from: prev ?? null, to: curr ?? null };
    }
  }

  return changes;
}

export function serializeJson(
  value: unknown
): Prisma.InputJsonValue | Prisma.NullTypes.JsonNull | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}