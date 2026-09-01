import { config } from "@/lib/config";
import { extractJson } from "@/lib/ai/json";
import {
  AIProvider,
  AIProviderError,
  ClinicalExtractionResult,
  ExtractionInput,
  QuestionGenerationContext,
  QuestionSuggestion,
  SummaryInput,
  SummaryResult,
  aiConfigured,
} from "@/lib/ai/provider";
import { HISTORY_AI_SYSTEM_PROMPT } from "@/lib/ai/prompts/system";
import { buildExtractionUserPrompt } from "@/lib/ai/prompts/clinical-extraction";
import { buildQuestionUserPrompt } from "@/lib/ai/prompts/question-generation";
import { buildSummaryUserPrompt } from "@/lib/ai/prompts/summary-generation";
import {
  clinicalExtractionSchema,
  questionSuggestionSchema,
  summarySchema,
} from "@/lib/ai/schemas";

export class OpenAICompatibleProvider implements AIProvider {
  constructor(
    private options: {
      baseUrl: string;
      model: string;
      apiKey: string;
      timeoutMs: number;
    }
  ) {}

  private async complete(system: string, user: string): Promise<unknown> {
    const url = `${this.options.baseUrl.replace(/\/+$/, "")}/chat/completions`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.options.timeoutMs);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(this.options.apiKey ? { authorization: `Bearer ${this.options.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: this.options.model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          temperature: 0.2,
        }),
        signal: controller.signal,
      });
      if (!res.ok) throw new AIProviderError(`Model API responded with status ${res.status}`);
      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== "string") throw new AIProviderError("Model returned no content");
      return extractJson(content);
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new AIProviderError("Model request timed out", error);
      }
      throw new AIProviderError("Model request failed", error);
    } finally {
      clearTimeout(timer);
    }
  }

  async generateQuestion(ctx: QuestionGenerationContext): Promise<QuestionSuggestion> {
    const parsed = questionSuggestionSchema.safeParse(
      await this.complete(
        HISTORY_AI_SYSTEM_PROMPT,
        buildQuestionUserPrompt({
          sectionLabel: ctx.sectionLabel,
          factsSummary: ctx.factsSummary,
          missingInfo: ctx.missingInfo,
          recentAnswers: ctx.recentAnswers,
        })
      )
    );
    if (!parsed.success) throw new AIProviderError("Malformed question-generation output", parsed.error);
    return {
      question: parsed.data.nextQuestion,
      sectionComplete: parsed.data.sectionComplete,
    };
  }

  async extractClinicalData(input: ExtractionInput): Promise<ClinicalExtractionResult> {
    const parsed = clinicalExtractionSchema.safeParse(
      await this.complete(
        HISTORY_AI_SYSTEM_PROMPT,
        buildExtractionUserPrompt({
          sectionLabel: input.sectionLabel,
          question: input.question,
          answer: input.answer,
          allowedFields: input.allowedFields,
        })
      )
    );
    if (!parsed.success) throw new AIProviderError("Malformed extraction output", parsed.error);
    return {
      facts: parsed.data.facts,
      diagnosesProposed: parsed.data.diagnosesProposed,
      prescriptionsProposed: parsed.data.prescriptionsProposed,
    };
  }

  async generateSummary(input: SummaryInput): Promise<SummaryResult> {
    const parsed = summarySchema.safeParse(
      await this.complete(
        HISTORY_AI_SYSTEM_PROMPT,
        buildSummaryUserPrompt({
          sectionsText: input.sectionsText,
          redFlags: input.redFlags,
        })
      )
    );
    if (!parsed.success) throw new AIProviderError("Malformed summary output", parsed.error);
    return { summary: parsed.data.summary };
  }
}

export function createAIProvider(): AIProvider | null {
  if (!aiConfigured()) return null;
  return new OpenAICompatibleProvider({
    baseUrl: config.ai.chatBaseUrl,
    model: config.ai.chatModel,
    apiKey: config.ai.openaiKey,
    timeoutMs: config.ai.timeoutMs,
  });
}