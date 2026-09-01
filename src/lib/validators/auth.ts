import { z } from "zod";
import { Role } from "@prisma/client";

export const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be at most 72 characters")
      .regex(/[a-z]/, "Must contain a lowercase letter")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    name: z.string().min(1, "Name is required").max(100),
    phone: z.string().optional(),
    role: z.enum([Role.PATIENT, Role.DOCTOR]).default(Role.PATIENT),
    doctor: z
      .object({
        specialty: z.string().min(1, "Specialty is required"),
        licenseNumber: z.string().optional(),
        yearsOfExp: z.coerce.number().int().min(0).optional(),
      })
      .optional(),
    patient: z
      .object({
        dob: z.coerce.date().optional(),
        gender: z.string().optional(),
        bloodType: z.string().optional(),
      })
      .optional(),
  })
  .refine(
    (data) => data.role !== Role.DOCTOR || !!data.doctor,
    { message: "Doctor profile details are required", path: ["doctor"] }
  );

export type RegisterInput = z.infer<typeof registerSchema>;

export const requestOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  purpose: z.enum(["VERIFY_EMAIL", "RESET_PASSWORD"]),
});

export const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
  purpose: z.enum(["VERIFY_EMAIL", "RESET_PASSWORD"]),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});