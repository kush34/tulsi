import { z } from "zod";

const FORBIDDEN_FACT_FIELDS = [
  "diagnosis",
  "diagnoses",
  "provisional diagnosis",
  "prescription",
  "prescriptions",
  "treatment",
  "treatment plan",
  "medication advice",
  "drug recommendation",
  "next steps",
];

export const extractionFactSchema = z
  .object({
    field: z.string().min(1).max(40),
    value: z.string().min(1).max(500),
    confidence: z.number().min(0).max(1).optional(),
  })
  .refine((fact) => {
    const lower = fact.field.trim().toLowerCase();
    return !FORBIDDEN_FACT_FIELDS.includes(lower);
  }, "Extracted facts must not contain clinical decision content (diagnosis, prescription, or treatment)");

export const clinicalExtractionSchema = z.object({
  facts: z.array(extractionFactSchema).max(50).default([]),
  diagnosesProposed: z.array(z.string().max(200)).default([]),
  prescriptionsProposed: z.array(z.string().max(200)).default([]),
});

export const questionSuggestionSchema = z.object({
  nextQuestion: z.string().max(400).default(""),
  sectionComplete: z.boolean().default(false),
});

export const summarySchema = z.object({
  summary: z.string().min(1).max(5000),
});

export type ClinicalExtractionOutput = z.infer<typeof clinicalExtractionSchema>;
export type QuestionSuggestionOutput = z.infer<typeof questionSuggestionSchema>;
export type SummaryOutput = z.infer<typeof summarySchema>;