import { z } from "zod";

const commonProfileFields = {
  name: z.string().min(1, "Name is required").max(100).optional(),
  phone: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, "Invalid phone number")
    .optional()
    .nullable(),
  avatarUrl: z.string().url("Invalid avatar URL").optional().nullable(),
};

export const patientProfileUpdateSchema = z.object({
  ...commonProfileFields,
  dob: z.coerce.date().optional().nullable(),
  gender: z
    .string()
    .max(20)
    .refine((v) => ["M", "F", "O", "male", "female", "other"].includes(v), "Invalid gender")
    .optional()
    .nullable(),
  bloodType: z
    .string()
    .max(5)
    .refine(
      (v) =>
        ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].includes(v.toUpperCase()),
      "Invalid blood type"
    )
    .optional()
    .nullable(),
});

export type PatientProfileUpdateInput = z.infer<typeof patientProfileUpdateSchema>;

export const doctorProfileUpdateSchema = z.object({
  ...commonProfileFields,
  specialty: z.string().min(1, "Specialty is required").max(100).optional(),
  licenseNumber: z.string().max(100).optional().nullable(),
  yearsOfExp: z.coerce.number().int().min(0).max(80).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  education: z.string().max(1000).optional().nullable(),
  languages: z.string().max(200).optional().nullable(),
  consultationFee: z.coerce.number().int().min(0).max(10_000_000).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  availableForConsultation: z.boolean().optional(),
});

export type DoctorProfileUpdateInput = z.infer<typeof doctorProfileUpdateSchema>;

export const avatarSchema = z.object({
  avatarUrl: z.string().url("Invalid avatar URL").min(1),
});

export const accountStatusSchema = z.object({
  isActive: z.boolean(),
  reason: z.string().max(500).optional(),
});