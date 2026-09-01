import { z } from "zod";

export const startHistorySessionSchema = z.object({
  appointmentId: z.string().cuid().optional().nullable(),
  framework: z.enum(["MODERN", "AYUSH"]).optional(),
});

export const historyAnswerSchema = z.object({
  questionId: z.string().cuid(),
  answer: z.string().min(1, "Answer is required").max(4000, "Answer is too long"),
  inputType: z.enum(["TEXT", "VOICE", "TOUCH", "OTHER"]).optional(),
});

export const historySessionIdSchema = z.object({
  sessionId: z.string().cuid(),
});

export const addFactSchema = z.object({
  section: z.string().min(1, "Section is required").max(60),
  field: z.string().min(1, "Field is required").max(60),
  value: z.string().min(1, "Value is required").max(5000, "Value is too long"),
});

export const editFactSchema = z.object({
  value: z.string().min(1, "Value is required").max(5000, "Value is too long"),
});

export const flagActionSchema = z.object({
  resolution: z.string().max(1000).optional(),
});

export const listHistorySessionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z
    .enum(["NOT_STARTED", "IN_PROGRESS", "PAUSED", "PATIENT_REVIEW", "DOCTOR_REVIEW", "COMPLETED", "CANCELLED"])
    .optional(),
});

export type StartHistorySessionInput = z.infer<typeof startHistorySessionSchema>;
export type HistoryAnswerInput = z.infer<typeof historyAnswerSchema>;
export type AddFactInput = z.infer<typeof addFactSchema>;
export type EditFactInput = z.infer<typeof editFactSchema>;
export type FlagActionInput = z.infer<typeof flagActionSchema>;