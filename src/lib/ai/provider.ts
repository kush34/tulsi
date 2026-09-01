import { config } from "@/lib/config";

export interface ExtractedFact {
  field: string;
  value: string;
  confidence?: number;
}

export interface QuestionGenerationContext {
  section: string;
  sectionLabel: string;
  factsSummary: string;
  missingInfo: string[];
  recentAnswers: { question: string; answer: string }[];
}

export interface ExtractionInput {
  sectionLabel: string;
  question: string;
  answer: string;
  allowedFields: string[];
}

export interface SummaryInput {
  sectionsText: string;
  redFlags: string[];
}

export interface QuestionSuggestion {
  question: string;
  sectionComplete: boolean;
}

export interface ClinicalExtractionResult {
  facts: ExtractedFact[];
  diagnosesProposed: string[];
  prescriptionsProposed: string[];
}

export interface SummaryResult {
  summary: string;
}

export interface AIProvider {
  generateQuestion(ctx: QuestionGenerationContext): Promise<QuestionSuggestion>;
  extractClinicalData(input: ExtractionInput): Promise<ClinicalExtractionResult>;
  generateSummary(input: SummaryInput): Promise<SummaryResult>;
}

export class AIProviderError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "AIProviderError";
    this.cause = cause;
  }
}

export function aiConfigured(): boolean {
  return config.ai.provider === "openai-compatible" && config.ai.chatModel.length > 0;
}