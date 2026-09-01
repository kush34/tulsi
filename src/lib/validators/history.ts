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

export type StartHistorySessionInput = z.infer<typeof startHistorySessionSchema>;
export type HistoryAnswerInput = z.infer<typeof historyAnswerSchema>;