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
  switch (config.ai.provider) {
    case "openrouter":
      return config.ai.openrouter.apiKey.length > 0 && config.ai.openrouter.model.length > 0;
    case "ollama":
      return config.ai.ollama.model.length > 0;
    case "openai-compatible":
      return config.ai.chatModel.length > 0;
    default:
      return false;
  }
}

export interface AIStatus {
  provider: string;
  active: boolean;
  model: string | null;
}

export function describeAIProvider(): AIStatus {
  const provider = config.ai.provider;
  if (!aiConfigured()) return { provider, active: false, model: null };
  switch (provider) {
    case "openrouter":
      return { provider, active: true, model: config.ai.openrouter.model };
    case "ollama":
      return { provider, active: true, model: config.ai.ollama.model };
    case "openai-compatible":
      return { provider, active: true, model: config.ai.chatModel };
    default:
      return { provider, active: false, model: null };
  }
}