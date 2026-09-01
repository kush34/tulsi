import { z } from "zod";

export const allergySchema = z.object({
  name: z.string().min(1, "Allergy name is required").max(200),
  severity: z.enum(["mild", "moderate", "severe", "life-threatening"]).optional(),
  reaction: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

export const medicalConditionSchema = z.object({
  name: z.string().min(1, "Condition name is required").max(200),
  diagnosedAt: z.string().max(50).optional(),
  status: z.enum(["active", "resolved", "ongoing", "remission"]).optional(),
  notes: z.string().max(1000).optional(),
});

export const medicationSchema = z.object({
  name: z.string().min(1, "Medication name is required").max(200),
  dosage: z.string().max(100).optional(),
  frequency: z.string().max(100).optional(),
  startDate: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
});

export const surgerySchema = z.object({
  name: z.string().min(1, "Surgery name is required").max(300),
  date: z.string().max(50).optional(),
  hospital: z.string().max(300).optional(),
  notes: z.string().max(1000).optional(),
});

export const familyHistoryEntrySchema = z.object({
  condition: z.string().min(1, "Condition is required").max(300),
  relation: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

export const socialHistorySchema = z.object({
  smoking: z.string().max(100).optional(),
  alcohol: z.string().max(100).optional(),
  diet: z.string().max(500).optional(),
  exercise: z.string().max(300).optional(),
  occupation: z.string().max(300).optional(),
});

const nullableArray = <T extends z.ZodType>(schema: T) =>
  z.array(schema).max(100).nullable().optional();

export const medicalProfileUpdateSchema = z.object({
  allergies: nullableArray(allergySchema),
  conditions: nullableArray(medicalConditionSchema),
  medications: nullableArray(medicationSchema),
  surgeries: nullableArray(surgerySchema),
  familyHistory: nullableArray(familyHistoryEntrySchema),
  socialHistory: socialHistorySchema.nullable().optional(),
});

export type MedicalProfileUpdateInput = z.infer<typeof medicalProfileUpdateSchema>;

export type MedicalProfileShape = {
  allergies: z.infer<typeof allergySchema>[];
  conditions: z.infer<typeof medicalConditionSchema>[];
  medications: z.infer<typeof medicationSchema>[];
  surgeries: z.infer<typeof surgerySchema>[];
  familyHistory: z.infer<typeof familyHistoryEntrySchema>[];
  socialHistory: z.infer<typeof socialHistorySchema>;
};